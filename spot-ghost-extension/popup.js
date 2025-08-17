// SpotGhost Popup Script - Modern UI with Advanced Features

// Global state
let currentTab = 'analyze';
let lastAnalysis = null;
let settings = {
  realTimeAnalysis: true,
  showNotifications: true,
  autoScan: true,
  extensionEnabled: true,
  advancedAI: false
};

// Platform detection mapping
const PLATFORM_CONFIG = {
  'linkedin.com': { name: 'LinkedIn', icon: '💼', supported: true },
  'indeed.com': { name: 'Indeed', icon: '🔍', supported: true },
  'glassdoor.com': { name: 'Glassdoor', icon: '🏢', supported: true },
  'monster.com': { name: 'Monster', icon: '👹', supported: true },
  'ziprecruiter.com': { name: 'ZipRecruiter', icon: '⚡', supported: true },
  'jobs.google.com': { name: 'Google Jobs', icon: '🎯', supported: true },
  'careerbuilder.com': { name: 'CareerBuilder', icon: '🏗️', supported: true },
  'simplyhired.com': { name: 'SimplyHired', icon: '✨', supported: true },
  'dice.com': { name: 'Dice', icon: '🎲', supported: true },
  'stackoverflow.com': { name: 'Stack Overflow', icon: '💻', supported: true },
  'angel.co': { name: 'AngelList', icon: '👼', supported: true },
  'wellfound.com': { name: 'Wellfound', icon: '🚀', supported: true },
  'remote.co': { name: 'Remote.co', icon: '🌍', supported: true },
  'remoteok.io': { name: 'RemoteOK', icon: '✈️', supported: true },
  'weworkremotely.com': { name: 'We Work Remotely', icon: '💼', supported: true },
  'flexjobs.com': { name: 'FlexJobs', icon: '🤸', supported: true },
  'upwork.com': { name: 'Upwork', icon: '🆙', supported: true },
  'freelancer.com': { name: 'Freelancer', icon: '💪', supported: true },
  'fiverr.com': { name: 'Fiverr', icon: '5️⃣', supported: true }
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('SpotGhost Popup: Starting initialization...');
  try {
    await initializePopup();
    setupEventHandlers();
    await loadSettings();
    await detectCurrentPlatform();
    await loadStats();
    console.log('SpotGhost Popup: Initialization complete');
  } catch (error) {
    console.error('SpotGhost Popup: Initialization failed:', error);
    showStatus('Extension initialization failed: ' + error.message, 'error');
  }
});

// Initialize popup components
async function initializePopup() {
  console.log('SpotGhost Popup: Initializing...');
  
  // Setup tab switching
  setupTabs();
  
  // Load any cached analysis
  await loadCachedAnalysis();
  
  // Update UI state
  updateUIState();
}

// Setup tab functionality
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });
      
      currentTab = targetTab;
      
      // Load tab-specific data
      if (targetTab === 'stats') {
        loadStats();
      }
    });
  });
}

// Setup all event handlers
function setupEventHandlers() {
  // Analyze button
  const analyzeBtn = document.getElementById('analyze-btn');
  analyzeBtn.addEventListener('click', handleAnalyzeClick);
  
  // Settings toggles
  setupSettingsToggles();
  
  // Action buttons
  document.getElementById('report-btn')?.addEventListener('click', handleReportScam);
  document.getElementById('details-btn')?.addEventListener('click', handleViewDetails);
  
  // Permission buttons
  document.getElementById('grant-permissions-btn')?.addEventListener('click', handlePermissionGrant);
  document.getElementById('deny-permissions-btn')?.addEventListener('click', handlePermissionDenial);
  
  // Footer links
  document.getElementById('website-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app' });
  });
  
  document.getElementById('support-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard' });
  });
  
  document.getElementById('feedback-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard' });
  });
  
  document.getElementById('upgrade-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard' });
  });
}

