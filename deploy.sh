#!/bin/bash

# ==============================================================================
# 🚀 MANASKEDAR OTT BACKEND - AUTOMATED AWS EC2 DEPLOYMENT SCRIPT
# Domain Target: https://back.manaskedar.com
# Backend Port: 5001
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}  🚀 Starting Manaskedar OTT Backend Deployment     ${NC}"
echo -e "${BLUE}=====================================================${NC}"

DOMAIN="back.manaskedar.com"
PORT=5001
APP_DIR=$(pwd)

# 1. Update System Packages
echo -e "\n${YELLOW}[1/7] Updating Ubuntu System Packages...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx build-essential ffmpeg

# 2. Install Node.js 20 LTS (if not installed)
echo -e "\n${YELLOW}[2/7] Checking Node.js Environment...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
    echo -e "${BLUE}Installing Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}Node.js Version: $(node -v)${NC}"
echo -e "${GREEN}NPM Version: $(npm -v)${NC}"

# 3. Install PM2 Globally
echo -e "\n${YELLOW}[3/7] Setting up PM2 Process Manager...${NC}"
sudo npm install -g pm2

# 4. Install Project Dependencies
echo -e "\n${YELLOW}[4/7] Installing Project Dependencies...${NC}"
cd "$APP_DIR"
npm install --production

# 5. Configure Nginx Reverse Proxy
echo -e "\n${YELLOW}[5/7] Configuring Nginx Reverse Proxy for ${DOMAIN}...${NC}"

NGINX_CONF="/etc/nginx/sites-available/manaskedar"

sudo bash -c "cat > $NGINX_CONF" << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 500M; # For large media/banner uploads

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx Site Config
sudo ln -sf /etc/nginx/sites-available/manaskedar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 6. Setup Firewall (UFW)
echo -e "\n${YELLOW}[6/7] Securing Ports with UFW Firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 7. PM2 Cluster Launch & Auto-Start Configuration
echo -e "\n${YELLOW}[7/7] Starting Node.js App with PM2...${NC}"
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
pm2 save

echo -e "${BLUE}Configuring PM2 systemd auto-restart service on reboot...${NC}"
CURRENT_USER=$(whoami)
CURRENT_HOME=$HOME
PM2_PATH=$(which pm2)

sudo env PATH=$PATH:$(dirname $PM2_PATH) $PM2_PATH startup systemd -u $CURRENT_USER --hp $CURRENT_HOME || true
pm2 save


# 8. Automated Certbot SSL Setup
echo -e "\n${YELLOW}=====================================================${NC}"
echo -e "${GREEN}🔒 Setting up Free SSL Certificate (HTTPS)...${NC}"
echo -e "${YELLOW}Ensure DNS A record for ${DOMAIN} points to this server's Public IP!${NC}"
echo -e "${YELLOW}=====================================================${NC}"

sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email || {
    echo -e "${RED}⚠️ SSL Auto-setup skipped or DNS not propagated yet.${NC}"
    echo -e "${YELLOW}Run manually later: sudo certbot --nginx -d ${DOMAIN}${NC}"
}

echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "Backend API URL: ${GREEN}https://${DOMAIN}${NC}"
echo -e "Check PM2 Status: ${YELLOW}pm2 status${NC}"
echo -e "View App Logs: ${YELLOW}pm2 logs manaskedar-backend${NC}"
echo -e "${BLUE}=====================================================${NC}"
