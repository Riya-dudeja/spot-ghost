// Cache for analysis results and company data
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SCAM_COMPANIES_CACHE_KEY = 'spotghost_scam_companies';
const ANALYSIS_CACHE_PREFIX = 'spotghost_analysis_';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('SpotGhost installed/updated:', details.reason);
  
  // Set up default settings
  await chrome.storage.local.set({
    realTimeAnalysis: true,
    showNotifications: true,
    autoScan: true,
    extensionEnabled: true,
    apiEndpoint: 'http://localhost:3000',
    lastUpdate: Date.now()
  });
  
  // Show welcome notification
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      title: 'SpotGhost Installed!',
      message: 'Your job scam protection is now active. Visit any job site to get started.'
    });
  }
  
  // Update scam companies database
  await updateScamCompaniesDatabase();
});

// Handle tab updates for real-time analysis
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const settings = await chrome.storage.local.get(['realTimeAnalysis', 'extensionEnabled']);
    
    if (settings.extensionEnabled && settings.realTimeAnalysis && isJobSite(tab.url)) {
      // Inject real-time analysis
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: initializeRealTimeAnalysis
        });
      } catch (error) {
        console.error('Failed to inject real-time analysis:', error);
      }
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'analyzeJob':
      handleJobAnalysis(message.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'getCachedAnalysis':
      getCachedAnalysis(message.jobId, sendResponse);
      return true;
      
    case 'reportScam':
      handleScamReport(message.data, sendResponse);
      return true;
      
    case 'getSettings':
      getSettings(sendResponse);
      return true;
      
    case 'updateSettings':
      updateSettings(message.settings, sendResponse);
      return true;
      
    case 'checkCompanyReputation':
      checkCompanyReputation(message.company, sendResponse);
      return true;
  }
});

// Check if URL is a supported job site
function isJobSite(url) {
  const jobSites = [
    'linkedin.com/jobs',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'ziprecruiter.com',
    'jobs.google.com',
    'careerbuilder.com',
    'simplyhired.com',
    'dice.com',
    'stackoverflow.com/jobs',
    'angel.co',
    'wellfound.com',
    'remote.co',
    'remoteok.io',
    'weworkremotely.com',
    'flexjobs.com',
    'upwork.com',
    'freelancer.com',
    'fiverr.com'
  ];
  
  return jobSites.some(site => url.includes(site));
}

// Initialize real-time analysis on job pages
function initializeRealTimeAnalysis() {
  // This function runs in the page context
  if (window.spotGhostInitialized) return;
  window.spotGhostInitialized = true;
  
  // Create floating analysis button
  const analysisButton = document.createElement('div');
  analysisButton.id = 'spotghost-floating-btn';
  analysisButton.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      color: white;
      padding: 12px 16px;
      border-radius: 25px;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      border: none;
      backdrop-filter: blur(10px);
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      🛡️ Analyze Job
    </div>
  `;
  
  analysisButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(analysisButton);
  
  // Auto-scan for obvious red flags
  setTimeout(autoScanForRedFlags, 2000);
}

// Auto-scan for obvious red flags
function autoScanForRedFlags() {
  const pageText = document.body.innerText.toLowerCase();
  const criticalFlags = [
    'pay upfront fee',
    'processing fee required',
    'training fee',
    'activation fee',
    'wire transfer',
    'western union',
    'cryptocurrency payment',
    'work from home $500/day',
    'no experience needed $300/day',
    'make money fast',
    'pyramid scheme',
    'multi-level marketing'
  ];
  
  const foundFlags = criticalFlags.filter(flag => pageText.includes(flag));
  
  if (foundFlags.length > 0) {
    showWarningOverlay(foundFlags);
  }
}

// Show warning overlay for critical red flags
function showWarningOverlay(flags) {
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(239, 68, 68, 0.1);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(2px);
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(239, 68, 68, 0.3);
        max-width: 500px;
        text-align: center;
        border: 3px solid #ef4444;
      ">
        <h2 style="color: #ef4444; margin: 0 0 15px 0; font-size: 24px;">🚨 SCAM ALERT</h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
          This job posting contains critical red flags commonly found in scams:
        </p>
        <ul style="text-align: left; color: #ef4444; font-weight: 600; margin: 0 0 20px 0;">
          ${flags.map(flag => `<li>${flag}</li>`).join('')}
        </ul>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Close Warning
          </button>
          <button onclick="window.open('https://spotghost.com/report-scam', '_blank')" 
                  style="background: #374151; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Report This Job
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// Handle job analysis requests
async function handleJobAnalysis(jobData, sendResponse) {
  try {
    const settings = await chrome.storage.local.get(['apiEndpoint']);
    const apiUrl = `${settings.apiEndpoint || 'http://localhost:3000'}/api/jobs/analyze`;
    
    // Check cache first
    const cacheKey = generateCacheKey(jobData);
    const cached = await getCachedResult(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      sendResponse({ success: true, analysis: cached.data, cached: true });
      return;
    }
    
    // Perform analysis
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...jobData, method: 'manual' })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Cache the result
      await cacheResult(cacheKey, result);
      
      // Show notification if high risk
      const riskLevel = result.job?.classicAnalysis?.riskLevel;
      if (riskLevel === 'High' || riskLevel === 'Critical') {
        chrome.notifications.create({
          type: 'basic',
          title: '🚨 High Risk Job Detected',
          message: `This job has a ${riskLevel.toLowerCase()} risk level. Please review the analysis carefully.`
        });
      }
      
      sendResponse({ success: true, analysis: result });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Generate cache key for job data
function generateCacheKey(jobData) {
  const key = `${jobData.title}-${jobData.company}-${jobData.description?.substring(0, 100)}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
}