// Setup settings toggle switches
function setupSettingsToggles() {
  const toggles = [
    { id: 'realtime-toggle', setting: 'realTimeAnalysis' },
    { id: 'notifications-toggle', setting: 'showNotifications' },
    { id: 'autoscan-toggle', setting: 'autoScan' },
    { id: 'ai-toggle', setting: 'advancedAI' }
  ];
  
  toggles.forEach(({ id, setting }) => {
    const toggle = document.getElementById(id);
    if (toggle) {
      toggle.addEventListener('click', () => {
        const isActive = toggle.classList.contains('active');
        settings[setting] = !isActive;
        
        if (!isActive) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
        
        saveSettings();
        
        // Send settings to background script
        chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings: settings
        });
      });
    }
  });
}

// Handle analyze button click
async function handleAnalyzeClick() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const status = document.getElementById('status');
  
  try {
    // Show loading state
    analyzeBtn.classList.add('loading');
    analyzeBtn.disabled = true;
    showStatus('Checking permissions...', 'info');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      throw new Error('Unable to access the current tab');
    }
    
    // Check if we're on a supported platform
    const platform = detectPlatformFromUrl(tab.url);
    const hostname = new URL(tab.url).hostname;
    
    if (!platform || !platform.supported) {
      // Show specific error with supported sites
      const supportedSites = Object.keys(PLATFORM_CONFIG).map(domain => {
        const config = PLATFORM_CONFIG[domain];
        return `${config.name} (${domain})`;
      }).slice(0, 5).join(', ') + '...';
      
      throw new Error(`❌ Not a supported job site\n\nCurrent site: ${hostname}\n\nSupported sites:\n${supportedSites}\n\nPlease navigate to a job posting on one of these sites.`);
    }
    
    console.log(`Detected platform: ${platform.name} on ${hostname}`);
    
    // Check if we have permissions for this site
    const hasPermissions = await checkSitePermissions(hostname);
    
    if (!hasPermissions) {
      // Show permissions request screen
      showPermissionsScreen(hostname, platform.name);
      return;
    }
    
    showStatus('Extracting job data...', 'info');
    
    // Rest of the analysis logic remains the same...
    await performJobAnalysis(tab, platform, hostname);
    
  } catch (error) {
    console.error('SpotGhost Analysis Error:', error);
    
    // Show user-friendly error message
    const errorMessage = error.message || 'Unknown error occurred';
    showStatus(errorMessage, 'error');
    
    // Log additional debug info
    console.log('Debug Info:', {
      currentUrl: tab?.url,
      platform: platform?.name,
      timestamp: new Date().toISOString()
    });
    
  } finally {
    analyzeBtn.classList.remove('loading');
    analyzeBtn.disabled = false;
  }
}

// Check if we have permissions for the current site
async function checkSitePermissions(hostname) {
  try {
    // Check if we have host permissions for this site
    const hasHostPermission = await chrome.permissions.contains({
      origins: [`https://${hostname}/*`]
    });
    
    // Check if we have scripting permission
    const hasScriptingPermission = await chrome.permissions.contains({
      permissions: ['scripting']
    });
    
    return hasHostPermission && hasScriptingPermission;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// Show permissions request screen
function showPermissionsScreen(hostname, platformName) {
  const emptyState = document.getElementById('empty-state');
  const resultsSection = document.getElementById('results-section');
  const permissionsScreen = document.getElementById('permissions-screen');
  
  // Hide other sections
  emptyState.style.display = 'none';
  resultsSection.style.display = 'none';
  
  // Update permissions screen content
  const title = permissionsScreen.querySelector('h3');
  const description = permissionsScreen.querySelector('p');
  
  title.textContent = `Enable ${platformName} Access`;
  description.textContent = `SpotGhost needs permission to analyze job postings on ${hostname} for scam detection.`;
  
  // Show permissions screen
  permissionsScreen.style.display = 'block';
}

// Handle permission grant
async function handlePermissionGrant() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const hostname = new URL(tab.url).hostname;
    
    showStatus('Requesting permissions...', 'info');
    
    // Request permissions
    const granted = await chrome.permissions.request({
      permissions: ['scripting'],
      origins: [`https://${hostname}/*`]
    });
    
    if (granted) {
      showStatus('Permissions granted! Analyzing job...', 'success');
      
      // Hide permissions screen
      document.getElementById('permissions-screen').style.display = 'none';
      
      // Proceed with analysis
      const platform = detectPlatformFromUrl(tab.url);
      await performJobAnalysis(tab, platform, hostname);
    } else {
      showStatus('Permissions denied. Cannot analyze job without access.', 'error');
    }
  } catch (error) {
    console.error('Permission grant error:', error);
    showStatus('Failed to request permissions. Please try again.', 'error');
  }
}

