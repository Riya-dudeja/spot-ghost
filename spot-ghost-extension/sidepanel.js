// SpotGhost Side Panel JavaScript

// State management
let currentState = 'welcome'; // welcome, loading, results, error, permissions
let currentAnalysis = null;

// Initialize side panel
document.addEventListener('DOMContentLoaded', async () => {
    console.log('SpotGhost Side Panel: Initializing...');
    
    setupEventListeners();
    await checkCurrentPage();
    
    console.log('SpotGhost Side Panel: Ready');
});

// Setup event listeners
function setupEventListeners() {
    // Main analyze button
    document.getElementById('analyze-btn').addEventListener('click', startAnalysis);
    
    // Analyze another button
    document.getElementById('analyze-another-btn').addEventListener('click', () => {
        showState('welcome');
    });
    
    // Retry button
    document.getElementById('retry-btn').addEventListener('click', startAnalysis);
    
    // Permission buttons
    document.getElementById('grant-permission-btn').addEventListener('click', handlePermissionGrant);
    document.getElementById('deny-permission-btn').addEventListener('click', handlePermissionDeny);
    
    // Action buttons
    document.getElementById('save-job-btn').addEventListener('click', saveCurrentJob);
    document.getElementById('report-scam-btn').addEventListener('click', reportScam);
    document.getElementById('view-full-report-btn').addEventListener('click', viewFullReport);
    
    // Footer links
    document.getElementById('settings-link').addEventListener('click', openSettings);
}

// Check current page and show appropriate state
async function checkCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            showError('No active tab found');
            return;
        }
        
        console.log('SpotGhost: Current tab URL:', tab.url);
        console.log('SpotGhost: Tab URL length:', tab.url.length);
        console.log('SpotGhost: Tab URL includes linkedin.com:', tab.url.toLowerCase().includes('linkedin.com'));
        
        // Update current page info
        updateCurrentPageInfo(tab.url);
        
        // Platform detection and display removed
        // Only update current page info and permissions
        const hasPermission = await checkSitePermissions(tab.url);
        if (!hasPermission) {
            showState('permissions');
            updateStatus('Permission required', 'warning');
            return;
        }
        document.getElementById('analyze-btn').disabled = false;
        document.getElementById('analyze-btn').innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Analyze This Job</span>';
        showState('welcome');
        
    } catch (error) {
        console.error('Error checking current page:', error);
        showError('Failed to check current page');
    }
}

// Update current page info
function updateCurrentPageInfo(url) {
    try {
        const urlObj = new URL(url);
        const displayUrl = `${urlObj.hostname}${urlObj.pathname}`;
        document.getElementById('current-url').textContent = displayUrl.length > 50 ? 
            displayUrl.substring(0, 47) + '...' : displayUrl;
    } catch (error) {
        document.getElementById('current-url').textContent = 'Invalid URL';
    }
}

// Detect platform from URL
function detectPlatform(url) {
    // Force LinkedIn detection for debugging
    if (url.toLowerCase().includes('linkedin.com')) {
        console.log('SpotGhost: FORCED LinkedIn detection');
        return { name: 'LinkedIn' };
    }
    
    const platforms = {
        linkedin: { name: 'LinkedIn', patterns: ['linkedin.com'] },
        indeed: { name: 'Indeed', patterns: ['indeed.com'] },
        glassdoor: { name: 'Glassdoor', patterns: ['glassdoor.com'] },
        monster: { name: 'Monster', patterns: ['monster.com'] },
        ziprecruiter: { name: 'ZipRecruiter', patterns: ['ziprecruiter.com'] },
        google: { name: 'Google Jobs', patterns: ['jobs.google.com'] },
        careerbuilder: { name: 'CareerBuilder', patterns: ['careerbuilder.com'] },
        dice: { name: 'Dice', patterns: ['dice.com'] },
        uplers: { name: 'Uplers', patterns: ['uplers.com'] },
        naukri: { name: 'Naukri', patterns: ['naukri.com'] },
        angellist: { name: 'AngelList', patterns: ['angel.co', 'wellfound.com'] },
        stackoverflow: { name: 'Stack Overflow Jobs', patterns: ['stackoverflow.com/jobs'] }
    };
    
    const urlLower = url.toLowerCase();
    console.log('SpotGhost: Detecting platform for URL:', urlLower);
    console.log('SpotGhost: Full URL object:', url);
    
    // Check for known platforms first
    for (const [key, platform] of Object.entries(platforms)) {
        for (const pattern of platform.patterns) {
            console.log(`SpotGhost: Checking pattern "${pattern}" against URL`);
            if (urlLower.includes(pattern)) {
                console.log(`SpotGhost: ✅ MATCH! Detected platform - ${platform.name} (${key})`);
                return platform;
            }
        }
    }
    
    // If no specific platform detected, check if it's likely a job posting
    const jobIndicators = [
        'job', 'career', 'hiring', 'position', 'vacancy', 'opportunity',
        'apply', 'employment', 'work', 'recruit', 'openings'
    ];
    
    const hasJobIndicators = jobIndicators.some(indicator => urlLower.includes(indicator));
    
    if (hasJobIndicators) {
        console.log('SpotGhost: Detected generic job posting site');
        // Extract domain name for platform name
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            const companyName = domain.split('.')[0];
            return { 
                name: companyName.charAt(0).toUpperCase() + companyName.slice(1) + ' Jobs',
                isGeneric: true 
            };
        } catch (error) {
            return { name: 'Job Site', isGeneric: true };
        }
    }
    
    console.log('SpotGhost: No platform detected');
    return null;
}

