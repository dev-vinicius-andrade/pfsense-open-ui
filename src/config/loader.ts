import { parse } from 'smol-toml';
import { configSchema, type AppConfig } from './schema';
import { defaultConfig } from './defaults';

export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.toml');
    if (!response.ok) {
      console.warn('Config file not found, using defaults');
      return defaultConfig;
    }
    const text = await response.text();
    const parsed = parse(text);
    const validated = configSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('Failed to load config:', error);
    return defaultConfig;
  }
}