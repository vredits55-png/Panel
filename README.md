# Minecraft Server Management Panel

A powerful, lightweight, and self-hosted Minecraft Server Management Panel built with Node.js, Express, EJS, and Socket.io. It allows you to run, manage, and monitor multiple Minecraft servers (Java, Bedrock, and proxy software) on a single VPS.

---

## Features

* **Multi-Version Auto-Downloader:** Seamlessly install and update server software like Vanilla, Paper, Purpur, Spigot, Fabric, Forge, Bedrock, Nukkit, Mohist, Velocity, Waterfall, BungeeCord, and more.
* **Console & Real-time Logs:** Live interactive console via WebSockets (Socket.io) with stdin command execution and auto-configured RCON fallback.
* **File Manager:** Built-in web file manager supporting file creation, viewing, text editing, uploading, downloading, zipping, and unzipping.
* **Backup Management:** Create and restore compressed ZIP archives of your server directories instantly.
* **Plugin & Mod Marketplace:** Search and download plugins/mods directly from Modrinth and CurseForge.
* **Access Control:** Grant granular subuser permissions for specific servers.
* **Player Manager:** Real-time online player list, whitelist editor, and ban-list configuration.
* **System Stats:** Live monitoring of CPU, RAM, and Disk space for each active server process.

---

## ⚡ Quick VPS Installation

To deploy the panel on a fresh VPS (running Ubuntu 20.04/22.04 LTS or Debian 11/12) in a single command, run the following:

```bash
curl -sSL https://raw.githubusercontent.com/vredits55-png/Panel/main/install.sh | sudo bash
```

### What this script does:
1. Installs base utilities (`curl`, `git`, `unzip`, `zip`, `build-essential`, `libcurl4`).
2. Installs **Node.js v20 LTS**.
3. Installs **OpenJDK Java 17 and 21** (automatically sets Java 21 as default).
4. Clones the repository into `/var/www/minecraft-panel`.
5. Installs npm production dependencies and generates secure environment variables.
6. Configures **PM2** process manager to run the panel 24/7 and start on system boot.
7. Configures the system firewall (UFW) to permit SSH (22), Web interface (3000), Java Edition (25565), and Bedrock (19132).

---

## First-Time Login

Once the installer completes, open your browser and navigate to:
`http://<your-vps-ip>:3000`

Use the default administrator credentials:
* **Username:** `admin`
* **Password:** `admin123`

> [!IMPORTANT]
> Change the default admin password in the panel settings or `/profile` page immediately after logging in.

---

## Development Setup

If you want to run the project locally for development or testing:

1. Clone the repository:
   ```bash
   git clone https://github.com/vredits55-png/Panel.git
   cd Panel
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run database migrations:
   ```bash
   node init-database.js
   ```
4. Start in development mode (using nodemon):
   ```bash
   npm run dev
   ```

---

## License

This project is open-source and free to use.
