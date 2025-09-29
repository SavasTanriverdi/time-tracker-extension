// Time Tracker - Modern Popup JavaScript
// Lightweight polyfill for local preview (no extension APIs)
const _extApi = (() => {
    if (typeof window !== 'undefined') {
        if (window.browser && window.browser.runtime) return window.browser;
        if (window.chrome && window.chrome.runtime) return window.chrome;
    }
    return {
        runtime: {
            sendMessage: () => Promise.reject(new Error('No extension API available in preview'))
        }
    };
})();
// Use unified reference in code below
const browser = _extApi;

function hasExtApi() {
    return !!(browser && browser.runtime && typeof browser.runtime.sendMessage === 'function');
}

// Determine UI locale from browser/OS with enhanced fallback
function getUILocale() {
    try {
        if (browser && browser.i18n && typeof browser.i18n.getUILanguage === 'function') {
            const ui = browser.i18n.getUILanguage();
            if (ui) return ui;
        }
    } catch (_) {}
    
    // Enhanced browser language detection
    if (typeof navigator !== 'undefined') {
        // Check all available languages
        if (navigator.languages && navigator.languages.length) {
            for (const lang of navigator.languages) {
                // Map common language codes to our supported locales
                const mappedLang = mapLanguageCode(lang);
                if (mappedLang) return mappedLang;
            }
        }
        if (navigator.language) {
            const mappedLang = mapLanguageCode(navigator.language);
            if (mappedLang) return mappedLang;
        }
    }
    return 'en';
}

// Map browser language codes to our supported locales
function mapLanguageCode(langCode) {
    if (!langCode) return null;
    
    const code = langCode.toLowerCase();
    const supportedLocales = ['en', 'tr', 'de', 'fr', 'es', 'it', 'ru', 'ja'];
    
    // Direct match
    if (supportedLocales.includes(code)) return code;
    
    // Extract base language (e.g., 'en-US' -> 'en')
    const baseLang = code.split('-')[0];
    if (supportedLocales.includes(baseLang)) return baseLang;
    
    // Special mappings
    const mappings = {
        'zh': 'en', // Chinese -> English fallback
        'ko': 'en', // Korean -> English fallback
        'ar': 'en', // Arabic -> English fallback
        'pt': 'es', // Portuguese -> Spanish
        'nl': 'de', // Dutch -> German
        'sv': 'en', // Swedish -> English
        'no': 'en', // Norwegian -> English
        'da': 'en', // Danish -> English
        'fi': 'en', // Finnish -> English
        'pl': 'en', // Polish -> English
        'cs': 'en', // Czech -> English
        'hu': 'en', // Hungarian -> English
        'ro': 'en', // Romanian -> English
        'bg': 'ru', // Bulgarian -> Russian
        'uk': 'ru', // Ukrainian -> Russian
        'be': 'ru', // Belarusian -> Russian
        'hr': 'en', // Croatian -> English
        'sr': 'en', // Serbian -> English
        'sk': 'en', // Slovak -> English
        'sl': 'en', // Slovenian -> English
        'et': 'en', // Estonian -> English
        'lv': 'en', // Latvian -> English
        'lt': 'en', // Lithuanian -> English
        'mt': 'en', // Maltese -> English
        'ga': 'en', // Irish -> English
        'cy': 'en', // Welsh -> English
        'eu': 'es', // Basque -> Spanish
        'ca': 'es', // Catalan -> Spanish
        'gl': 'es'  // Galician -> Spanish
    };
    
    return mappings[baseLang] || null;
}

// ---- i18n helpers ----
const fallbackMessages = {
    extName: 'Time Tracker',
    extDescription: 'Track and analyze your browsing time professionally.',
    logo_title: 'Time Tracker',
    today: 'Today',
    tab_today: 'Today',
    tab_week: 'This Week',
    tab_stats: 'Statistics',
    section_mostVisited: 'Top Visited Sites',
    section_weekActivity: 'Weekly Activity',
    section_generalStats: 'General Statistics',
    card_total_title: 'Total Time',
    card_today_title: 'Today',
    card_total_subtitle: 'All time',
    card_today_subtitle: 'Active time',
    status_active: 'Actively tracking',
    empty_noData: 'No data yet',
    empty_start: 'Start visiting websites',
    stat_total: 'Total Time',
    stat_week: 'This Week',
    stat_avgDaily: 'Daily Avg.',
    stat_activeSites: 'Active Sites',
    chart_days: 'Days',
    chart_hours: 'Hours',
    chart_title_week: 'Weekly Activity',
    chart_desc_week: 'Weekly activity chart: hours by day'
};