// Handle permission denial
function handlePermissionDenial() {
  document.getElementById('permissions-screen').style.display = 'none';
  document.getElementById('empty-state').style.display = 'block';
  showStatus('Analysis requires site access. Click "Analyze This Job" to try again.', 'info');
}

// Perform the actual job analysis (extracted from handleAnalyzeClick)
async function performJobAnalysis(tab, platform, hostname) {
  // Test content script communication with specific error messages
  let contentScriptReady = false;
  
  try {
    // Test if content script is already loaded
    const pingResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Content script not responding')), 3000);
      
      chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(`Chrome extension error: ${chrome.runtime.lastError.message}`));
        } else if (response && response.status === 'ready') {
          resolve(response);
        } else {
          reject(new Error('Content script not properly initialized'));
        }
      });
    });
    
    contentScriptReady = true;
    console.log('Content script already loaded:', pingResult);
    
  } catch (pingError) {
    console.log('Content script not loaded, injecting:', pingError.message);
    
    // Inject content script manually
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Wait for initialization and test again
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const secondPing = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Injected content script not responding')), 3000);
        
        chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(`Post-injection error: ${chrome.runtime.lastError.message}`));
          } else if (response && response.status === 'ready') {
            resolve(response);
          } else {
            reject(new Error('Injected content script failed to initialize'));
          }
        });
      });
      
      contentScriptReady = true;
      console.log('Content script injected and ready:', secondPing);
      
    } catch (injectionError) {
      throw new Error(`❌ Extension injection failed\n\nCause: ${injectionError.message}\n\nSolution:\n1. Refresh the page (F5)\n2. Try again\n3. Check if you're on the actual job posting page (not search results)`);
    }
  }
  
  if (!contentScriptReady) {
    throw new Error('❌ Extension not ready\n\nPlease refresh the page and try again.');
  }

  try {
    // Extract job data with specific error messages
    showStatus('Extracting job information...', 'info');
    
    const jobData = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('❌ Data extraction timeout\n\nThe page may still be loading.\nPlease wait a moment and try again.'));
    }, 15000);
    
    chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, (response) => {
      clearTimeout(timeout);
      
      if (chrome.runtime.lastError) {
        reject(new Error(`❌ Communication error\n\n${chrome.runtime.lastError.message}\n\nSolution: Refresh the page and try again.`));
        return;
      }
      
      if (response && response.error) {
        reject(new Error(`❌ Extraction failed\n\n${response.error}\n\nMake sure you're on a job posting page (not search results).`));
        return;
      }
      
      if (!response) {
        reject(new Error('❌ No response from page\n\nThe page content may not be compatible.\nTry refreshing and ensure you\'re on a job posting.'));
        return;
      }
      
      if (!response.title && !response.company) {
        reject(new Error(`❌ No job data found\n\nPage type: ${platform.name}\nURL: ${hostname}\n\nSolution:\n1. Make sure you're on a specific job posting\n2. Wait for the page to fully load\n3. Try refreshing the page`));
        return;
      }
      
      if (!response.title) {
        reject(new Error('❌ Job title not found\n\nThis might not be a job posting page.\nPlease navigate to a specific job listing.'));
        return;
      }
      
      if (!response.company) {
        reject(new Error('❌ Company name not found\n\nThe page structure may be different than expected.\nPlease try a different job posting.'));
        return;
      }
      
      console.log('✅ Job data extracted successfully:', response);
      resolve(response);
    });
  });

  showStatus('Analyzing for scams and red flags...', 'info');
  
  // Send to background for analysis with better error handling
  const analysis = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('❌ Analysis timeout\n\nThe analysis server may be unavailable.\nPlease try again in a moment.'));
    }, 30000);
    
    chrome.runtime.sendMessage({
      action: 'analyzeJob',
      data: jobData
    }, (response) => {
      clearTimeout(timeout);
      
      if (chrome.runtime.lastError) {
        reject(new Error(`❌ Extension error\n\n${chrome.runtime.lastError.message}\n\nTry reloading the extension.`));
        return;
      }
      
      if (!response) {
        reject(new Error('❌ No analysis response\n\nThe background service may have stopped.\nTry reloading the extension.'));
        return;
      }
      
      if (response.success) {
        resolve(response.analysis);
      } else {
        const errorMsg = response.error || 'Unknown analysis error';
        if (errorMsg.includes('fetch')) {
          reject(new Error(`❌ Server connection failed\n\nCannot reach analysis server.\n\nCheck:\n1. Internet connection\n2. Server status\n3. Extension settings`));
        } else {
          reject(new Error(`❌ Analysis failed\n\n${errorMsg}`));
        }
      }
    });
  });

  // Display results
  displayAnalysisResults(analysis);
  lastAnalysis = analysis;

  // Update stats
  await updateStats('scan');

  showStatus('Analysis complete!', 'success');
  
  } catch (error) {
    console.error('❌ Job analysis error:', error);
    showStatus(error.message || 'Analysis failed', 'error');
    
    // Hide loading and show error state
    document.getElementById('loading-spinner').style.display = 'none';
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Page';
    }
  }
}

