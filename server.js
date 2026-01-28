import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let botProcess = null;
let botLogs = [];
let botConfig = {};

// Start bot
app.post('/api/start', (req, res) => {
    if (botProcess) {
        return res.json({ success: false, message: 'Bot is already running' });
    }

    const { currentDate, targetDate, dryRun } = req.body;
    
    const args = [
        'src/index.js',
        '-c', currentDate
    ];
    
    if (targetDate) {
        args.push('-t', targetDate);
        botConfig.targetDate = targetDate;
    }
    
    if (dryRun) {
        args.push('--dry-run');
        botConfig.mode = 'Test Mode';
    } else {
        botConfig.mode = 'Live Booking';
    }

    botProcess = spawn('node', args);
    
    botProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        addLog(message);
    });
    
    botProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        addLog(message, 'error');
    });
    
    botProcess.on('close', (code) => {
        addLog(`Bot process exited with code ${code}`, code === 0 ? 'success' : 'error');
        botProcess = null;
    });

    res.json({ success: true, message: 'Bot started', mode: botConfig.mode });
});

// Stop bot
app.post('/api/stop', (req, res) => {
    if (!botProcess) {
        return res.json({ success: false, message: 'Bot is not running' });
    }

    botProcess.kill();
    botProcess = null;
    
    res.json({ success: true, message: 'Bot stopped' });
});

// Get bot status
app.get('/api/status', (req, res) => {
    res.json({
        running: botProcess !== null,
        config: botConfig
    });
});

// Get logs
app.get('/api/logs', (req, res) => {
    res.json({ logs: botLogs.slice(-50) }); // Last 50 logs
});

// Get config
app.get('/api/config', (req, res) => {
    try {
        const config = getConfig();
        res.json({
            email: config.email,
            countryCode: config.countryCode,
            scheduleId: config.scheduleId,
            facilityId: config.facilityId,
            targetDate: botConfig.targetDate || null
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Check available dates
app.get('/api/dates', async (req, res) => {
    try {
        const config = getConfig();
        const client = new VisaHttpClient(config.countryCode, config.email, config.password);
        
        addLog('Checking available dates...');
        const sessionHeaders = await client.login();
        
        // Get dates from the API
        const url = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${config.scheduleId}/appointment/days/${config.facilityId}.json?appointments[expedite]=false`;
        
        const response = await fetch(url, {
            headers: {
                ...sessionHeaders,
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        
        const data = await response.json();
        
        // Extract just the date strings
        const dates = data.map(item => item.date);
        
        addLog(`Found ${dates.length} available dates`);
        
        res.json({ 
            dates: dates || [],
            total: dates.length,
            facilityId: config.facilityId,
            scheduleId: config.scheduleId
        });
    } catch (error) {
        addLog(`Error checking dates: ${error.message}`, 'error');
        res.json({ error: error.message, dates: [] });
    }
});

function addLog(message, type = '') {
    const log = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        message,
        type
    };
    
    botLogs.push(log);
    
    // Keep only last 200 logs
    if (botLogs.length > 200) {
        botLogs = botLogs.slice(-200);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Visa Bot Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