function getMsg(key) {
    try {
        if (browser && browser.i18n && typeof browser.i18n.getMessage === 'function') {
            const m = browser.i18n.getMessage(key);
            if (m) return m;
        }
    } catch (_) {}
    return fallbackMessages[key] || key;
}

function applyI18n() {
    const map = [
        { sel: '.logo-text', key: 'logo_title' },
        { sel: '.today-label', key: 'today' },
        { sel: 'button[data-tab="today"]', key: 'tab_today' },
        { sel: 'button[data-tab="week"]', key: 'tab_week' },
        { sel: 'button[data-tab="stats"]', key: 'tab_stats' },
        { sel: '#today-panel .section-title', key: 'section_mostVisited' },
        { sel: '#week-panel .section-title', key: 'section_weekActivity' },
        { sel: '#stats-panel .section-title', key: 'section_generalStats' },
        { sel: '.total-card .card-title', key: 'card_total_title' },
        { sel: '.total-card .card-subtitle', key: 'card_total_subtitle' },
        { sel: '.today-card .card-title', key: 'card_today_title' },
        { sel: '.today-card .card-subtitle', key: 'card_today_subtitle' },
        { sel: '.status-text', key: 'status_active' }
    ];
    map.forEach(({ sel, key }) => {
        const el = document.querySelector(sel);
        if (el) el.textContent = getMsg(key);
    });

    // Update chart ARIA label and redraw with localized labels
    const weekCanvas = document.getElementById('weekChart');
    if (weekCanvas) weekCanvas.setAttribute('aria-label', getMsg('chart_desc_week'));
    loadWeekTabData();
}
document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
    setupTabNavigation();
    loadData();
    
    // Update data every 5 seconds
    setInterval(loadData, 5000);
});

function initializePopup() {
    // Initialize with smooth entrance animation
    const container = document.querySelector('.container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        container.style.transition = 'all 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
    
    // Set current date in header
    updateHeaderDate();
    // Apply i18n labels
    applyI18n();
    // Set html lang to UI locale for accessibility and formatting
    const htmlEl = document.documentElement;
    if (htmlEl) htmlEl.lang = getUILocale();
}

function updateHeaderDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const locale = getUILocale();
    const dateString = today.toLocaleDateString(locale, options);
    
    // Update header if date element exists
    const dateElement = document.querySelector('.header-date');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(targetTab + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Load specific tab data
            loadTabData(targetTab);
        });
    });
    
    // Initialize first tab as active
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
}

function loadData() {
    loadSummaryCards();
    loadTodayTime();
    const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'today';
    loadTabData(activeTab);
}

function loadSummaryCards() {
    // Load total time
    if (hasExtApi()) {
        browser.runtime.sendMessage({action: 'getTotalTime'}).then(totalTime => {
            const totalTimeElement = document.getElementById('totalTimeValue');
            if (totalTimeElement) {
                totalTimeElement.textContent = formatTime(totalTime);
            }
        }).catch(() => {
            const totalTimeElement = document.getElementById('totalTimeValue');
            if (totalTimeElement) {
                totalTimeElement.textContent = '24:15:30';
            }
        });
    } else {
        const totalTimeElement = document.getElementById('totalTimeValue');
        if (totalTimeElement) {
            totalTimeElement.textContent = '24:15:30';
        }
    }
    
    // Load today's time
    loadTodayTime();
}