// Display analysis results in the UI
function displayAnalysisResults(analysis) {
  const resultsSection = document.getElementById('results-section');
  const emptyState = document.getElementById('empty-state');
  
  // Hide empty state, show results
  emptyState.style.display = 'none';
  resultsSection.style.display = 'block';
  
  // Get analysis data
  const classicAnalysis = analysis.job?.classicAnalysis || {};
  const aiAnalysis = analysis.job?.aiAnalysis || null;
  const safetyScore = classicAnalysis.safetyScore || 0;
  const riskLevel = classicAnalysis.riskLevel || 'Unknown';
  
  console.log('📊 Analysis Results:', {
    hasClassic: !!classicAnalysis,
    hasAI: !!aiAnalysis,
    safetyScore,
    riskLevel,
    fullAnalysis: analysis
  });
  
  // Update safety score
  document.getElementById('safety-score').textContent = safetyScore;
  document.getElementById('risk-level').textContent = riskLevel;
  document.getElementById('risk-level').className = `risk-level risk-${riskLevel.toLowerCase().replace(' ', '-')}`;
  
  // Update score circle color
  const scoreCircle = document.getElementById('score-circle');
  scoreCircle.className = 'score-circle';
  if (safetyScore >= 70) {
    scoreCircle.classList.add('score-high');
  } else if (safetyScore >= 40) {
    scoreCircle.classList.add('score-medium');
  } else {
    scoreCircle.classList.add('score-low');
  }
  
  // Display AI Analysis or Classic Analysis
  let redFlags = [];
  let greenFlags = [];
  
  if (aiAnalysis) {
    console.log('✅ AI Analysis available:', aiAnalysis);
    
    // Show AI analysis section
    const aiAnalysisSection = document.getElementById('ai-analysis');
    if (aiAnalysisSection) {
      aiAnalysisSection.style.display = 'block';
    }
    
    // Use AI analysis if available
    redFlags = aiAnalysis.redFlags || [];
    greenFlags = aiAnalysis.greenFlags || [];
    
    // Add AI verdict and summary at the top
    const aiVerdictElement = document.getElementById('ai-verdict');
    const aiSummaryElement = document.getElementById('ai-summary');
    
    if (aiVerdictElement && aiAnalysis.verdict) {
      aiVerdictElement.textContent = `AI Verdict: ${aiAnalysis.verdict}`;
      aiVerdictElement.className = `ai-verdict ${aiAnalysis.verdict?.toLowerCase() || 'unknown'}`;
      aiVerdictElement.style.display = 'block';
    }
    
    if (aiSummaryElement && aiAnalysis.summary) {
      aiSummaryElement.textContent = aiAnalysis.summary;
      aiSummaryElement.style.display = 'block';
    }
    
    // Add AI-specific sections
    if (aiAnalysis.companyAnalysis) {
      addAnalysisSection('🏢 Company Analysis', aiAnalysis.companyAnalysis);
    }
    
    if (aiAnalysis.jobDescriptionAnalysis) {
      addAnalysisSection('📝 Job Description Analysis', aiAnalysis.jobDescriptionAnalysis);
    }
    
    if (aiAnalysis.contactAnalysis) {
      addAnalysisSection('📧 Contact Analysis', aiAnalysis.contactAnalysis);
    }
    
    if (aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0) {
      addRecommendationsSection(aiAnalysis.recommendations);
    }
    
  } else {
    console.log('ℹ️ No AI Analysis available, showing classic analysis');
    
    // Hide AI analysis section
    const aiAnalysisSection = document.getElementById('ai-analysis');
    if (aiAnalysisSection) {
      aiAnalysisSection.style.display = 'none';
    }
    
    // Fallback to classic analysis
    redFlags = classicAnalysis.redFlags || [];
    greenFlags = classicAnalysis.greenFlags || [];
    
    // Hide AI-specific elements
    const aiVerdictElement = document.getElementById('ai-verdict');
    const aiSummaryElement = document.getElementById('ai-summary');
    if (aiVerdictElement) aiVerdictElement.style.display = 'none';
    if (aiSummaryElement) aiSummaryElement.style.display = 'none';
  }
  
  // Display flags
  displayFlags('positive-signals', greenFlags, 'green');
  displayFlags('red-flags', redFlags, 'red');
  
  // Show/hide flag sections based on content
  const positiveSection = document.getElementById('positive-signals-section');
  const redFlagsSection = document.getElementById('red-flags-section');
  
  if (positiveSection) {
    positiveSection.style.display = greenFlags.length > 0 ? 'block' : 'none';
  }
  if (redFlagsSection) {
    redFlagsSection.style.display = redFlags.length > 0 ? 'block' : 'none';
  }
}

