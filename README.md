# pfSense Open UI

A modern React + Material UI web interface for [pfSense](https://www.pfsense.org/) CE 2.9.0+, built as a replacement for the stock webConfigurator. Consumes the [pfSense REST API v2](https://github.com/pfrest/pfSense-pkg-RESTAPI).

**🔗 Live Demo:** [https://dev-vinicius-andrade.github.io/pfsense-open-ui/](https://dev-vinicius-andrade.github.io/pfsense-open-ui/)

## Features

- **Dashboard** — System stats (CPU/memory/disk gauges), gateway status, interface overview, service status
- **Firewall Rules** — Full CRUD with drag-to-reorder, optimistic enable/disable toggle, alias support
- **Interfaces** — WAN/LAN/OPT configuration, VLANs, bridges, with connectivity-loss warnings
- **NAT** — Port forwarding, outbound NAT, 1:1 NAT with tabbed interface
- **VPN** — OpenVPN, WireGuard, IPsec management with live status indicators
- **Services** — DHCP server, DNS resolver, NTP, SSH, cron jobs
- **System** — User/group management, certificates, firmware updates, diagnostics, reboot/shutdown with double-confirmation
- **Monitoring** — Live traffic graphs, real-time log viewer, state table browser, gateway latency sparklines

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework with Compiler, Actions, `useOptimistic` |
| TypeScript 5 | Type safety across 200+ API endpoints |
| MUI v6 | Component library (teal/slate/amber theme, dark mode) |
| Vite 6 | Build tool with HMR and dev proxy |
| TanStack Query v5 | Server state management with caching and optimistic updates |
| Zustand 5 | Lightweight client state (auth, UI preferences) |
| React Router v7 | Routing with nested layouts and auth guards |
| @dnd-kit | Drag-and-drop for firewall rule reordering |
| Recharts | Traffic graphs and monitoring charts |
| notistack | Toast notifications for mutation feedback |

## Prerequisites

- **pfSense CE 2.7.0+** or **pfSense Plus 23.01+**
- **pfSense-pkg-RESTAPI** package installed ([GitHub](https://github.com/pfrest/pfSense-pkg-RESTAPI))
- REST API enabled in pfSense (System > REST API > Settings)

## Installation on pfSense

### Quick Install (Recommended)

SSH into your pfSense appliance or use Diagnostics > Command Prompt, then run:

```sh
curl -sSL https://raw.githubusercontent.com/dev-vinicius-andrade/pfsense-open-ui/main/install.sh | sh
```

This script will:
1. Download the latest release from GitHub
2. Extract static files to `/usr/local/www/pfsense-open-ui/`
3. Configure nginx to serve the UI on port **8443** (HTTPS, using pfSense's existing certificate)
4. Create an rc script for persistence across reboots
5. Apply security headers (CSP, X-Frame-Options, etc.)

### Custom Port

```sh
curl -sSL https://raw.githubusercontent.com/dev-vinicius-andrade/pfsense-open-ui/main/install.sh | sh -s -- --port 9443
```

### Uninstall

```sh
curl -sSL https://raw.githubusercontent.com/dev-vinicius-andrade/pfsense-open-ui/main/install.sh | sh -s -- --uninstall
```

### Post-Installation Checklist

1. **Install the REST API package**: System > Package Manager > Available Packages > `pfSense-pkg-RESTAPI`
2. **Enable the REST API**: System > REST API > Settings > Enable
3. **Allow the UI port through the firewall**: Firewall > Rules > select your management interface > Add rule allowing TCP port 8443
4. **Access the UI**: Navigate to `https://<pfsense-ip>:8443`

### Manual Installation

If you prefer not to use the install script:

```sh
# Download and extract
fetch -o /tmp/pfsense-open-ui.tar.gz https://github.com/dev-vinicius-andrade/pfsense-open-ui/releases/latest/download/pfsense-open-ui.tar.gz
mkdir -p /usr/local/www/pfsense-open-ui
tar xzf /tmp/pfsense-open-ui.tar.gz -C /usr/local/www/pfsense-open-ui --strip-components=1

# Add nginx server block (see install.sh for the config template)
# Then reload: /usr/local/sbin/nginx -s reload
```

## Development

```bash
# Clone and install
git clone https://github.com/dev-vinicius-andrade/pfsense-open-ui.git
cd pfsense-open-ui
npm install

# Start dev server (proxies API calls to your pfSense)
VITE_DEV_PROXY_TARGET=https://192.168.1.1 npm run dev

# Build for production
npm run build

# Build for demo/GitHub Pages
VITE_DEMO_MODE=true npm run build
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_PFSENSE_API_URL` | pfSense REST API base URL | `/api/v2` |
| `VITE_DEV_PROXY_TARGET` | Dev proxy target for CORS bypass | `https://192.168.1.1` |
| `VITE_DEMO_MODE` | Enable mock data mode (`true` for GitHub Pages) | `false` |
| `VITE_APP_TITLE` | Application title | `pfSense UI` |

## Architecture

See the architecture decision record in the vault: [`architecture/decisions/2026-11-23-01-tech-stack-and-api-integration.md`](https://github.com/dev-vinicius-andrade/pfsense-open-ui/blob/main/docs/architecture.md)

Key design decisions:
- **No Redux** — TanStack Query handles server state; Zustand handles minimal client state
- **SessionStorage for auth tokens** — Not localStorage (XSS-safe per ADR)
- **Separate port deployment** — Does not override stock pfSense UI; safe coexistence
- **Apply Changes pattern** — Mutations are batched locally, applied explicitly via pfSense API
- **Optimistic updates** — Toggle/reorder operations update UI instantly with rollback on failure

## License

MIT