function loadTodayTime() {
    if (hasExtApi()) {
        browser.runtime.sendMessage({action: 'getTodayData'}).then(todayData => {
            let totalTodayTime = 0;
            let siteCount = 0;
            
            Object.values(todayData).forEach(time => {
                totalTodayTime += time;
                siteCount++;
            });
            
            const formattedTime = formatTime(totalTodayTime);
            
            const headerTodayTime = document.querySelector('.today-time');
            if (headerTodayTime) {
                headerTodayTime.textContent = formattedTime;
            }
            
            const todayTimeValue = document.getElementById('todayTimeValue');
            if (todayTimeValue) {
                todayTimeValue.textContent = formattedTime;
            }
            
            const todaySessionsValue = document.getElementById('todaySessionsValue');
            if (todaySessionsValue) {
                todaySessionsValue.textContent = siteCount.toString();
            }
            
        }).catch(() => {
            const headerTodayTime = document.querySelector('.today-time');
            if (headerTodayTime) {
                headerTodayTime.textContent = '2:45:12';
            }
            const todayTimeValue = document.getElementById('todayTimeValue');
            if (todayTimeValue) {
                todayTimeValue.textContent = '2:45:12';
            }
            const todaySessionsValue = document.getElementById('todaySessionsValue');
            if (todaySessionsValue) {
                todaySessionsValue.textContent = '8';
            }
        });
    } else {
        const headerTodayTime = document.querySelector('.today-time');
        if (headerTodayTime) {
            headerTodayTime.textContent = '2:45:12';
        }
        const todayTimeValue = document.getElementById('todayTimeValue');
        if (todayTimeValue) {
            todayTimeValue.textContent = '2:45:12';
        }
        const todaySessionsValue = document.getElementById('todaySessionsValue');
        if (todaySessionsValue) {
            todaySessionsValue.textContent = '8';
        }
    }
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'today':
            loadTodayTabData();
            break;
        case 'week':
            loadWeekTabData();
            break;
        case 'stats':
            loadStatsTabData();
            break;
    }
}

function loadTodayTabData() {
    if (hasExtApi()) {
        browser.runtime.sendMessage({action: 'getTodayData'}).then(todayData => {
            displayTopSites(todayData);
        }).catch(() => {
            const fallbackData = {
                'github.com': 3600000,
                'stackoverflow.com': 2700000,
                'youtube.com': 1800000,
                'twitter.com': 900000,
                'reddit.com': 600000
            };
            displayTopSites(fallbackData);
        });
    } else {
        const fallbackData = {
            'github.com': 3600000,
            'stackoverflow.com': 2700000,
            'youtube.com': 1800000,
            'twitter.com': 900000,
            'reddit.com': 600000
        };
        displayTopSites(fallbackData);
    }
}