// Check site permissions
async function checkSitePermissions(url) {
    try {
        const hostname = new URL(url).hostname;
        const hasPermission = await chrome.permissions.contains({
            origins: [`https://${hostname}/*`]
        });
        return hasPermission;
    } catch (error) {
        console.warn('Permission check failed:', error);
        return false;
    }
}

// Handle permission grant
async function handlePermissionGrant() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const hostname = new URL(tab.url).hostname;
        
        const granted = await chrome.permissions.request({
            origins: [`https://${hostname}/*`]
        });
        
        if (granted) {
            updateStatus('Permission granted', 'ready');
            showState('welcome');
        } else {
            updateStatus('Permission denied', 'error');
        }
    } catch (error) {
        console.error('Permission grant failed:', error);
        showError('Failed to grant permission');
    }
}

// Handle permission deny
function handlePermissionDeny() {
    updateStatus('Permission required for analysis', 'warning');
}

// Start job analysis
async function startAnalysis() {
    try {
        showState('loading');
        updateStatus('Analyzing job...', 'loading');
        updateLoadingStep('extract', 'active');
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        const platform = detectPlatform(tab.url);
        
        if (!platform) {
            throw new Error('Please navigate to a job posting page');
        }
        
        // Check permissions
        const hasPermission = await checkSitePermissions(tab.url);
        if (!hasPermission) {
            showState('permissions');
            return;
        }
        
        // Update loading status
        updateLoadingStatus('Extracting job information...');
        
        // Perform analysis
        const analysis = await performJobAnalysis(tab, platform);
        
        updateLoadingStep('extract', 'completed');
        updateLoadingStep('ai', 'completed');
        updateLoadingStep('verify', 'completed');
        updateLoadingStep('complete', 'completed');
        
        // Show results
        currentAnalysis = analysis;
        displayAnalysisResults(analysis);
        showState('results');
        updateStatus('Analysis complete', 'ready');
        
    } catch (error) {
        console.error('Analysis failed:', error);
        showError(error.message);
        updateStatus('Analysis failed', 'error');
    }
}

// Perform job analysis (reuse from popup.js)
async function performJobAnalysis(tab, platform) {
    // Test content script communication
    let contentScriptReady = false;
    
    try {
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
    } catch (pingError) {
        // Inject content script
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            await new Promise((resolve, reject) => {
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
        } catch (injectionError) {
            throw new Error(`Extension injection failed: ${injectionError.message}`);
        }
    }
    
    if (!contentScriptReady) {
        throw new Error('Extension not ready. Please refresh the page and try again.');
    }
    
    try {
        updateLoadingStep('ai', 'active');
        updateLoadingStatus('Analyzing for scams and red flags...');
        
        // Extract job data
        const jobData = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Data extraction timeout'));
            }, 15000);
            
            chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, (response) => {
                clearTimeout(timeout);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(`Communication error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (response && response.error) {
                    reject(new Error(`Extraction failed: ${response.error}`));
                    return;
                }
                
                if (!response) {
                    reject(new Error('No response from page'));
                    return;
                }
                
                resolve(response);
            });
        });
        
        updateLoadingStep('verify', 'active');
        updateLoadingStatus('Analyzing with AI...');
        
        // Send to background for analysis
        const analysis = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Analysis timeout'));
            }, 30000);
            
            chrome.runtime.sendMessage({
                action: 'analyzeJob',
                data: jobData
            }, (response) => {
                clearTimeout(timeout);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(`Extension error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (!response) {
                    reject(new Error('No analysis response'));
                    return;
                }
                
                if (response.success) {
                    resolve(response.analysis);
                } else {
                    reject(new Error(response.error || 'Analysis failed'));
                }
            });
        });
        
        return analysis;
        
    } catch (error) {
        throw new Error(`Analysis error: ${error.message}`);
    }
}

