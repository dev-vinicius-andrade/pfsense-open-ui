import type { AppConfig } from './schema';

export const defaultConfig: AppConfig = {
  theme: { scheme: 'default-teal', mode: 'auto' },
  layout: { preset: 'relaxed' },
  menu: {},
  dashboard: {},
  defaults: { landingPage: '/dashboard' },
};