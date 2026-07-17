const sqlite3 = require('sqlite3').verbose();
const os = require('os');
const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

function getDiskSpaceMB() {
    try {
        if (os.platform() === 'win32') {
            const output = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size /value').toString();
            const match = output.match(/Size=(\d+)/);
            if (match) {
                return Math.floor(parseInt(match[1]) / 1024 / 1024);
            }
        } else {
            const output = execSync('df -m /').toString();
            const lines = output.trim().split('\n');
            if (lines.length >= 2) {
                const parts = lines[1].trim().split(/\s+/);
                return parseInt(parts[1]);
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
console.log(`🖥  Host CPU Cores:  ${cpuCores}`);
console.log(`💾 Host Total RAM:  ${Math.round(totalRamMB / 1024)} GB (${totalRamMB} MB)`);
console.log(`📁 Host Disk Space: ${Math.round(totalDiskMB / 1024)} GB (${totalDiskMB} MB)`);
console.log('=========================================================');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query, validator, defaultValue) {
    return new Promise((resolve) => {
        const ask = () => {
            rl.question(query, (answer) => {
                const trimmed = answer.trim();
                if (trimmed === '') {
                    resolve(defaultValue);
                    return;
                }
                const value = parseInt(trimmed, 10);
                if (validator(value)) {
                    resolve(value);
                } else {
                    console.log('⚠️  Invalid value. Please enter a value within the specified range.');
                    ask();
                }
            });
        };
        ask();
    });
}

async function startDetection() {
    // 90% default fallbacks
    const defaultCpu = Math.max(1, Math.floor(cpuCores * 0.9));
    const defaultRam = Math.floor(totalRamMB * 0.9);
    const defaultDisk = Math.floor(totalDiskMB * 0.9);

    console.log('Specify resource allocations for the panel below (Press Enter for 90% default):');
    
    const allocatedCpu = await askQuestion(
        `➡️  CPU Cores to allocate (1-${cpuCores}, default: ${defaultCpu}): `,
        val => !isNaN(val) && val >= 1 && val <= cpuCores,
        defaultCpu
    );

    const allocatedRam = await askQuestion(
        `➡️  RAM to allocate in MB (512-${totalRamMB}, default: ${defaultRam}): `,
        val => !isNaN(val) && val >= 512 && val <= totalRamMB,
        defaultRam
    );

    const allocatedDisk = await askQuestion(
        `➡️  Disk Space to allocate in MB (1024-${totalDiskMB}, default: ${defaultDisk}): `,
        val => !isNaN(val) && val >= 1024 && val <= totalDiskMB,
        defaultDisk
    );

    console.log('\n=========================================================');
    console.log('🎯 Applying Custom Allocation Config');
    console.log('=========================================================');
    console.log(`🖥  Allocated CPU Cores:  ${allocatedCpu} (Host total: ${cpuCores})`);
    console.log(`💾 Allocated RAM:        ${Math.round(allocatedRam / 1024)} GB (${allocatedRam} MB)`);
    console.log(`📁 Allocated Disk Space: ${Math.round(allocatedDisk / 1024)} GB (${allocatedDisk} MB)`);
    console.log('=========================================================');

    db.serialize(() => {
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
            { key: 'defaultRam', value: JSON.stringify(allocatedRam) },
            { key: 'defaultCpu', value: JSON.stringify(allocatedCpu) },
            { key: 'defaultDisk', value: JSON.stringify(allocatedDisk) }
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
                        console.log('✅ Custom hardware profiles saved to panel database settings.');
                        db.close(() => {
                            console.log('Database connection closed.');
                            rl.close();
                            process.exit(0);
                        });
                    }
                }
            );
        });
    });
}

startDetection();
