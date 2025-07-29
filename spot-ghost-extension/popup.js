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
  await initializePopup();
  setupEventHandlers();
  await loadSettings();
  await detectCurrentPlatform();
  await loadStats();
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
  
  // Footer links
  document.getElementById('website-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spotghost.com' });
  });
  
  document.getElementById('support-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spotghost.com/support' });
  });
  
  document.getElementById('feedback-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spotghost.com/feedback' });
  });
  
  document.getElementById('upgrade-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://spotghost.com/premium' });
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
    showStatus('Extracting job data...', 'info');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a supported platform
    const platform = detectPlatformFromUrl(tab.url);
    if (!platform || !platform.supported) {
      throw new Error('Please navigate to a supported job site first');
    }
    
    // Extract job data from content script
    const jobData = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Failed to connect to page. Please refresh and try again.'));
          return;
        }
        
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        
        if (!response || !response.title || !response.company) {
          reject(new Error('Could not extract job data. Please ensure you\'re on a job posting page.'));
          return;
        }
        
        resolve(response);
      });
    });
    
    showStatus('Analyzing for scams and red flags...', 'info');
    
    // Send to background for analysis
    const analysis = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: jobData
      }, (response) => {
        if (response && response.success) {
          resolve(response.analysis);
        } else {
          reject(new Error(response?.error || 'Analysis failed'));
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
    console.error('Analysis error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    analyzeBtn.classList.remove('loading');
    analyzeBtn.disabled = false;
  }
}

// Display analysis results in the UI
function displayAnalysisResults(analysis) {
  const resultsSection = document.getElementById('results-section');
  const emptyState = document.getElementById('empty-state');
  
  // Hide empty state, show results
  emptyState.style.display = 'none';
  resultsSection.style.display = 'block';
  
  // Update safety score
  const safetyScore = analysis.job?.classicAnalysis?.safetyScore || 0;
  const riskLevel = analysis.job?.classicAnalysis?.riskLevel || 'Unknown';
  
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
  
  // Display red flags
  const redFlags = analysis.job?.classicAnalysis?.redFlags || [];
  displayFlags('red-flags', redFlags, 'red');
  
  // Display green flags
  const greenFlags = analysis.job?.classicAnalysis?.greenFlags || [];
  displayFlags('green-flags', greenFlags, 'green');
  
  // Show/hide flag sections
  document.getElementById('red-flags-section').style.display = redFlags.length > 0 ? 'block' : 'none';
  document.getElementById('green-flags-section').style.display = greenFlags.length > 0 ? 'block' : 'none';
}

// Display flags in the UI
function displayFlags(sectionId, flags, type) {
  const list = document.getElementById(`${sectionId}-list`);
  list.innerHTML = '';
  
  flags.forEach(flag => {
    const li = document.createElement('li');
    li.className = `flag-item ${type}`;
    li.textContent = flag;
    list.appendChild(li);
  });
}

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  // Auto-hide success/error messages after 5 seconds
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 5000);
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
  if (!lastAnalysis) return;
  
  // Open detailed analysis in new tab
  chrome.tabs.create({
    url: `https://spotghost.com/analysis?id=${encodeURIComponent(lastAnalysis.job?.sourceURL || '')}`
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
