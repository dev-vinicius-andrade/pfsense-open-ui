export interface RouteMeta {
  title: string;
  breadcrumb?: string;
  icon?: string;
  requiredPermissions?: string[];
}

export interface RouteConfig {
  path: string;
  meta: RouteMeta;
  children?: RouteConfig[];
}