function displayTopSites(todayData) {
    const sitesList = document.getElementById('sitesList');
    if (!sitesList) return;
    
    sitesList.textContent = '';
    
    // Sort sites by time spent
    const sortedSites = Object.entries(todayData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Top 8 sites
    
    if (sortedSites.length === 0) {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.padding = '20px';
        wrapper.style.color = '#94a3b8';

        const p1 = document.createElement('p');
        p1.textContent = getMsg('empty_noData');

        const p2 = document.createElement('p');
        p2.style.fontSize = '12px';
        p2.style.marginTop = '4px';
        p2.textContent = getMsg('empty_start');

        wrapper.appendChild(p1);
        wrapper.appendChild(p2);
        sitesList.appendChild(wrapper);
        return;
    }
    
    sortedSites.forEach(([site, time]) => {
        const siteItem = createSiteItem(site, time);
        sitesList.appendChild(siteItem);
    });
}

function createSiteItem(siteName, timeSpent) {
    const item = document.createElement('div');
    item.className = 'site-item';
    
    const siteInfo = document.createElement('div');
    siteInfo.className = 'site-info';
    
    const favicon = document.createElement('div');
    favicon.className = 'site-favicon';
    favicon.textContent = siteName.charAt(0).toUpperCase();
    
    const name = document.createElement('div');
    name.className = 'site-name';
    name.textContent = siteName;
    
    const time = document.createElement('div');
    time.className = 'site-time';
    time.textContent = formatTime(timeSpent);
    
    siteInfo.appendChild(favicon);
    siteInfo.appendChild(name);
    item.appendChild(siteInfo);
    item.appendChild(time);
    
    return item;
}

function loadWeekTabData() {
    if (hasExtApi()) {
        browser.runtime.sendMessage({action: 'getWeekData'}).then(weekData => {
            displayWeekStats(weekData);
            renderWeekChart(weekData);
        }).catch(() => {
            const fallbackWeekData = {
                'Pazartesi': 7200000,
                'Salı': 5400000,
                'Çarşamba': 9000000,
                'Perşembe': 6300000,
                'Cuma': 8100000,
                'Cumartesi': 3600000,
                'Pazar': 1800000
            };
            displayWeekStats(fallbackWeekData);
            renderWeekChart(fallbackWeekData);
        });
    } else {
        const fallbackWeekData = {
            'Pazartesi': 7200000,
            'Salı': 5400000,
            'Çarşamba': 9000000,
            'Perşembe': 6300000,
            'Cuma': 8100000,
            'Cumartesi': 3600000,
            'Pazar': 1800000
        };
        displayWeekStats(fallbackWeekData);
        renderWeekChart(fallbackWeekData);
    }
}

function displayWeekStats(weekData) {
    const weekStats = document.getElementById('weekStats');
    if (!weekStats) return;
    
    weekStats.innerHTML = '';
    const locale = getUILocale();
    const dates = getLast7Dates();

    dates.forEach(d => {
        const key = d.toDateString();
        const dayObj = weekData[key] || {};
        const totalMs = Object.values(dayObj).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
        const label = formatWeekdayShort(d, locale);
        const dayItem = createWeekDayItem(label, totalMs);
        weekStats.appendChild(dayItem);
    });
}

function createWeekDayItem(dayName, timeSpent) {
    const item = document.createElement('div');
    item.className = 'week-day';
    
    const name = document.createElement('div');
    name.className = 'week-day-name';
    name.textContent = dayName;
    
    const time = document.createElement('div');
    time.className = 'week-day-time';
    time.textContent = formatTime(timeSpent);
    
    item.appendChild(name);
    item.appendChild(time);
    
    return item;
}

function loadStatsTabData() {
    if (hasExtApi()) {
        Promise.all([
            browser.runtime.sendMessage({action: 'getTotalTime'}),
            browser.runtime.sendMessage({action: 'getWeekData'}),
            browser.runtime.sendMessage({action: 'getTodayData'})
        ]).then(([totalTime, weekData, todayData]) => {
            displayGeneralStats(totalTime, weekData, todayData);
            renderWeekChart(weekData);
        }).catch(() => {
            const weekData = { 'Pazartesi': 7200000, 'Salı': 5400000 };
            displayGeneralStats(
                86400000,
                weekData,
                { 'github.com': 3600000, 'youtube.com': 1800000 }
            );
            renderWeekChart(weekData);
        });
    } else {
        const weekData = { 'Pazartesi': 7200000, 'Salı': 5400000 };
        displayGeneralStats(
            86400000,
            weekData,
            { 'github.com': 3600000, 'youtube.com': 1800000 }
        );
        renderWeekChart(weekData);
    }
}

function displayGeneralStats(totalTime, weekData, todayData) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    // Calculate statistics
    let weekTotal = 0;
    Object.values(weekData).forEach(dayTotal => {
        weekTotal += dayTotal;
    });
    
    const todayTotal = Object.values(todayData).reduce((sum, time) => sum + time, 0);
    const avgDaily = weekTotal / 7;
    const totalSites = Object.keys(todayData).length;
    
    const stats = [
        { label: getMsg('stat_total'), value: formatTime(totalTime) },
        { label: getMsg('stat_week'), value: formatTime(weekTotal) },
        { label: getMsg('stat_avgDaily'), value: formatTime(avgDaily) },
        { label: getMsg('stat_activeSites'), value: totalSites.toString() }
    ];
    
    statsGrid.innerHTML = '';
    
    stats.forEach(stat => {
        const statItem = createStatItem(stat.label, stat.value);
        statsGrid.appendChild(statItem);
    });
}

function createStatItem(label, value) {
    const item = document.createElement('div');
    item.className = 'stat-item';
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'stat-label';
    labelDiv.textContent = label;
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'stat-value';
    valueDiv.textContent = value;
    
    item.appendChild(labelDiv);
    item.appendChild(valueDiv);
    
    return item;
}

function formatTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '00:00:00';
    
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Add smooth interactions
document.addEventListener('click', function(e) {
    // Add ripple effect to clickable elements
    if (e.target.classList.contains('tab-btn') || 
        e.target.classList.contains('card') || 
        e.target.classList.contains('site-item')) {
        
        createRippleEffect(e.target, e);
    }
});