// Cache analysis result
async function cacheResult(key, data) {
  const cacheKey = ANALYSIS_CACHE_PREFIX + key;
  await chrome.storage.local.set({
    [cacheKey]: {
      data: data,
      timestamp: Date.now()
    }
  });
}

// Get cached analysis result
async function getCachedResult(key) {
  const cacheKey = ANALYSIS_CACHE_PREFIX + key;
  const result = await chrome.storage.local.get([cacheKey]);
  return result[cacheKey] || null;
}

// Get cached analysis by job ID
async function getCachedAnalysis(jobId, sendResponse) {
  const cached = await getCachedResult(jobId);
  sendResponse({ cached: !!cached, data: cached });
}

// Handle scam reports
async function handleScamReport(reportData, sendResponse) {
  try {
    const settings = await chrome.storage.local.get(['apiEndpoint']);
    const apiUrl = `${settings.apiEndpoint || 'http://localhost:3000'}/api/report-scam`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      chrome.notifications.create({
        type: 'basic',
        title: 'Report Submitted',
        message: 'Thank you for helping protect the community!'
      });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get extension settings
async function getSettings(sendResponse) {
  const settings = await chrome.storage.local.get([
    'realTimeAnalysis',
    'showNotifications',
    'autoScan',
    'extensionEnabled',
    'apiEndpoint'
  ]);
  sendResponse(settings);
}

// Update extension settings
async function updateSettings(newSettings, sendResponse) {
  await chrome.storage.local.set(newSettings);
  sendResponse({ success: true });
}

// Check company reputation
async function checkCompanyReputation(company, sendResponse) {
  try {
    const scamCompanies = await chrome.storage.local.get([SCAM_COMPANIES_CACHE_KEY]);
    const knownScams = scamCompanies[SCAM_COMPANIES_CACHE_KEY] || [];
    
    const isKnownScam = knownScams.some(scam => 
      scam.toLowerCase().includes(company.toLowerCase()) ||
      company.toLowerCase().includes(scam.toLowerCase())
    );
    
    sendResponse({ 
      isKnownScam,
      reputation: isKnownScam ? 'SCAM' : 'UNKNOWN',
      lastUpdated: await getLastDatabaseUpdate()
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Update scam companies database
async function updateScamCompaniesDatabase() {
  try {
    // Temporarily disabled - endpoint not implemented yet
    console.log('Scam companies database update skipped - endpoint not available');
    
    // Set empty array as placeholder
    await chrome.storage.local.set({
      [SCAM_COMPANIES_CACHE_KEY]: [],
      lastDatabaseUpdate: Date.now()
    });
  } catch (error) {
    console.error('Failed to update scam companies database:', error);
  }
}

// Get last database update timestamp
async function getLastDatabaseUpdate() {
  const result = await chrome.storage.local.get(['lastDatabaseUpdate']);
  return result.lastDatabaseUpdate || 0;
}

// Clean up old cache entries
async function cleanupCache() {
  const storage = await chrome.storage.local.get();
  const now = Date.now();
  const keysToRemove = [];
  
  for (const [key, value] of Object.entries(storage)) {
    if (key.startsWith(ANALYSIS_CACHE_PREFIX) && 
        value.timestamp && 
        (now - value.timestamp) > CACHE_DURATION) {
      keysToRemove.push(key);
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`Cleaned up ${keysToRemove.length} expired cache entries`);
  }
}

// Run cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

// Update scam database every 6 hours
setInterval(updateScamCompaniesDatabase, 6 * 60 * 60 * 1000);