import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import type { TemplateWidget } from '@/config/schema';
import { DATA_SOURCE_REGISTRY } from './dataSourceRegistry';
import { get } from '@/api/client';

interface TemplateWidgetRendererProps {
  widget: TemplateWidget;
}

interface ApiRequestMessage {
  type: 'api-request';
  endpoint: string;
  requestId: string;
}

interface ApiResponseMessage {
  type: 'api-response';
  requestId: string;
  data: unknown;
  error?: string;
}

function isApiRequestMessage(msg: unknown): msg is ApiRequestMessage {
  if (msg == null || typeof msg !== 'object') return false;
  const obj = msg as Record<string, unknown>;
  return (
    obj.type === 'api-request' &&
    typeof obj.endpoint === 'string' &&
    typeof obj.requestId === 'string'
  );
}

function findDataSourceByEndpointOrId(endpointOrId: string) {
  return DATA_SOURCE_REGISTRY.find(
    (ds) => ds.id === endpointOrId || ds.endpoint === endpointOrId,
  );
}

function buildSrcDoc(widget: TemplateWidget): string {
  const csp =
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';";
  const cssBlock = widget.css ? `<style>${widget.css}</style>` : '';

  const helperScript = `
<script>
(function() {
  var pendingRequests = {};
  var requestIdCounter = 0;

  window.fetchAPI = function(endpoint) {
    return new Promise(function(resolve, reject) {
      var requestId = 'req_' + (++requestIdCounter) + '_' + Date.now();
      pendingRequests[requestId] = { resolve: resolve, reject: reject };
      parent.postMessage({ type: 'api-request', endpoint: endpoint, requestId: requestId }, '*');
      setTimeout(function() {
        if (pendingRequests[requestId]) {
          delete pendingRequests[requestId];
          reject(new Error('Request timeout for ' + endpoint));
        }
      }, 30000);
    });
  };

  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || data.type !== 'api-response') return;
    var pending = pendingRequests[data.requestId];
    if (!pending) return;
    delete pendingRequests[data.requestId];
    if (data.error) {
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.data);
    }
  });
})();
</script>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
${cssBlock}
</head>
<body>
${widget.template}
${helperScript}
</body>
</html>`;
}

export function TemplateWidgetRenderer({ widget }: TemplateWidgetRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const whitelistedEndpoints = widget.apiEndpoints ?? [];

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      if (event.source !== iframe.contentWindow) return;
      if (!isApiRequestMessage(event.data)) return;

      const { endpoint, requestId } = event.data;

      if (!whitelistedEndpoints.includes(endpoint)) {
        const errorResponse: ApiResponseMessage = {
          type: 'api-response',
          requestId,
          data: null,
          error: `Endpoint not whitelisted: ${endpoint}`,
        };
        iframe.contentWindow.postMessage(errorResponse, '*');
        return;
      }

      const matchingSource = findDataSourceByEndpointOrId(endpoint);
      if (!matchingSource) {
        const errorResponse: ApiResponseMessage = {
          type: 'api-response',
          requestId,
          data: null,
          error: `Unknown endpoint: ${endpoint}`,
        };
        iframe.contentWindow.postMessage(errorResponse, '*');
        return;
      }

      try {
        const data = await get(matchingSource.endpoint);
        const response: ApiResponseMessage = {
          type: 'api-response',
          requestId,
          data,
        };
        iframe.contentWindow?.postMessage(response, '*');
      } catch (err) {
        const errorResponse: ApiResponseMessage = {
          type: 'api-response',
          requestId,
          data: null,
          error: err instanceof Error ? err.message : 'Fetch failed',
        };
        iframe.contentWindow?.postMessage(errorResponse, '*');
      }
    },
    [whitelistedEndpoints],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  if (hasError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load template widget
      </Alert>
    );
  }

  const srcDoc = buildSrcDoc(widget);

  return (
    <Box sx={{ position: 'relative', minHeight: 100 }}>
      {!isLoaded && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        title={`Custom widget: ${widget.title}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          minHeight: 100,
          border: 'none',
          display: isLoaded ? 'block' : 'none',
        }}
        aria-label={`Custom widget: ${widget.title}`}
      />
    </Box>
  );
}