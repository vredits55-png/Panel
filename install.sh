#!/bin/bash

# ==============================================================================
#  Minecraft Server Management Panel Installer
#  Target OS: Ubuntu 20.04/22.04 LTS, Debian 11/12
# ==============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print Banner
echo -e "${CYAN}"
echo "========================================================="
echo "   MINECRAFT SERVER MANAGEMENT PANEL INSTALLER"
echo "========================================================="
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (sudo bash install.sh).${NC}"
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION_ID=$VERSION_ID
else
    echo -e "${RED}Error: Cannot detect Operating System. Only Ubuntu/Debian are supported.${NC}"
    exit 1
fi

if [ "$OS" != "ubuntu" ] && [ "$OS" != "debian" ]; then
    echo -e "${YELLOW}Warning: This script is tested on Ubuntu and Debian. Proceeding on: $OS $VERSION_ID...${NC}"
fi

# Step 1: System Update & Base Utilities
echo -e "\n${BLUE}[1/7] Updating system and installing base utilities...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y git curl build-essential unzip zip screen libcurl4

# Step 2: Install Node.js LTS (v20)
echo -e "\n${BLUE}[2/7] Installing Node.js v20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo -e "${GREEN}✓ Node.js $(node -v) installed successfully.${NC}"

# Step 3: Install Java Runtimes (JDK 17 and JDK 21)
echo -e "\n${BLUE}[3/7] Installing OpenJDK Java Runtimes (Java 17 & 21)...${NC}"
apt-get install -y openjdk-17-jre-headless openjdk-21-jre-headless
# Set Java 21 as default (usually preferred for new MC versions)
update-java-alternatives -s $(update-java-alternatives -l | grep 21 | awk '{print $1}' | head -n 1) || true
echo -e "${GREEN}✓ Default Java version: $(java -version 2>&1 | head -n 1)${NC}"

# Step 4: Clone the Panel Repository
INSTALL_DIR="/var/www/minecraft-panel"
REPO_URL="https://github.com/vredits55-png/Panel.git"

echo -e "\n${BLUE}[4/7] Preparing application directory at ${INSTALL_DIR}...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory ${INSTALL_DIR} already exists. Backing it up...${NC}"
    mv "$INSTALL_DIR" "${INSTALL_DIR}_backup_$(date +%s)"
fi

echo -e "${BLUE}Cloning repository: ${REPO_URL}...${NC}"
git clone "$REPO_URL" "$INSTALL_DIR"

# Step 5: Install Production Dependencies
echo -e "\n${BLUE}[5/7] Installing panel dependencies...${NC}"
cd "$INSTALL_DIR"
npm install --production

# Step 6: Configure Environment Variables
echo -e "\n${BLUE}[6/7] Generating configuration...${NC}"
SESSION_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
cat <<EOT > .env
PORT=3000
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
EOT
echo -e "${GREEN}✓ Configuration saved in .env${NC}"

# Step 7: Set up PM2 Process Manager
echo -e "\n${BLUE}[7/7] Configuring PM2 Process Manager...${NC}"
npm install -g pm2
pm2 start app.js --name "minecraft-panel"
pm2 startup | tail -n 2 | bash
pm2 save

# Setup UFW Firewall
echo -e "\n${YELLOW}Would you like to configure and enable UFW Firewall? (y/n)${NC}"
read -p "Option: " CONFIRM_UFW
if [ "$CONFIRM_UFW" = "y" ] || [ "$CONFIRM_UFW" = "Y" ]; then
    echo -e "${BLUE}Configuring firewall rules...${NC}"
    ufw allow ssh
    ufw allow 3000/tcp
    ufw allow 25565/tcp
    ufw allow 19132/udp
    ufw default deny incoming
    ufw default allow outgoing
    echo "y" | ufw enable
    echo -e "${GREEN}✓ Firewall enabled.${NC}"
fi

# Print Success message
IP_ADDR=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')
echo -e "\n${GREEN}========================================================="
echo "   INSTALLATION COMPLETED SUCCESSFULLY!"
echo "========================================================="
echo -e "${NC}"
echo -e "You can now access your panel in the web browser:"
echo -e "🔗 URL:  ${CYAN}http://${IP_ADDR}:3000${NC}"
echo -e "🔑 Default Username: ${GREEN}admin${NC}"
echo -e "🔑 Default Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${RED}IMPORTANT: Please log in and change the administrator password${NC}"
echo -e "${RED}immediately to secure your panel!${NC}"
echo "========================================================="
