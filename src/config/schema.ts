import { z } from 'zod';

const themeSchema = z.object({
  scheme: z.string().default('default-teal'),
  mode: z.enum(['light', 'dark', 'auto']).default('auto'),
  custom: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const layoutSchema = z.object({
  preset: z.enum(['enterprise', 'relaxed', 'custom']).default('relaxed'),
  sidebarWidth: z.number().min(200).max(400).optional(),
  density: z.enum(['compact', 'comfortable']).optional(),
  fontScale: z.number().min(0.8).max(1.4).optional(),
});

const customMenuItemSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  icon: z.string().optional(),
});

const menuSchema = z.object({
  order: z.array(z.string()).optional(),
  hidden: z.array(z.string()).optional(),
  favorites: z.array(z.string()).optional(),
  customLabels: z.record(z.string(), z.string()).optional(),
  customIcons: z.record(z.string(), z.string()).optional(),
  customItems: z.array(customMenuItemSchema).optional(),
});

const dashboardWidgetSchema = z.object({
  id: z.string(),
  visible: z.boolean().default(true),
  order: z.number(),
});

// Base fields shared by all custom widgets
const customWidgetBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  refreshInterval: z.number().min(5).max(300).default(30),
  accentColor: z.string().optional(),
});

// Config-driven widget: selects a data source + display type
const configWidgetSchema = customWidgetBaseSchema.extend({
  type: z.literal('config'),
  dataSource: z.string().min(1),
  displayType: z.enum([
    'gauge',
    'stat-card',
    'line-chart',
    'bar-chart',
    'table',
    'list',
    'status-indicator',
  ]),
  fieldMapping: z.record(z.string(), z.string()).optional(),
  thresholds: z
    .array(
      z.object({
        value: z.number(),
        color: z.string(),
        label: z.string().optional(),
      }),
    )
    .optional(),
});

// Template-based widget: user-provided HTML template
const templateWidgetSchema = customWidgetBaseSchema.extend({
  type: z.literal('template'),
  template: z.string().min(1).max(10240),
  css: z.string().max(5120).optional(),
  apiEndpoints: z.array(z.string()).max(5).optional(),
});

export const customWidgetSchema = z.discriminatedUnion('type', [
  configWidgetSchema,
  templateWidgetSchema,
]);

export type CustomWidget = z.infer<typeof customWidgetSchema>;
export type ConfigWidget = z.infer<typeof configWidgetSchema>;
export type TemplateWidget = z.infer<typeof templateWidgetSchema>;

const dashboardSchema = z.object({
  widgets: z.array(dashboardWidgetSchema).optional(),
  customWidgets: z.array(customWidgetSchema).optional(),
});

const defaultsSchema = z.object({
  landingPage: z.string().default('/dashboard'),
});

export const configSchema = z.object({
  theme: themeSchema.default(() => ({ scheme: 'default-teal', mode: 'auto' as const })),
  layout: layoutSchema.default(() => ({ preset: 'relaxed' as const })),
  menu: menuSchema.default(() => ({})),
  dashboard: dashboardSchema.default(() => ({})),
  defaults: defaultsSchema.default(() => ({ landingPage: '/dashboard' })),
});

export type AppConfig = z.infer<typeof configSchema>;