// Display flags in the UI
function displayFlags(sectionId, flags, type) {
  const list = document.getElementById(`${sectionId}-list`);
  if (!list) return;
  
  list.innerHTML = '';
  
  flags.forEach(flag => {
    const li = document.createElement('li');
    li.className = `flag-item ${type}`;
    li.textContent = flag;
    list.appendChild(li);
  });
}

// Add AI analysis section dynamically
function addAnalysisSection(title, content) {
  const resultsSection = document.getElementById('results-section');
  if (!resultsSection || !content) return;
  
  // Check if section already exists
  const existingSection = document.getElementById(`ai-section-${title.toLowerCase().replace(/\s+/g, '-')}`);
  if (existingSection) {
    existingSection.remove();
  }
  
  const section = document.createElement('div');
  section.id = `ai-section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  section.className = 'analysis-section';
  section.innerHTML = `
    <h3 class="analysis-title">${title}</h3>
    <div class="analysis-content">${content}</div>
  `;
  
  // Insert before the buttons
  const buttonsSection = resultsSection.querySelector('.button-section');
  if (buttonsSection) {
    resultsSection.insertBefore(section, buttonsSection);
  } else {
    resultsSection.appendChild(section);
  }
}

// Add recommendations section
function addRecommendationsSection(recommendations) {
  const resultsSection = document.getElementById('results-section');
  if (!resultsSection || !recommendations || recommendations.length === 0) return;
  
  // Check if section already exists
  const existingSection = document.getElementById('ai-recommendations');
  if (existingSection) {
    existingSection.remove();
  }
  
  const section = document.createElement('div');
  section.id = 'ai-recommendations';
  section.className = 'analysis-section recommendations-section';
  
  let recommendationsHtml = '<h3 class="analysis-title">🔍 AI Recommendations</h3><ul class="recommendations-list">';
  recommendations.forEach(rec => {
    recommendationsHtml += `<li class="recommendation-item">${rec}</li>`;
  });
  recommendationsHtml += '</ul>';
  
  section.innerHTML = recommendationsHtml;
  
  // Insert before the buttons
  const buttonsSection = resultsSection.querySelector('.button-section');
  if (buttonsSection) {
    resultsSection.insertBefore(section, buttonsSection);
  } else {
    resultsSection.appendChild(section);
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  
  // Handle multi-line messages by converting newlines to HTML breaks
  if (message.includes('\n')) {
    status.innerHTML = message.replace(/\n/g, '<br>');
  } else {
    status.textContent = message;
  }
  
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  // Auto-hide success/error messages after longer time for errors
  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  } else if (type === 'error') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 10000); // Longer display time for errors
  }
}

// Detect current platform from URL
function detectPlatformFromUrl(url) {
  if (!url) return null;
  
  for (const [domain, config] of Object.entries(PLATFORM_CONFIG)) {
    if (url.includes(domain)) {
      return config;
    }
  }
  
  return null;
}

// Detect and display current platform
async function detectCurrentPlatform() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const platform = detectPlatformFromUrl(tab.url);
    
    const indicator = document.getElementById('platform-indicator');
    const icon = document.getElementById('platform-icon');
    const name = document.getElementById('platform-name');
    
    if (platform && platform.supported) {
      indicator.classList.remove('unsupported');
      icon.textContent = platform.icon;
      name.textContent = platform.name;
    } else {
      indicator.classList.add('unsupported');
      icon.textContent = '❌';
      name.textContent = 'Unsupported Platform';
    }
  } catch (error) {
    console.error('Platform detection error:', error);
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get([
      'realTimeAnalysis',
      'showNotifications', 
      'autoScan',
      'extensionEnabled',
      'advancedAI'
    ]);
    
    settings = { ...settings, ...stored };
    
    // Update toggle states
    document.getElementById('realtime-toggle').classList.toggle('active', settings.realTimeAnalysis);
    document.getElementById('notifications-toggle').classList.toggle('active', settings.showNotifications);
    document.getElementById('autoscan-toggle').classList.toggle('active', settings.autoScan);
    document.getElementById('ai-toggle').classList.toggle('active', settings.advancedAI);
    
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.local.set(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Load cached analysis if available
async function loadCachedAnalysis() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.runtime.sendMessage({
      action: 'getCachedAnalysis',
      jobId: tab.url
    }, (response) => {
      if (response && response.cached && response.data) {
        displayAnalysisResults(response.data);
        lastAnalysis = response.data;
      }
    });
  } catch (error) {
    console.error('Failed to load cached analysis:', error);
  }
}

// Load and display statistics
async function loadStats() {
  try {
    const stats = await chrome.storage.local.get([
      'totalScans',
      'scamsBlocked',
      'timeSaved',
      'recentScans'
    ]);
    
    document.getElementById('total-scans').textContent = stats.totalScans || 0;
    document.getElementById('scams-blocked').textContent = stats.scamsBlocked || 0;
    document.getElementById('time-saved').textContent = `${stats.timeSaved || 0}h`;
    
    // Display recent scans
    displayRecentScans(stats.recentScans || []);
    
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Display recent scans
function displayRecentScans(scans) {
  const container = document.getElementById('recent-scans-list');
  
  if (scans.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>No Scans Yet</h3>
        <p>Your scan history will appear here once you start analyzing jobs.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  scans.slice(0, 5).forEach(scan => {
    const scanItem = document.createElement('div');
    scanItem.className = 'scan-item';
    
    const scoreClass = scan.safetyScore >= 70 ? 'score-high' : 
                      scan.safetyScore >= 40 ? 'score-medium' : 'score-low';
    
    scanItem.innerHTML = `
      <div class="scan-info">
        <div class="scan-company">${scan.company}</div>
        <div class="scan-time">${formatTime(scan.timestamp)}</div>
      </div>
      <div class="scan-score ${scoreClass}">${scan.safetyScore}</div>
    `;
    
    container.appendChild(scanItem);
  });
}

// Update statistics
async function updateStats(type, data = {}) {
  try {
    const stats = await chrome.storage.local.get([
      'totalScans',
      'scamsBlocked',
      'timeSaved',
      'recentScans'
    ]);
    
    const updated = {
      totalScans: (stats.totalScans || 0),
      scamsBlocked: (stats.scamsBlocked || 0),
      timeSaved: (stats.timeSaved || 0),
      recentScans: stats.recentScans || []
    };
    
    if (type === 'scan') {
      updated.totalScans++;
      updated.timeSaved += 0.5; // Assume 30 minutes saved per scan
      
      if (lastAnalysis) {
        const safetyScore = lastAnalysis.job?.classicAnalysis?.safetyScore || 0;
        const riskLevel = lastAnalysis.job?.classicAnalysis?.riskLevel || 'Unknown';
        
        if (riskLevel === 'High' || riskLevel === 'Critical') {
          updated.scamsBlocked++;
        }
        
        // Add to recent scans
        updated.recentScans.unshift({
          company: lastAnalysis.job?.company || 'Unknown Company',
          safetyScore: safetyScore,
          riskLevel: riskLevel,
          timestamp: Date.now()
        });
        
        // Keep only last 10 scans
        updated.recentScans = updated.recentScans.slice(0, 10);
      }
    }
    
    await chrome.storage.local.set(updated);
    
    // Update UI if on stats tab
    if (currentTab === 'stats') {
      await loadStats();
    }
    
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

// Handle report scam
function handleReportScam() {
  if (!lastAnalysis) return;
  
  chrome.runtime.sendMessage({
    action: 'reportScam',
    data: {
      jobTitle: lastAnalysis.job?.title || '',
      company: lastAnalysis.job?.company || '',
      url: lastAnalysis.job?.sourceURL || '',
      reason: 'User reported as scam',
      analysis: lastAnalysis
    }
  }, (response) => {
    if (response && response.success) {
      showStatus('Thank you for reporting! This helps protect the community.', 'success');
    } else {
      showStatus('Failed to submit report. Please try again.', 'error');
    }
  });
}

// Handle view details
function handleViewDetails() {
  if (!lastAnalysis) {
    showStatus('No analysis data available to view details.', 'error');
    return;
  }
  
  // Store analysis data in session storage for the dashboard to access
  const analysisData = {
    title: lastAnalysis.job?.title || '',
    company: lastAnalysis.job?.company || '',
    url: lastAnalysis.job?.sourceURL || '',
    safetyScore: lastAnalysis.job?.classicAnalysis?.safetyScore || 0,
    riskLevel: lastAnalysis.job?.classicAnalysis?.riskLevel || 'Unknown',
    redFlags: lastAnalysis.job?.classicAnalysis?.redFlags || [],
    greenFlags: lastAnalysis.job?.classicAnalysis?.greenFlags || []
  };
  
  // Open dashboard report page (without auth requirement for extension data)
  chrome.tabs.create({
    url: `https://spot-ghost-jobs.vercel.app/dashboard/report?source=extension&job=${encodeURIComponent(JSON.stringify(analysisData))}`
  });
}

// Update UI state based on current context
function updateUIState() {
  // This can be expanded to handle different UI states
  // For now, it's a placeholder for future enhancements
}

// Format timestamp for display
function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Handle extension errors gracefully
window.addEventListener('error', (event) => {
  console.error('SpotGhost Popup Error:', event.error);
  showStatus('An unexpected error occurred. Please refresh and try again.', 'error');
});

console.log('SpotGhost Popup: Script loaded successfully');