import type { ColorSchemeDefinition } from './types';
import { defaultTeal } from './default-teal';
import { dracula } from './dracula';
import { catppuccinMocha } from './catppuccin-mocha';
import { catppuccinLatte } from './catppuccin-latte';
import { tokyoNight } from './tokyo-night';
import { nord } from './nord';
import { gruvboxDark } from './gruvbox-dark';
import { solarizedDark } from './solarized-dark';
import { oneDarkPro } from './one-dark-pro';
import { githubDark } from './github-dark';

export const colorSchemes: Record<string, ColorSchemeDefinition> = {
  'default-teal': defaultTeal,
  'dracula': dracula,
  'catppuccin-mocha': catppuccinMocha,
  'catppuccin-latte': catppuccinLatte,
  'tokyo-night': tokyoNight,
  'nord': nord,
  'gruvbox-dark': gruvboxDark,
  'solarized-dark': solarizedDark,
  'one-dark-pro': oneDarkPro,
  'github-dark': githubDark,
};

export type { ColorSchemeDefinition };