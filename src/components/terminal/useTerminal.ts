import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTheme } from '@mui/material/styles';
import { executeCommand } from '@/api/modules/system';
import { CommandHistory } from './commandHistory';
import { getTerminalTheme } from './terminalTheme';

const MAX_INPUT_LENGTH = 4096;
const RATE_LIMIT_MS = 200;

interface UseTerminalOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
}

export function useTerminal({ containerRef, enabled }: UseTerminalOptions) {
  const theme = useTheme();
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const historyRef = useRef(new CommandHistory());
  const inputBufferRef = useRef('');
  const lastSubmitRef = useRef(0);
  const isProcessingRef = useRef(false);

  const writeColored = useCallback((text: string) => {
    const term = terminalRef.current;
    if (!term) return;

    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (/error|fail|denied|refused/.test(lower)) {
        term.writeln(`\x1b[31m${line}\x1b[0m`);
      } else if (/warning|warn/.test(lower)) {
        term.writeln(`\x1b[33m${line}\x1b[0m`);
      } else {
        term.writeln(line);
      }
    }
  }, []);

  const submitCommand = useCallback(async () => {
    const command = inputBufferRef.current.trim();
    if (!command) {
      terminalRef.current?.write('\r\n$ ');
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < RATE_LIMIT_MS) {
      terminalRef.current?.writeln('\r\nRate limited. Please wait.');
      terminalRef.current?.write('$ ');
      return;
    }

    if (command.length > MAX_INPUT_LENGTH) {
      terminalRef.current?.writeln(`\r\nCommand exceeds maximum length of ${MAX_INPUT_LENGTH} characters.`);
      terminalRef.current?.write('$ ');
      return;
    }

    // Strip null bytes
    const sanitized = command.replace(/\0/g, '');

    lastSubmitRef.current = now;
    isProcessingRef.current = true;
    historyRef.current.add(sanitized);
    inputBufferRef.current = '';

    terminalRef.current?.writeln('');

    try {
      const response = await executeCommand(sanitized);
      const output = response.data?.output ?? '(no output)';
      writeColored(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error executing command.';
      terminalRef.current?.writeln(`\x1b[31mError: ${message}\x1b[0m`);
    } finally {
      isProcessingRef.current = false;
      terminalRef.current?.write('$ ');
    }
  }, [writeColored]);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
      convertEol: true,
      scrollback: 5000,
      theme: getTerminalTheme(theme),
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    // Initial fit after DOM settles
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        /* container may not be sized yet */
      }
    });

    term.write('\x1b[33m=== pfSense Interactive Terminal ===\x1b[0m\r\n');
    term.write('\x1b[90mAll commands are logged and audited.\x1b[0m\r\n');
    term.write('\x1b[90mType commands and press Enter to execute.\x1b[0m\r\n\r\n');
    term.write('$ ');

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle keyboard input
    const dataDisposable = term.onData((data: string) => {
      if (isProcessingRef.current) return;

      // Handle special keys
      if (data === '\r') {
        // Enter
        void submitCommand();
        return;
      }

      if (data === '\x1b[A') {
        // Up arrow
        const prev = historyRef.current.previous();
        if (prev !== undefined) {
          // Clear current line and replace
          term.write('\r\x1b[K$ ' + prev);
          inputBufferRef.current = prev;
        }
        return;
      }

      if (data === '\x1b[B') {
        // Down arrow
        const next = historyRef.current.next();
        if (next !== undefined) {
          term.write('\r\x1b[K$ ' + next);
          inputBufferRef.current = next;
        }
        return;
      }

      if (data === '\x7f' || data === '\b') {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      if (data === '\x03') {
        // Ctrl+C
        term.write('^C\r\n$ ');
        inputBufferRef.current = '';
        return;
      }

      if (data === '\x0c') {
        // Ctrl+L — clear screen
        term.clear();
        term.write('$ ' + inputBufferRef.current);
        return;
      }

      // Regular printable characters
      if (data.length === 1 && data.charCodeAt(0) >= 32) {
        if (inputBufferRef.current.length < MAX_INPUT_LENGTH) {
          inputBufferRef.current += data;
          term.write(data);
        }
      }
    });

    // Handle resize
    const handleResize = () => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch {
          /* ignore fit errors during transitions */
        }
      });
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      dataDisposable.dispose();
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [enabled, containerRef, theme, submitCommand]);

  // Update theme when MUI theme changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = getTerminalTheme(theme);
    }
  }, [theme]);

  return {
    clearHistory: () => historyRef.current.clear(),
  };
}