// Display analysis results
function displayAnalysisResults(analysis) {
    const classicAnalysis = analysis.job?.classicAnalysis || {};
    const aiAnalysis = analysis.job?.aiAnalysis || null;
    const safetyScore = classicAnalysis.safetyScore || 0;
    const riskLevel = classicAnalysis.riskLevel || 'Unknown';
    
    // Update job header
    const jobTitleEl = document.getElementById('job-title');
    if (jobTitleEl) jobTitleEl.textContent = analysis.job?.title || 'Unknown Job';
    const jobCompanyEl = document.getElementById('job-company');
    if (jobCompanyEl) jobCompanyEl.textContent = analysis.job?.company || 'Unknown Company';
    // Location and platform display removed
    
    // Update safety score
    const scoreCircle = document.getElementById('score-circle');
    const scoreAngle = (safetyScore / 100) * 360;
    if (scoreCircle) scoreCircle.style.setProperty('--score-angle', `${scoreAngle}deg`);
    const scoreNumberEl = document.getElementById('score-number');
    if (scoreNumberEl) scoreNumberEl.textContent = safetyScore;
    const riskLevelEl = document.getElementById('risk-level');
    if (riskLevelEl) {
        riskLevelEl.textContent = riskLevel;
        riskLevelEl.className = `risk-level ${riskLevel.toLowerCase().replace(' ', '-')}`;
    }
    
    // Update score description
    let scoreDescription = 'Analysis complete.';
    if (safetyScore >= 80) scoreDescription = 'This job posting appears very safe and legitimate.';
    else if (safetyScore >= 65) scoreDescription = 'This job posting appears mostly safe with minor concerns.';
    else if (safetyScore >= 50) scoreDescription = 'This job posting has some concerning elements.';
    else if (safetyScore >= 35) scoreDescription = 'This job posting has significant red flags.';
    else scoreDescription = 'This job posting appears to be high risk or fraudulent.';
    
    const scoreDescEl = document.getElementById('score-description');
    if (scoreDescEl) scoreDescEl.textContent = scoreDescription;
    
    // Update AI verdict
    const aiVerdictSection = document.getElementById('ai-verdict-section');
    const verdictBadge = document.getElementById('verdict-badge');
    const aiSummary = document.getElementById('ai-summary');
    if (aiAnalysis) {
        if (aiVerdictSection) aiVerdictSection.style.display = 'block';
        if (verdictBadge) {
            verdictBadge.textContent = aiAnalysis.verdict || 'ANALYSIS COMPLETE';
            verdictBadge.className = `verdict-badge ${(aiAnalysis.verdict || 'legitimate').toLowerCase()}`;
        }
        if (aiSummary) aiSummary.textContent = aiAnalysis.summary || 'AI analysis completed successfully.';
    } else {
        if (aiVerdictSection) aiVerdictSection.style.display = 'none';
    }
    
    // Update red flags
    const redFlags = classicAnalysis.redFlags || [];
    const redFlagsList = document.getElementById('red-flags-list');
    const redFlagCountEl = document.getElementById('red-flag-count');
    if (redFlagCountEl) redFlagCountEl.textContent = redFlags.length;
    if (redFlagsList) {
        if (redFlags.length > 0) {
            redFlagsList.innerHTML = redFlags.map(flag => `
                <div class="flag-item red">
                    <div class="flag-icon">⚠️</div>
                    <div>${flag}</div>
                </div>
            `).join('');
        } else {
            redFlagsList.innerHTML = '<div class="flag-item green"><div class="flag-icon">✅</div><div>No red flags detected</div></div>';
        }
    }
    
    // Update green flags
    const greenFlags = classicAnalysis.greenFlags || classicAnalysis.positiveSignals || [];
    const greenFlagsList = document.getElementById('green-flags-list');
    const greenFlagCountEl = document.getElementById('green-flag-count');
    if (greenFlagCountEl) greenFlagCountEl.textContent = greenFlags.length;
    if (greenFlagsList) {
        if (greenFlags.length > 0) {
            greenFlagsList.innerHTML = greenFlags.map(flag => `
                <div class="flag-item green">
                    <div class="flag-icon">✅</div>
                    <div>${flag}</div>
                </div>
            `).join('');
        } else {
            greenFlagsList.innerHTML = '<div class="flag-item"><div class="flag-icon">ℹ️</div><div>No specific positive indicators identified</div></div>';
        }
    }
    
    // Update recommendations
    const recommendations = aiAnalysis?.recommendations || classicAnalysis.recommendations?.actionItems || [];
    const recommendationsList = document.getElementById('recommendations-list');
    if (recommendationsList) {
        if (recommendations.length > 0) {
            recommendationsList.innerHTML = recommendations.map(rec => `
                <div class="recommendation-item">
                    <div class="recommendation-icon">💡</div>
                    <div class="recommendation-text">${rec}</div>
                </div>
            `).join('');
        } else {
            recommendationsList.innerHTML = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">💡</div>
                    <div class="recommendation-text">Continue with normal job application process while staying vigilant.</div>
                </div>
            `;
        }
    }
}

// State management
function showState(state) {
    // Hide all states
    const states = ['welcome', 'results', 'loading', 'error', 'permissions'];
    for (const s of states) {
        const el = document.getElementById(`${s}-state`);
        if (el) el.style.display = 'none';
    }
    // Show requested state
    const showEl = document.getElementById(`${state}-state`);
    if (showEl) showEl.style.display = 'block';
    currentState = state;
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) errorEl.textContent = message;
    showState('error');
}

function updateStatus(text, type = 'ready') {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) return;
    const statusText = statusIndicator.querySelector('.status-text');
    const statusDot = statusIndicator.querySelector('.status-dot');
    if (statusText) statusText.textContent = text;
    // Update dot color based on type
    if (statusDot) statusDot.style.background = {
        ready: '#4CAF50',
        loading: '#FF9800',
        warning: '#FF5722',
        error: '#f44336',
        neutral: '#9E9E9E'
    }[type] || '#4CAF50';
}

function updateLoadingStatus(status) {
    const loadingStatusEl = document.getElementById('loading-status');
    if (loadingStatusEl) loadingStatusEl.textContent = status;
}

function updateLoadingStep(stepId, status) {
    const step = document.getElementById(`step-${stepId}`);
    if (!step) return;
    step.className = `step ${status}`;
    const icon = step.querySelector('.step-icon');
    if (icon) {
        if (status === 'completed') {
            icon.textContent = '✓';
        } else if (status === 'active') {
            icon.textContent = '⏳';
        } else {
            icon.textContent = '⏳';
        }
    }
}

// Action handlers
async function saveCurrentJob() {
    if (!currentAnalysis) return;
    
    try {
        // Save to storage
        const savedJobs = await chrome.storage.local.get(['savedJobs']) || { savedJobs: [] };
        const jobs = savedJobs.savedJobs || [];
        
        const jobToSave = {
            id: Date.now(),
            title: currentAnalysis.job?.title,
            company: currentAnalysis.job?.company,
            location: currentAnalysis.job?.location,
            platform: currentAnalysis.job?.platform,
            safetyScore: currentAnalysis.job?.classicAnalysis?.safetyScore,
            riskLevel: currentAnalysis.job?.classicAnalysis?.riskLevel,
            savedAt: new Date().toISOString(),
            url: currentAnalysis.job?.applicationUrl
        };
        
        jobs.push(jobToSave);
        await chrome.storage.local.set({ savedJobs: jobs });
        
        // Show feedback
        updateStatus('Job saved successfully', 'ready');
        
    } catch (error) {
        console.error('Failed to save job:', error);
        updateStatus('Failed to save job', 'error');
    }
}

function reportScam() {
    if (!currentAnalysis) return;
    
    const reportUrl = `https://spot-ghost-jobs.vercel.app/dashboard/report?` +
        `title=${encodeURIComponent(currentAnalysis.job?.title || '')}&` +
        `company=${encodeURIComponent(currentAnalysis.job?.company || '')}&` +
        `url=${encodeURIComponent(currentAnalysis.job?.applicationUrl || '')}`;
    
    chrome.tabs.create({ url: reportUrl });
}

function viewFullReport() {
    if (!currentAnalysis) return;
    
    const reportUrl = 'https://spot-ghost-jobs.vercel.app/dashboard/my-reports';
    chrome.tabs.create({ url: reportUrl });
}

function openSettings() {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard/profile' });
}

console.log('SpotGhost Side Panel: Script loaded successfully');
