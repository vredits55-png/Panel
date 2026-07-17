const sqlite3 = require('sqlite3').verbose();
const os = require('os');
const { execSync } = require('child_process');
const path = require('path');

function getDiskSpaceMB() {
    try {
        if (os.platform() === 'win32') {
            // Windows: wmic logicaldisk get size
            const output = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size /value').toString();
            const match = output.match(/Size=(\d+)/);
            if (match) {
                return Math.floor(parseInt(match[1]) / 1024 / 1024);
            }
        } else {
            // Linux: df -m /
            const output = execSync('df -m /').toString();
            const lines = output.trim().split('\n');
            if (lines.length >= 2) {
                const parts = lines[1].trim().split(/\s+/);
                return parseInt(parts[1]); // Second column is total size in MB
            }
        }
    } catch (err) {
        console.error('Failed to detect disk space:', err.message);
    }
    return 10240; // Default fallback: 10 GB
}

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open database for autodetection:', err.message);
        process.exit(1);
    }
});

const cpuCores = os.cpus().length;
const totalRamMB = Math.floor(os.totalmem() / 1024 / 1024);
const totalDiskMB = getDiskSpaceMB();

console.log('=========================================================');
console.log('🤖 System Hardware Autodetector');
console.log('=========================================================');
console.log(`🖥️  CPU Cores:  ${cpuCores}`);
console.log(`💾 Total RAM:  ${Math.round(totalRamMB / 1024)} GB (${totalRamMB} MB)`);
console.log(`📁 Disk Space: ${Math.round(totalDiskMB / 1024)} GB (${totalDiskMB} MB)`);
console.log('=========================================================');

db.serialize(() => {
    // Ensure table exists
    db.run(`CREATE TABLE IF NOT EXISTS panel_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    const settings = [
        { key: 'system_cpu_cores', value: JSON.stringify(cpuCores) },
        { key: 'system_total_ram', value: JSON.stringify(totalRamMB) },
        { key: 'system_total_disk', value: JSON.stringify(totalDiskMB) },
        { key: 'defaultRam', value: JSON.stringify(Math.min(4096, Math.floor(totalRamMB * 0.5))) } // Default server RAM allocation to 50% (max 4GB)
    ];

    let completed = 0;
    settings.forEach(setting => {
        db.run(
            'INSERT OR REPLACE INTO panel_settings (key, value) VALUES (?, ?)',
            [setting.key, setting.value],
            (err) => {
                if (err) {
                    console.error(`Error saving setting ${setting.key}:`, err.message);
                }
                completed++;
                if (completed === settings.length) {
                    console.log('✅ Hardware profiles saved to panel database settings.');
                    db.close(() => {
                        console.log('Database connection closed.');
                        process.exit(0);
                    });
                }
            }
        );
    });
});
