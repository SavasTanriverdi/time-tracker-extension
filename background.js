// Time Tracker - Background Script
let activeTabId = null;
let currentSite = null;
let sessionStartTime = null;
let siteStartTime = null;

// On extension start
browser.runtime.onStartup.addListener(() => {
  initializeSession();
});

browser.runtime.onInstalled.addListener(() => {
  initializeSession();
});

// Listen for tab activation changes
browser.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

// Listen for URL updates in the active tab
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tabId === activeTabId) {
    handleSiteChange(tab.url);
  }
});

// Listen for window focus changes
browser.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    // Firefox lost focus
    handleFocusLost();
  } else {
    // Firefox regained focus
    handleFocusGained();
  }
});

function initializeSession() {
  sessionStartTime = Date.now();
  
  // Get active tab
  browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
    if (tabs.length > 0) {
      activeTabId = tabs[0].id;
      handleSiteChange(tabs[0].url);
    }
  }).catch(console.error);
  
  // Schedule daily data cleanup (at midnight)
  scheduleDataCleanup();
}

function handleTabChange(tabId) {
  if (activeTabId !== tabId) {
    // Save previous site time
    if (currentSite && siteStartTime) {
      saveSiteTime(currentSite, Date.now() - siteStartTime);
    }
    
    activeTabId = tabId;
    
    // Get URL of the new active tab
    browser.tabs.get(tabId).then((tab) => {
      handleSiteChange(tab.url);
    }).catch(() => {
      // Tab not found; likely closed
      currentSite = null;
      siteStartTime = null;
    });
  }
}

function handleSiteChange(url) {
  // Save previous site time
  if (currentSite && siteStartTime) {
    saveSiteTime(currentSite, Date.now() - siteStartTime);
  }
  
  // Set new current site info
  currentSite = extractDomain(url);
  siteStartTime = Date.now();
}

function handleFocusLost() {
  if (currentSite && siteStartTime) {
    saveSiteTime(currentSite, Date.now() - siteStartTime);
    siteStartTime = null; // Stop timing when focus is lost
  }
}

function handleFocusGained() {
  if (currentSite && !siteStartTime) {
    siteStartTime = Date.now(); // Resume timing when focus is regained
  }
}

function extractDomain(url) {
  try {
    if (!url || url.startsWith('about:') || url.startsWith('moz-extension:')) {
      return 'Firefox Internal Pages';
    }
    
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'Unknown Site';
  }
}

function saveSiteTime(site, timeSpent) {
  if (timeSpent < 1000) return; // Do not record durations less than 1s
  
  const today = new Date().toDateString();
  
  browser.storage.local.get([today, 'totalTime']).then((result) => {
    const todayData = result[today] || {};
    const totalTime = result.totalTime || 0;
    
    // Update site time
    if (!todayData[site]) {
      todayData[site] = 0;
    }
    todayData[site] += timeSpent;
    
    // Update total time
    const newTotalTime = totalTime + timeSpent;
    
    // Persist data
    const dataToSave = {};
    dataToSave[today] = todayData;
    dataToSave['totalTime'] = newTotalTime;
    
    browser.storage.local.set(dataToSave).catch(console.error);
  }).catch(console.error);
}

function scheduleDataCleanup() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupOldData();
    // Cleanup every day at midnight
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

function cleanupOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  browser.storage.local.get().then((allData) => {
    const keysToRemove = [];
    
    Object.keys(allData).forEach((key) => {
      if (key !== 'totalTime') {
        const keyDate = new Date(key);
        if (keyDate < thirtyDaysAgo) {
          keysToRemove.push(key);
        }
      }
    });
    
    if (keysToRemove.length > 0) {
      browser.storage.local.remove(keysToRemove).catch(console.error);
    }
  }).catch(console.error);
}

// Message listener for data requests from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTodayData') {
    getTodayData().then(sendResponse).catch(console.error);
    return true; // Asenkron yanıt için
  } else if (request.action === 'getWeekData') {
    getWeekData().then(sendResponse).catch(console.error);
    return true;
  } else if (request.action === 'getTotalTime') {
    browser.storage.local.get(['totalTime']).then((result) => {
      sendResponse(result.totalTime || 0);
    }).catch(console.error);
    return true;
  }
});

function getTodayData() {
  const today = new Date().toDateString();
  return browser.storage.local.get([today]).then((result) => {
    return result[today] || {};
  });
}

function getWeekData() {
  const promises = [];
  const weekData = {};
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toDateString();
    
    promises.push(
      browser.storage.local.get([dateString]).then((result) => {
        weekData[dateString] = result[dateString] || {};
      })
    );
  }
  
  return Promise.all(promises).then(() => weekData);
}