function createRippleEffect(element, event) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(99, 102, 241, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Update status indicator
function updateStatusIndicator() {
    const indicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (indicator && statusText) {
        indicator.classList.add('active');
        statusText.textContent = getMsg('status_active');
    }
}

// Initialize status
setTimeout(updateStatusIndicator, 1000);

// ===== Line Chart (Week) =====
function renderWeekChart(weekData) {
    const canvas = document.getElementById('weekChart');
    if (!canvas) return;

    const locale = getUILocale();
    const dates = getLast7Dates();
    const labels = dates.map(d => formatWeekdayShort(d, locale));

    // Sum milliseconds per day from stored site times
    const valuesMs = dates.map(d => {
        const key = d.toDateString();
        const dayObj = weekData[key] || {};
        return Object.values(dayObj).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
    });
    const valuesHours = valuesMs.map(ms => Math.round((ms / 3600000) * 100) / 100);

    // Localized axis labels and title
    drawLineChart(canvas, labels, valuesHours, {
        yLabel: getMsg('chart_hours'),
        xLabel: getMsg('chart_days'),
        title: getMsg('chart_title_week'),
        color: getAccentColor(),
    });

    // ARIA description for accessibility
    canvas.setAttribute('aria-label', getMsg('chart_desc_week'));
}

function getAccentColor() {
    const root = getComputedStyle(document.documentElement);
    const c = root.getPropertyValue('--accent-primary').trim();
    return c || '#ff7c2a';
}

function drawLineChart(canvas, labels, values, opts) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || canvas.clientWidth || canvas.width;
    const cssHeight = rect.height || canvas.clientHeight || canvas.height;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = { left: 32, right: 8, top: 12, bottom: 24 };
    const w = cssWidth - padding.left - padding.right;
    const h = cssHeight - padding.top - padding.bottom;
    const originX = padding.left;
    const originY = padding.top + h;

    const maxVal = Math.max(...values, 1);
    const niceMax = Math.ceil(maxVal / 0.5) * 0.5; // round to 0.5h steps
    const ticks = Math.max(3, Math.min(6, Math.round(h / 40)));

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Optional title
    if (opts && opts.title) {
        ctx.fillStyle = '#2b2b2b';
        ctx.font = '12px Courier New, monospace';
        const tw = ctx.measureText(opts.title).width;
        ctx.fillText(opts.title, originX + w / 2 - tw / 2, padding.top);
    }

    // Axes
    ctx.strokeStyle = '#b7b1a4';
    ctx.lineWidth = 1;
    // Y axis
    ctx.beginPath();
    ctx.moveTo(originX, padding.top);
    ctx.lineTo(originX, originY);
    ctx.stroke();
    // X axis
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + w, originY);
    ctx.stroke();

    // Grid + Y labels
    ctx.fillStyle = '#4b4b46';
    ctx.font = '11px Courier New, monospace';
    for (let i = 0; i <= ticks; i++) {
        const yVal = Math.round(((niceMax / ticks) * i) * 100) / 100;
        const y = originY - (yVal / niceMax) * h;
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(originX + w, y);
        ctx.stroke();
        ctx.fillText(`${yVal}h`, 6, y + 3);
    }

    // X labels
    const stepX = w / (labels.length - 1 || 1);
    labels.forEach((lab, i) => {
        const x = originX + i * stepX;
        ctx.fillText(lab, Math.max(6, x - 22), originY + 14);
    });

    // Axis titles (small)
    ctx.fillStyle = '#2b2b2b';
    ctx.font = '11px Courier New, monospace';
    ctx.fillText(opts.yLabel || 'Saat', 6, padding.top - 2);
    ctx.fillText(opts.xLabel || 'Günler', originX + w - 44, originY + 22);

    // Line
    ctx.strokeStyle = opts.color || '#ff7c2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
        const x = originX + i * stepX;
        const y = originY - (v / niceMax) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    ctx.fillStyle = opts.color || '#ff7c2a';
    values.forEach((v, i) => {
        const x = originX + i * stepX;
        const y = originY - (v / niceMax) * h;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Helpers for localized week rendering
function getLast7Dates() {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        arr.push(d);
    }
    return arr;
}

function formatWeekdayShort(date, locale) {
    try {
        return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    } catch (_) {
        // Fallback: English short names
        const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return names[date.getDay()];
    }
}