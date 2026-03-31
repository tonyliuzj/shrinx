#!/bin/bash

set -euo pipefail

APP_NAME="link-guide"
APP_TITLE="Link Guide"
RUN_USER="${SUDO_USER:-$USER}"
RUN_GROUP="$(id -gn "$RUN_USER")"
USER_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
USER_HOME="${USER_HOME:-$HOME}"
GIT_REPO="${LINK_GUIDE_GIT_REPO:-https://github.com/tonyliuzj/link-guide.git}"
INSTALL_DIR="${LINK_GUIDE_INSTALL_DIR:-$USER_HOME/link-guide}"
DATABASE_PATH="data/link-guide.sqlite"
SERVICE_NAME="${APP_NAME}.service"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}"

require_systemd() {
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemd is required but systemctl was not found."
    exit 1
  fi
}

write_service_file() {
  local app_port="$1"
  local node_bin
  node_bin="$(command -v node)"

  sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=${APP_TITLE}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${RUN_USER}
Group=${RUN_GROUP}
WorkingDirectory=${INSTALL_DIR}
Environment=NODE_ENV=production
EnvironmentFile=${INSTALL_DIR}/.env.local
ExecStart=${node_bin} ${INSTALL_DIR}/node_modules/next/dist/bin/next start -p ${app_port}
Restart=always
RestartSec=5
TimeoutStopSec=20
SyslogIdentifier=${APP_NAME}

[Install]
WantedBy=multi-user.target
EOF
}

reload_and_restart_service() {
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
}

stop_and_remove_service() {
  if sudo test -f "$SERVICE_FILE"; then
    sudo systemctl disable --now "$SERVICE_NAME" || true
    sudo rm -f "$SERVICE_FILE"
    sudo systemctl daemon-reload
  fi
}

show_menu() {
  echo "========== ${APP_TITLE} Installer =========="
  echo "1) Install"
  echo "2) Update"
  echo "3) Uninstall"
  echo "======================================="
  read -p "Select an option [1-3]: " CHOICE
  case $CHOICE in
    1) install_app ;;
    2) update_app ;;
    3) uninstall_app ;;
    *) echo "Invalid choice. Exiting." ; exit 1 ;;
  esac
}

install_app() {
  echo "Starting ${APP_TITLE} installation..."
  require_systemd

  echo "Installing system dependencies..."
  sudo apt update
  sudo apt install -y git curl build-essential python3 openssl

  echo "Checking Node.js version..."
  if command -v node >/dev/null 2>&1; then
    VERSION=$(node -v | sed 's/^v//')
    MAJOR=${VERSION%%.*}
    if [ "$MAJOR" -lt 18 ]; then
      echo "Node.js v$VERSION detected (<18)."
      read -p "Do you want to install Node.js 22? (y/n): " INSTALL_22
      if [[ "$INSTALL_22" =~ ^[Yy]$ ]]; then
        echo "Installing Node.js 22..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt install -y nodejs
      else
        echo "Installation requires Node.js >=18. Exiting."
        exit 1
      fi
    else
      echo "Node.js v$VERSION detected. Skipping installation."
    fi
  else
    echo "Node.js not found. Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
  fi

  if [ -d "$INSTALL_DIR" ]; then
    if [ -d "$INSTALL_DIR/.git" ]; then
      echo "Repository already exists. Pulling latest changes..."
      cd "$INSTALL_DIR"
      git pull --ff-only
    else
      echo "Directory exists but is not a git repository. Removing and cloning fresh..."
      rm -rf "$INSTALL_DIR"
      git clone "$GIT_REPO" "$INSTALL_DIR"
      cd "$INSTALL_DIR"
    fi
  else
    git clone "$GIT_REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi

  echo "Configuring environment variables..."
  SESSION_PASS=$(openssl rand -base64 48 | tr -d '\n' | head -c 32)
  echo "Session password generated"
  read -p "Port to serve the app on (default 3000): " APP_PORT
  APP_PORT=${APP_PORT:-3000}
  read -p "Primary host/domain for short links (default localhost:${APP_PORT}): " PRIMARY_DOMAIN
  PRIMARY_DOMAIN=${PRIMARY_DOMAIN:-localhost:${APP_PORT}}
  read -p "Additional domains, comma-separated (optional): " EXTRA_DOMAINS

  DOMAINS="$PRIMARY_DOMAIN"
  if [ -n "${EXTRA_DOMAINS// }" ]; then
    DOMAINS="${PRIMARY_DOMAIN},${EXTRA_DOMAINS}"
  fi

  cat > .env.local <<EOF
SESSION_PASSWORD=$SESSION_PASS
PORT=$APP_PORT
DATABASE_PATH=$DATABASE_PATH
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
DOMAINS=$DOMAINS
PRIMARY_DOMAIN=$PRIMARY_DOMAIN
TURNSTILE_ENABLED=false
EOF

  echo ".env.local created"
  echo "Default admin login: admin / changeme"
  echo "Change the password after first login at /admin/settings"

  echo "Installing project dependencies..."
  npm ci

  echo "Building the app..."
  npm run build

  echo "Installing ${APP_TITLE} systemd service..."
  write_service_file "$APP_PORT"
  reload_and_restart_service

  echo "Installation complete!"
  echo "Visit: http://localhost:$APP_PORT"
  echo "View logs: sudo journalctl -u $SERVICE_NAME -f"
  echo "Service status: sudo systemctl status $SERVICE_NAME"
}

update_app() {
  echo "Updating ${APP_TITLE}..."
  require_systemd

  if [ ! -d "$INSTALL_DIR/.git" ]; then
    echo "${APP_TITLE} is not installed in $INSTALL_DIR"
    exit 1
  fi

  cd "$INSTALL_DIR"
  git pull --ff-only
  npm ci
  npm run build

  APP_PORT=$(grep '^PORT=' .env.local 2>/dev/null | cut -d'=' -f2)
  APP_PORT=${APP_PORT:-3000}

  write_service_file "$APP_PORT"
  reload_and_restart_service

  echo "Update complete!"
  echo "Visit: http://localhost:$APP_PORT"
  echo "View logs: sudo journalctl -u $SERVICE_NAME -f"
}

uninstall_app() {
  echo "Uninstalling ${APP_TITLE}..."
  require_systemd

  stop_and_remove_service

  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "Removed $INSTALL_DIR"
  fi

  echo "Uninstall complete!"
  echo "Note: System dependencies (Node.js, systemd) were not removed"
}

show_menu
