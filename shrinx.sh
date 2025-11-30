#!/bin/bash

set -e

GIT_REPO="https://github.com/tonyliuzj/shrinx.git"
INSTALL_DIR="$HOME/shrinx"

show_menu() {
  echo "========== Shrinx Installer =========="
  echo "1) Install"
  echo "2) Update"
  echo "3) Uninstall"
  echo "======================================="
  read -p "Select an option [1-3]: " CHOICE
  case $CHOICE in
    1) install_shrinx ;;
    2) update_shrinx ;;
    3) uninstall_shrinx ;;
    *) echo "Invalid choice. Exiting." ; exit 1 ;;
  esac
}

install_shrinx() {
  echo "Starting Shrinx Installation..."

  echo "Installing system dependencies..."
  sudo apt update
  sudo apt install -y git curl sqlite3 build-essential

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

  echo "Checking for PM2..."
  if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 is already installed. Skipping installation."
  else
    echo "Installing PM2..."
    npm install -g pm2
  fi

  if [ -d "$INSTALL_DIR" ]; then
    if [ -d "$INSTALL_DIR/.git" ]; then
      echo "Repository already exists. Pulling latest changes..."
      cd "$INSTALL_DIR"
      git pull
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

  echo "Installing TypeScript..."
  npm install -g typescript

  echo "Configuring environment variables..."
  SESSION_PASS=$(openssl rand -base64 48 | tr -d '\n' | head -c 32)
  echo "Session password generated"
  read -p "Port to serve the app on (default 3000): " APP_PORT
  APP_PORT=${APP_PORT:-3000}

  cat > .env.local <<EOF
SESSION_PASSWORD=$SESSION_PASS
PORT=$APP_PORT
EOF

  echo ".env.local created"
  echo "Default admin login: admin / changeme"
  echo "Change the password after first login at /admin/settings"

  echo "Installing project dependencies..."
  npm install

  echo "Building the app..."
  npm run build

  echo "Starting Shrinx with PM2..."
  pm2 start "npm run start -- -p $APP_PORT" --name "shrinx"
  pm2 save
  pm2 startup

  echo "Installation complete!"
  echo "Visit: http://localhost:$APP_PORT"
  echo "View logs: pm2 logs shrinx"
}

update_shrinx() {
  echo "Updating Shrinx..."

  if [ ! -d "$INSTALL_DIR/.git" ]; then
    echo "Shrinx not installed in $INSTALL_DIR"
    exit 1
  fi

  cd "$INSTALL_DIR"
  git pull
  npm install
  npm run build
  pm2 restart shrinx

  echo "Update complete!"
  echo "Visit: http://localhost:$(grep PORT .env.local | cut -d'=' -f2)"
}

uninstall_shrinx() {
  echo "Uninstalling Shrinx..."

  if pm2 list | grep -q shrinx; then
    pm2 stop shrinx
    pm2 delete shrinx
  fi

  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "Removed $INSTALL_DIR"
  fi

  echo "Uninstall complete!"
  echo "Note: System dependencies (Node.js, PM2) were not removed"
}

show_menu
