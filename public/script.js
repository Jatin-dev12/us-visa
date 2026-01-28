const API_URL = 'http://localhost:3000/api';

let botRunning = false;
let logUpdateInterval = null;

// DOM Elements
const statusBadge = document.getElementById('statusBadge');
const lastCheck = document.getElementById('lastCheck');
const availableDates = document.getElementById('availableDates');
const targetDate = document.getElementById('targetDate');
const botForm = document.getElementById('botForm');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logsContainer = document.getElementById('logsContainer');
const clearLogsBtn = document.getElementById('clearLogs');
const refreshDatesBtn = document.getElementById('refreshDates');
const datesContainer = document.getElementById('datesContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkBotStatus();
    loadConfig();
});

// Form submission
botForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await startBot();
});

stopBtn.addEventListener('click', stopBot);
clearLogsBtn.addEventListener('click', clearLogs);
refreshDatesBtn.addEventListener('click', checkAvailableDates);

async function startBot() {
    const currentDate = document.getElementById('currentDate').value;
    const targetDateValue = document.getElementById('targetDateInput').value;
    const dryRun = document.getElementById('testModeRadio').checked;

    if (!currentDate) {
        alert('Please enter current booked date');
        return;
    }

    // Show confirmation for live mode
    if (!dryRun) {
        const confirm = window.confirm(
            '⚠️ LIVE BOOKING MODE\n\n' +
            'The bot will ACTUALLY BOOK appointments when it finds dates.\n\n' +
            'Current Date: ' + currentDate + '\n' +
            'Target Date: ' + (targetDateValue || 'Any earlier date') + '\n\n' +
            'Are you sure you want to continue?'
        );
        
        if (!confirm) {
            return;
        }
    }

    try {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="btn-icon">⏳</span> Starting...';
        
        const response = await fetch(`${API_URL}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentDate,
                targetDate: targetDateValue || null,
                dryRun
            })
        });

        const data = await response.json();
        
        if (data.success) {
            const mode = dryRun ? '🧪 Test Mode' : '🚀 Live Booking';
            addLog(`✅ Bot started successfully in ${mode}`, 'success');
            document.getElementById('botMode').textContent = mode;
            updateBotStatus(true);
            startLogPolling();
        } else {
            addLog(`❌ Failed to start bot: ${data.message}`, 'error');
            startBtn.disabled = false;
            startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Bot';
        }
    } catch (error) {
        addLog(`❌ Error starting bot: ${error.message}`, 'error');
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Bot';
    }
}

async function stopBot() {
    try {
        stopBtn.disabled = true;
        stopBtn.innerHTML = '<span class="btn-icon">⏳</span> Stopping...';
        
        const response = await fetch(`${API_URL}/stop`, { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            addLog('⏹️ Bot stopped', 'success');
            document.getElementById('botMode').textContent = '-';
            updateBotStatus(false);
            stopLogPolling();
        }
        
        stopBtn.innerHTML = '<span class="btn-icon">⏹️</span> Stop Bot';
    } catch (error) {
        addLog(`❌ Error stopping bot: ${error.message}`, 'error');
        stopBtn.disabled = false;
        stopBtn.innerHTML = '<span class="btn-icon">⏹️</span> Stop Bot';
    }
}

async function checkBotStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        
        updateBotStatus(data.running);
        if (data.running) {
            startLogPolling();
        }
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

async function loadConfig() {
    try {
        const response = await fetch(`${API_URL}/config`);
        const data = await response.json();
        
        if (data.targetDate) {
            targetDate.textContent = data.targetDate;
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

async function checkAvailableDates() {
    refreshDatesBtn.disabled = true;
    refreshDatesBtn.innerHTML = '<span>⏳</span> Loading...';
    
    try {
        const response = await fetch(`${API_URL}/dates`);
        const data = await response.json();
        
        if (data.dates && data.dates.length > 0) {
            displayDates(data.dates);
            availableDates.textContent = `${data.dates.length} dates`;
            addLog(`✅ Found ${data.dates.length} available dates`, 'success');
        } else {
            datesContainer.innerHTML = '<p class="dates-empty">No dates available</p>';
            availableDates.textContent = '0 dates';
            addLog('⚠️ No dates available', '');
        }
    } catch (error) {
        datesContainer.innerHTML = '<p class="dates-empty">Error loading dates</p>';
        addLog(`❌ Error checking dates: ${error.message}`, 'error');
    } finally {
        refreshDatesBtn.disabled = false;
        refreshDatesBtn.innerHTML = '<span>🔄</span> Check Dates';
    }
}

function displayDates(dates) {
    datesContainer.innerHTML = '';
    
    if (!dates || dates.length === 0) {
        datesContainer.innerHTML = '<p class="dates-empty">No dates available</p>';
        return;
    }
    
    // Group dates by year
    const datesByYear = {};
    dates.forEach(date => {
        const year = date.substring(0, 4);
        if (!datesByYear[year]) {
            datesByYear[year] = [];
        }
        datesByYear[year].push(date);
    });
    
    // Create sections for each year
    Object.keys(datesByYear).sort().forEach(year => {
        const yearSection = document.createElement('div');
        yearSection.className = 'year-section';
        
        const yearHeader = document.createElement('div');
        yearHeader.className = 'year-header';
        yearHeader.innerHTML = `
            <h3>${year}</h3>
            <span class="year-count">${datesByYear[year].length} dates</span>
        `;
        
        const yearDates = document.createElement('div');
        yearDates.className = 'year-dates';
        
        datesByYear[year].forEach(date => {
            const dateEl = document.createElement('div');
            dateEl.className = 'date-item';
            if (date.startsWith('2026')) {
                dateEl.classList.add('year-2026');
                dateEl.title = '⭐ Target year!';
            }
            dateEl.textContent = date;
            yearDates.appendChild(dateEl);
        });
        
        yearSection.appendChild(yearHeader);
        yearSection.appendChild(yearDates);
        datesContainer.appendChild(yearSection);
    });
}

function updateBotStatus(running) {
    botRunning = running;
    
    if (running) {
        statusBadge.textContent = '🟢 Running';
        statusBadge.className = 'status-badge running';
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="btn-icon">▶️</span> Start Bot';
        stopBtn.disabled = false;
    } else {
        statusBadge.textContent = '⚫ Stopped';
        statusBadge.className = 'status-badge stopped';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

function startLogPolling() {
    if (logUpdateInterval) return;
    
    logUpdateInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/logs`);
            const data = await response.json();
            
            if (data.logs && data.logs.length > 0) {
                updateLogs(data.logs);
                lastCheck.textContent = new Date().toLocaleTimeString();
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    }, 2000);
}

function stopLogPolling() {
    if (logUpdateInterval) {
        clearInterval(logUpdateInterval);
        logUpdateInterval = null;
    }
}

function updateLogs(logs) {
    if (logsContainer.querySelector('.log-empty')) {
        logsContainer.innerHTML = '';
    }
    
    logs.forEach(log => {
        if (!document.querySelector(`[data-log="${log.id}"]`)) {
            addLogEntry(log);
        }
    });
    
    // Keep only last 100 logs
    const logEntries = logsContainer.querySelectorAll('.log-entry');
    if (logEntries.length > 100) {
        logEntries[0].remove();
    }
}

function addLogEntry(log) {
    const logEl = document.createElement('div');
    logEl.className = `log-entry ${log.type || ''}`;
    logEl.setAttribute('data-log', log.id);
    logEl.innerHTML = `
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <div>${log.message}</div>
    `;
    logsContainer.appendChild(logEl);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function addLog(message, type = '') {
    const log = {
        id: Date.now(),
        timestamp: new Date(),
        message,
        type
    };
    addLogEntry(log);
}

function clearLogs() {
    logsContainer.innerHTML = '<p class="log-empty">Logs cleared</p>';
}
