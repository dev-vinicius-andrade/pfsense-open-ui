#!/bin/sh
# pfSense Open UI - Installation Script
# Installs the modern React UI as a static site served by pfSense's nginx on port 8443
#
# Usage: curl -sSL https://raw.githubusercontent.com/dev-vinicius-andrade/pfsense-open-ui/main/install.sh | sh
# Or:    sh install.sh [--port PORT] [--uninstall]
#
# Requirements:
#   - pfSense CE 2.7.0+ or pfSense Plus 23.01+
#   - pfSense-pkg-RESTAPI package installed (System > Package Manager)
#   - Root shell access (Diagnostics > Command Prompt or SSH)

set -e

PORT="${1:-8500}"
INSTALL_DIR="/usr/local/www/pfsense-open-ui"
NGINX_CONF="/var/etc/nginx-pfsense-open-ui.conf"
RC_SCRIPT="/usr/local/etc/rc.d/pfsense-open-ui.sh"
RELEASE_URL="https://github.com/dev-vinicius-andrade/pfsense-open-ui/releases/latest/download/pfsense-open-ui.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo "${GREEN}[INFO]${NC} $1"; }
warn()  { echo "${YELLOW}[WARN]${NC} $1"; }
error() { echo "${RED}[ERROR]${NC} $1"; exit 1; }

# Parse arguments
UNINSTALL=false
for arg in "$@"; do
    case "$arg" in
        --uninstall) UNINSTALL=true ;;
        --port) shift; PORT="$1" ;;
        --help|-h)
            echo "Usage: sh install.sh [--port PORT] [--uninstall]"
            echo ""
            echo "Options:"
            echo "  --port PORT     Port to serve the UI on (default: 8443)"
            echo "  --uninstall     Remove the UI and all configuration"
            echo "  --help          Show this help message"
            exit 0
            ;;
    esac
done

# Uninstall mode
if [ "$UNINSTALL" = true ]; then
    info "Uninstalling pfSense Open UI..."
    [ -d "$INSTALL_DIR" ] && rm -rf "$INSTALL_DIR" && info "Removed $INSTALL_DIR"
    [ -f "$NGINX_CONF" ] && rm -f "$NGINX_CONF" && info "Removed nginx config"
    [ -f "$RC_SCRIPT" ] && rm -f "$RC_SCRIPT" && info "Removed rc script"
    # Reload nginx to remove the server block
    /usr/local/sbin/nginx -c /var/etc/nginx-webConfigurator.conf -s reload 2>/dev/null || true
    info "Uninstall complete."
    exit 0
fi

# Pre-flight checks
info "Checking prerequisites..."

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root. Use SSH or Diagnostics > Command Prompt."
fi

# Check pfSense version
if ! command -v pfsense-version >/dev/null 2>&1; then
    PFSENSE_VERSION=$(cat /etc/version 2>/dev/null || echo "unknown")
else
    PFSENSE_VERSION=$(pfsense-version)
fi
info "Detected pfSense version: $PFSENSE_VERSION"

# Check if REST API package is installed
if [ ! -f "/usr/local/pkg/restapi/" ]; then
    warn "pfSense-pkg-RESTAPI does not appear to be installed."
    warn "The UI requires the REST API package to communicate with pfSense."
    warn "Install it via: System > Package Manager > Available Packages > pfSense-pkg-RESTAPI"
    warn ""
    warn "Continuing installation anyway — you can install the package later."
fi

# Download release
info "Downloading latest release from GitHub..."
TMPFILE=$(mktemp /tmp/pfsense-open-ui.XXXXXX.tar.gz)
if command -v fetch >/dev/null 2>&1; then
    fetch -o "$TMPFILE" "$RELEASE_URL" || error "Failed to download release. Check network connectivity."
elif command -v curl >/dev/null 2>&1; then
    curl -sSL -o "$TMPFILE" "$RELEASE_URL" || error "Failed to download release. Check network connectivity."
else
    error "Neither fetch nor curl found. Cannot download release."
fi

# Extract to install directory
info "Installing to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
tar xzf "$TMPFILE" -C "$INSTALL_DIR" --strip-components=1
rm -f "$TMPFILE"
info "Files extracted successfully."

# Create nginx config for the UI
info "Configuring nginx on port $PORT..."
cat > "$NGINX_CONF" << NGINX_EOF
server {
    listen $PORT ssl;
    server_name _;

    ssl_certificate /etc/ssl/webgui.crt;
    ssl_certificate_key /etc/ssl/webgui.key;

    root $INSTALL_DIR;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # SPA fallback — all routes serve index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
NGINX_EOF
info "Nginx config written to $NGINX_CONF"

# Include our config in the main nginx config
MAIN_NGINX="/var/etc/nginx-webConfigurator.conf"
INCLUDE_LINE="include $NGINX_CONF;"
if ! grep -qF "$INCLUDE_LINE" "$MAIN_NGINX" 2>/dev/null; then
    # Add include before the last closing brace
    sed -i.bak "\$i\\$INCLUDE_LINE" "$MAIN_NGINX"
    info "Added include directive to main nginx config"
else
    info "Include directive already present in nginx config"
fi

# Test nginx config before reloading
if /usr/local/sbin/nginx -t -c "$MAIN_NGINX" 2>/dev/null; then
    /usr/local/sbin/nginx -s reload 2>/dev/null || true
    info "Nginx reloaded successfully"
else
    warn "Nginx config test failed. You may need to manually check $MAIN_NGINX"
fi

# Create rc script for persistence across reboots
cat > "$RC_SCRIPT" << RC_EOF
#!/bin/sh
# pfSense Open UI - ensure nginx includes our config after reboot
REQUIRE: NETWORKING
BEFORE: LOGIN

case "\$1" in
    start)
        MAIN_NGINX="/var/etc/nginx-webConfigurator.conf"
        INCLUDE_LINE="include $NGINX_CONF;"
        if [ -f "$NGINX_CONF" ] && ! grep -qF "\$INCLUDE_LINE" "\$MAIN_NGINX" 2>/dev/null; then
            sed -i "\\\$i\\\\\$INCLUDE_LINE" "\$MAIN_NGINX"
        fi
        ;;
    stop)
        ;;
esac
RC_EOF
chmod +x "$RC_SCRIPT"
info "Created rc script for boot persistence"

# Print summary
echo ""
echo "=============================================="
echo "  pfSense Open UI installed successfully!"
echo "=============================================="
echo ""
echo "  URL:      https://$(hostname):$PORT"
echo "  Location: $INSTALL_DIR"
echo "  Port:     $PORT"
echo ""
echo "  Prerequisites:"
echo "    1. Install pfSense-pkg-RESTAPI package"
echo "       (System > Package Manager > Available Packages)"
echo "    2. Enable the REST API:"
echo "       (System > REST API > Settings > Enable)"
echo "    3. Allow port $PORT through the firewall:"
echo "       (Firewall > Rules > select interface > Add rule)"
echo ""
echo "  To uninstall: sh $0 --uninstall"
echo "  To update:    sh $0 (re-runs this script)"
echo ""