// SpotGhost Side Panel - Clean Implementation

// State management
let currentState = 'welcome';
let currentAnalysis = null;

// Helper functions
function isValidHttpUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) {
        return false;
    }
}

// Initialize side panel
document.addEventListener('DOMContentLoaded', async () => {
    console.log('SpotGhost Side Panel: Initializing...');
    setupEventListeners();
    await checkCurrentPage();
    console.log('SpotGhost Side Panel: Ready');
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('analyze-btn').addEventListener('click', startAnalysis);
    document.getElementById('analyze-another-btn').addEventListener('click', () => showState('welcome'));
    document.getElementById('retry-btn').addEventListener('click', startAnalysis);
    document.getElementById('grant-permission-btn').addEventListener('click', handlePermissionGrant);
    document.getElementById('deny-permission-btn').addEventListener('click', handlePermissionDeny);
    document.getElementById('save-job-btn').addEventListener('click', saveCurrentJob);
    document.getElementById('report-scam-btn').addEventListener('click', reportScam);
    document.getElementById('view-full-report-btn').addEventListener('click', viewFullReport);
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
        
        updateCurrentPageInfo(tab.url);
        
        const hasPermission = await checkSitePermissions(tab.url);
        if (!hasPermission) {
            showState('permissions');
            updateStatus('Permission required', 'warning');
            return;
        }
        
        document.getElementById('analyze-btn').disabled = false;
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
        const displayUrl = urlObj.hostname + urlObj.pathname;
        const urlEl = document.getElementById('current-url');
        if (urlEl) {
            urlEl.textContent = displayUrl.length > 50 ? displayUrl.substring(0, 47) + '...' : displayUrl;
        }
    } catch (error) {
        const urlEl = document.getElementById('current-url');
        if (urlEl) urlEl.textContent = 'Invalid URL';
    }
}

// Detect platform from URL
function detectPlatform(url) {
    const platforms = {
        linkedin: { name: 'LinkedIn', patterns: ['linkedin.com'] },
        indeed: { name: 'Indeed', patterns: ['indeed.com'] },
        glassdoor: { name: 'Glassdoor', patterns: ['glassdoor.com'] }
    };
    
    const urlLower = url.toLowerCase();
    
    for (const [key, platform] of Object.entries(platforms)) {
        for (const pattern of platform.patterns) {
            if (urlLower.includes(pattern)) {
                return platform;
            }
        }
    }
    
    // Generic job site detection
    const jobIndicators = ['job', 'career', 'hiring', 'position', 'vacancy'];
    const hasJobIndicators = jobIndicators.some(indicator => urlLower.includes(indicator));
    
    if (hasJobIndicators) {
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
    
    return null;
}

// Check site permissions
async function checkSitePermissions(url) {
    try {
        const hostname = new URL(url).hostname;
        return await chrome.permissions.contains({
            origins: [hostname.includes('https:') ? url : 'https://' + hostname + '/*']
        });
    } catch (error) {
        return false;
    }
}

// Handle permission grant
async function handlePermissionGrant() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
            showError('No active tab or URL found');
            return;
        }
        
        const hostname = new URL(tab.url).hostname;
        const granted = await chrome.permissions.request({
            origins: ['https://' + hostname + '/*']
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
        // Clear cached analysis before running new analysis
        if (chrome && chrome.storage && chrome.storage.local) {
            await new Promise(resolve => chrome.storage.local.clear(resolve));
            console.log('SpotGhost: Cleared local cache before analysis');
        }
        
        showState('loading');
        updateStatus('Analyzing job...', 'loading');
        updateLoadingStep('extract', 'active');
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !isValidHttpUrl(tab.url)) {
            showError('No valid tab URL found. Please open a job posting page.');
            updateStatus('Analysis failed', 'error');
            return;
        }
        
        const platform = detectPlatform(tab.url);
        if (!platform) {
            showError('Please navigate to a job posting page');
            updateStatus('Analysis failed', 'error');
            return;
        }
        
        // Check permissions
        const hasPermission = await checkSitePermissions(tab.url);
        if (!hasPermission) {
            showState('permissions');
            return;
        }
        
        updateLoadingStatus('Extracting job information...');
        const analysis = await performJobAnalysis(tab, platform);
        
        updateLoadingStep('extract', 'completed');
        updateLoadingStep('ai', 'completed');
        updateLoadingStep('verify', 'completed');
        updateLoadingStep('complete', 'completed');
        
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

// Perform job analysis
async function performJobAnalysis(tab, platform) {
    console.log('SpotGhost: Starting job analysis for platform:', platform.name);
    
    if (!chrome.scripting) {
        throw new Error('Chrome scripting API not available. Please update your Chrome browser.');
    }
    
    return new Promise(async (resolve, reject) => {
        // First try to send message directly
        chrome.tabs.sendMessage(
            tab.id,
            { action: 'extractAndAnalyzeJob', platform: platform.name },
            async (response) => {
                if (chrome.runtime.lastError) {
                    // Content script not loaded, inject it first
                    try {
                        console.log('SpotGhost: Content script not found, injecting scripts...');
                        
                        // Check if tab is valid for script injection
                        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://')) {
                            reject(new Error('Cannot inject scripts into this page type. Please navigate to a regular website.'));
                            return;
                        }
                        
                        // Inject ML model first, then content script
                        console.log('SpotGhost: Injecting ML model...');
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['ml-model.js']
                        });
                        
                        console.log('SpotGhost: Injecting content script...');
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        });
                        
                        console.log('SpotGhost: Scripts injected successfully, waiting for initialization...');
                        
                        // Wait for initialization
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Retry sending the message
                        console.log('SpotGhost: Retrying message after injection...');
                        chrome.tabs.sendMessage(
                            tab.id,
                            { action: 'extractAndAnalyzeJob', platform: platform.name },
                            (retryResponse) => {
                                if (chrome.runtime.lastError) {
                                    console.error('SpotGhost: Retry failed:', chrome.runtime.lastError);
                                    reject(new Error('Failed to communicate with content script after injection: ' + chrome.runtime.lastError.message));
                                } else if (!retryResponse || !retryResponse.success) {
                                    console.error('SpotGhost: Retry response failed:', retryResponse);
                                    reject(new Error(retryResponse?.error || 'Job extraction/analysis failed after injection.'));
                                } else {
                                    console.log('SpotGhost: Analysis successful after injection');
                                    console.log('[SpotGhost DEBUG] Local analysis received, now getting AI analysis from backend...');
                                    
                                    // We have local analysis, now get AI analysis from backend
                                    if (retryResponse.analysis && retryResponse.analysis.job) {
                                        const jobData = retryResponse.analysis.job;
                                        
                                        // Send to background script for AI analysis
                                        chrome.runtime.sendMessage({
                                            action: 'analyzeJob',
                                            data: jobData
                                        }, (aiResponse) => {
                                            if (aiResponse && aiResponse.success) {
                                                console.log('[SpotGhost DEBUG] AI analysis received from backend');
                                                // Merge local analysis with AI analysis
                                                const mergedAnalysis = {
                                                    ...retryResponse.analysis,
                                                    job: {
                                                        ...retryResponse.analysis.job,
                                                        aiAnalysis: aiResponse.analysis.job?.aiAnalysis || null
                                                    }
                                                };
                                                resolve(mergedAnalysis);
                                            } else {
                                                console.warn('[SpotGhost DEBUG] AI analysis failed, using local analysis only');
                                                resolve(retryResponse.analysis);
                                            }
                                        });
                                    } else {
                                        resolve(retryResponse.analysis);
                                    }
                                }
                            }
                        );
                    } catch (injectErr) {
                        console.error('SpotGhost: Script injection failed:', injectErr);
                        if (injectErr.message && injectErr.message.includes('Cannot access')) {
                            reject(new Error('Cannot access this page. Please reload the page and try again, or check if the site allows extensions.'));
                        } else {
                            reject(new Error('Script injection failed: ' + injectErr.message));
                        }
                    }
                } else if (!response || !response.success) {
                    console.error('SpotGhost: Direct message failed:', response);
                    reject(new Error(response?.error || 'Job extraction/analysis failed.'));
                } else {
                    console.log('SpotGhost: Analysis successful via direct message');
                    console.log('[SpotGhost DEBUG] Local analysis received, now getting AI analysis from backend...');
                    
                    // We have local analysis, now get AI analysis from backend
                    if (response.analysis && response.analysis.job) {
                        const jobData = response.analysis.job;
                        
                        // Send to background script for AI analysis
                        chrome.runtime.sendMessage({
                            action: 'analyzeJob',
                            data: jobData
                        }, (aiResponse) => {
                            if (aiResponse && aiResponse.success) {
                                console.log('[SpotGhost DEBUG] AI analysis received from backend');
                                // Merge local analysis with AI analysis
                                const mergedAnalysis = {
                                    ...response.analysis,
                                    job: {
                                        ...response.analysis.job,
                                        aiAnalysis: aiResponse.analysis.job?.aiAnalysis || null
                                    }
                                };
                                resolve(mergedAnalysis);
                            } else {
                                console.warn('[SpotGhost DEBUG] AI analysis failed, using local analysis only');
                                resolve(response.analysis);
                            }
                        });
                    } else {
                        resolve(response.analysis);
                    }
                }
            }
        );
    });
}

// Display analysis results
function displayAnalysisResults(analysis) {
    console.log('[SpotGhost DEBUG] === DISPLAYING ANALYSIS RESULTS ===');
    console.log('[SpotGhost DEBUG] Raw analysis parameter:', analysis);
    if (analysis && analysis.job) {
        console.log('[SpotGhost DEBUG] Analysis.job exists:', analysis.job);
        console.log('[SpotGhost DEBUG] Analysis.job keys:', Object.keys(analysis.job));
        console.log('[SpotGhost DEBUG] Analysis.job.aiAnalysis value:', analysis.job.aiAnalysis);
        console.log('[SpotGhost DEBUG] Analysis.job.aiAnalysis type:', typeof analysis.job.aiAnalysis);
    } else {
        console.log('[SpotGhost DEBUG] No analysis.job found');
        if (analysis) {
            console.log('[SpotGhost DEBUG] Analysis keys:', Object.keys(analysis));
        }
    }
    console.log('[SpotGhost DEBUG] === END ANALYSIS DEBUG ===');
    
    console.log('[SpotGhost DEBUG] Displaying analysis results:', analysis);
    console.log('[SpotGhost DEBUG] ML Analysis present:', !!analysis.job?.mlAnalysis);
    console.log('[SpotGhost DEBUG] Classic Analysis present:', !!analysis.job?.classicAnalysis);
    
    const classicAnalysis = analysis.job?.classicAnalysis || {};
    const aiAnalysis = analysis.job?.aiAnalysis || null;
    const mlAnalysis = analysis.job?.mlAnalysis || null;
    
    // Log ML analysis details
    if (mlAnalysis) {
        console.log('[SpotGhost DEBUG] ML Analysis details:', {
            scamProbability: mlAnalysis.scamProbability,
            confidence: mlAnalysis.confidence,
            features: mlAnalysis.features
        });
    } else {
        console.log('[SpotGhost DEBUG] No ML analysis found');
    }
    
    // Update job header
    const jobTitleEl = document.getElementById('job-title');
    const jobCompanyEl = document.getElementById('job-company');
    
    if (jobTitleEl) jobTitleEl.textContent = analysis.job?.title || 'Job Title Not Found';
    if (jobCompanyEl) jobCompanyEl.textContent = analysis.job?.company || 'Company Not Found';
    
    // Calculate combined safety score and risk assessment
    let safetyScore = 50; // Default neutral score
    let riskLevel = 'Medium Risk';
    let analysisMethod = 'Rule-based Analysis';
    let confidence = 0;
    let recommendation = 'Proceed with caution and verify company details.';
    
    // Prioritize ML analysis if available AND has good confidence
    if (mlAnalysis && mlAnalysis.confidence > 0.7) {
        console.log('[SpotGhost DEBUG] Using ML analysis results');
        
        // Convert ML scam probability to safety score (inverse relationship)
        safetyScore = Math.round((1 - mlAnalysis.scamProbability) * 100);
        confidence = mlAnalysis.confidence;
        analysisMethod = `AI Machine Learning (${Math.round(confidence * 100)}% confidence)`;
        
        // Determine risk level based on ML prediction
        if (mlAnalysis.scamProbability < 0.15) {
            riskLevel = 'Very Low Risk';
            recommendation = 'This appears to be a legitimate job posting. Proceed with confidence.';
        } else if (mlAnalysis.scamProbability < 0.35) {
            riskLevel = 'Low Risk';
            recommendation = 'Generally appears legitimate. Apply normal due diligence.';
        } else if (mlAnalysis.scamProbability < 0.65) {
            riskLevel = 'Medium Risk';
            recommendation = 'Exercise caution. Verify company details and avoid sharing personal information.';
        } else if (mlAnalysis.scamProbability < 0.85) {
            riskLevel = 'High Risk';
            recommendation = 'Multiple red flags detected. Research thoroughly before proceeding.';
        } else {
            riskLevel = 'Very High Risk';
            recommendation = 'Strong indicators of a scam. We recommend avoiding this opportunity.';
        }
    } else if (classicAnalysis.safetyScore !== undefined) {
        console.log('[SpotGhost DEBUG] Using classic analysis results');
        
        safetyScore = classicAnalysis.safetyScore;
        riskLevel = classicAnalysis.riskLevel || 'Medium Risk';
        analysisMethod = 'Rule-based Analysis';
        
        // Generate recommendations based on classic analysis
        if (safetyScore >= 80) {
            recommendation = 'This appears to be a legitimate job posting. Proceed with confidence.';
        } else if (safetyScore >= 60) {
            recommendation = 'Generally appears legitimate. Apply normal due diligence.';
        } else if (safetyScore >= 40) {
            recommendation = 'Exercise caution. Verify company details and avoid sharing personal information.';
        } else {
            recommendation = 'Multiple red flags detected. We recommend avoiding this opportunity.';
        }
    }
    
    console.log('[SpotGhost DEBUG] Final analysis results:', {
        safetyScore,
        riskLevel,
        analysisMethod,
        confidence
    });
    
    // Update safety score display
    updateSafetyScoreDisplay(safetyScore, riskLevel);
    
    // Update AI Analysis section
    updateAIAnalysisSection(mlAnalysis, aiAnalysis, analysisMethod, confidence, analysis);
    
    // Update red flags section
    const redFlags = classicAnalysis.warnings || classicAnalysis.redFlags || [];
    updateRedFlagsSection(redFlags);
    
    // Update positive indicators section
    const positiveIndicators = classicAnalysis.greenFlags || classicAnalysis.positiveIndicators || analysis.job?.positiveSignals || [];
    updatePositiveIndicatorsSection(positiveIndicators);
    
    // Update recommendations section
    updateRecommendationsSection(recommendation, riskLevel, mlAnalysis);
    
    console.log('[SpotGhost DEBUG] Analysis display complete');
}

function updateSafetyScoreDisplay(safetyScore, riskLevel) {
    const scoreNumberEl = document.getElementById('score-number');
    const scoreLevelEl = document.getElementById('risk-level');
    const scoreDescEl = document.getElementById('score-description');
    const scoreCircleEl = document.getElementById('score-circle');
    
    if (scoreNumberEl) scoreNumberEl.textContent = safetyScore;
    if (scoreLevelEl) {
        scoreLevelEl.textContent = riskLevel;
        scoreLevelEl.className = `risk-level ${riskLevel.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    if (scoreDescEl) {
        let description = '';
        if (safetyScore >= 80) {
            description = 'This job posting appears very safe and legitimate.';
        } else if (safetyScore >= 60) {
            description = 'This job posting appears mostly legitimate with minor concerns.';
        } else if (safetyScore >= 40) {
            description = 'This job posting has some concerning elements that require attention.';
        } else {
            description = 'This job posting shows significant red flags and may be fraudulent.';
        }
        scoreDescEl.textContent = description;
    }
    
    if (scoreCircleEl) {
        const percentage = safetyScore / 100;
        scoreCircleEl.style.setProperty('--score-percentage', percentage);
        scoreCircleEl.className = `score-circle ${riskLevel.toLowerCase().replace(/\s+/g, '-')}`;
    }
}

function updateAIAnalysisSection(mlAnalysis, aiAnalysis, analysisMethod, confidence, analysis = null) {
    const aiSection = document.getElementById('ai-verdict-section');
    const verdictBadge = document.getElementById('verdict-badge');
    const aiSummary = document.getElementById('ai-summary');
    
    console.log('[SpotGhost DEBUG] Updating AI section:', { mlAnalysis, aiAnalysis, analysisMethod, confidence });
    
    if (!aiSection) {
        console.log('[SpotGhost DEBUG] AI section element not found');
        return;
    }
    
    // Always show the AI section
    aiSection.style.display = 'block';
    
    // Only show ML results if confidence is high enough
    if (mlAnalysis && mlAnalysis.confidence > 0.7) {
        console.log('[SpotGhost DEBUG] Displaying high-confidence ML analysis results');
        const isLegitimate = mlAnalysis.scamProbability < 0.5;
        const confidencePercent = Math.round(mlAnalysis.confidence * 100);
        
        if (verdictBadge) {
            verdictBadge.textContent = isLegitimate ? 'LEGITIMATE' : 'SUSPICIOUS';
            verdictBadge.className = `verdict-badge ${isLegitimate ? 'legitimate' : 'warning'}`;
        }
        
        if (aiSummary) {
            const scamProbPercent = Math.round(mlAnalysis.scamProbability * 100);
            aiSummary.textContent = `AI analysis with ${confidencePercent}% confidence detected ${scamProbPercent}% risk indicators from ${mlAnalysis.features ? Object.keys(mlAnalysis.features).length : 0} features.`;
        }
    } else if (aiAnalysis) {
        console.log('[SpotGhost DEBUG] Displaying backend AI analysis');
        if (verdictBadge) {
            verdictBadge.textContent = aiAnalysis.verdict || 'LEGITIMATE';
            verdictBadge.className = `verdict-badge legitimate`;
        }
        
        if (aiSummary) {
            aiSummary.textContent = aiAnalysis.summary || 'AI analysis indicates this appears to be a standard, legitimate job posting with proper company information and clear requirements.';
        }
    } else {
        console.log('[SpotGhost DEBUG] Showing AI or rule-based analysis results');
        console.log('[SpotGhost DEBUG] AI Analysis object:', aiAnalysis);
        console.log('[SpotGhost DEBUG] AI Analysis summary:', aiAnalysis?.summary);
        console.log('[SpotGhost DEBUG] AI Analysis verdict:', aiAnalysis?.verdict);
        
        // Check if we have actual AI analysis from backend
        if (aiAnalysis && aiAnalysis.summary) {
            console.log('[SpotGhost DEBUG] Using backend AI analysis');
            if (verdictBadge) {
                verdictBadge.textContent = aiAnalysis.verdict || 'LEGITIMATE';
                verdictBadge.className = `verdict-badge ${(aiAnalysis.verdict || 'legitimate').toLowerCase()}`;
            }
            
            if (aiSummary) {
                aiSummary.textContent = aiAnalysis.summary;
            }
        } else {
            console.log('[SpotGhost DEBUG] Using rule-based analysis fallback - no AI summary found');
            if (verdictBadge) {
                verdictBadge.textContent = 'LEGITIMATE';
                verdictBadge.className = 'verdict-badge legitimate';
            }
            
            if (aiSummary) {
                // Generate professional summary based on actual analysis results
                const hasFlags = (analysis?.job?.classicAnalysis?.warnings?.length || 0) > 0;
                const positiveCount = (analysis?.job?.positiveSignals?.length || analysis?.job?.classicAnalysis?.greenFlags?.length || 0);
                
                let summaryText = '';
                if (hasFlags) {
                    summaryText = 'This job posting has some risk factors that require attention. Please review the red flags below and proceed with caution.';
                } else if (positiveCount > 0) {
                    summaryText = `This appears to be a legitimate job posting with ${positiveCount} positive indicator${positiveCount > 1 ? 's' : ''} detected. The job shows standard professional characteristics.`;
                } else {
                    summaryText = 'This job posting appears to be standard with no significant red flags detected. Basic legitimacy indicators are present.';
                }
                
                aiSummary.textContent = summaryText;
            }
        }
    }
}

function updateRedFlagsSection(redFlags) {
    const redFlagCountEl = document.getElementById('red-flag-count');
    const redFlagsList = document.getElementById('red-flags-list');
    
    console.log('[SpotGhost DEBUG] Updating red flags section with:', redFlags);
    
    if (redFlagCountEl) redFlagCountEl.textContent = redFlags.length;
    
    if (redFlagsList) {
        if (redFlags.length === 0) {
            redFlagsList.innerHTML = `
                <div class="no-flags-message">
                    <span class="flag-icon">✅</span>
                    <span class="flag-text">No significant red flags detected</span>
                </div>
            `;
        } else {
            redFlagsList.innerHTML = redFlags.map(flag => `
                <div class="flag-item red-flag">
                    <span class="flag-icon">⚠️</span>
                    <span class="flag-text">${flag}</span>
                </div>
            `).join('');
        }
    }
}

function updatePositiveIndicatorsSection(positiveIndicators) {
    const greenFlagCountEl = document.getElementById('green-flag-count');
    const greenFlagsList = document.getElementById('green-flags-list');
    
    console.log('[SpotGhost DEBUG] Updating positive indicators section with:', positiveIndicators);
    console.log('[SpotGhost DEBUG] Positive indicators details:', positiveIndicators);
    
    if (greenFlagCountEl) greenFlagCountEl.textContent = positiveIndicators.length;
    
    if (greenFlagsList) {
        if (positiveIndicators.length === 0) {
            greenFlagsList.innerHTML = `
                <div class="no-flags-message">
                    <span class="flag-icon">ℹ️</span>
                    <span class="flag-text">Standard job posting - no standout positive indicators</span>
                </div>
            `;
        } else {
            console.log('[SpotGhost DEBUG] Displaying', positiveIndicators.length, 'positive indicators');
            greenFlagsList.innerHTML = positiveIndicators.map((indicator, index) => {
                console.log(`[SpotGhost DEBUG] Positive indicator ${index + 1}:`, indicator);
                return `
                    <div class="flag-item green-flag">
                        <span class="flag-icon">✅</span>
                        <span class="flag-text">${indicator}</span>
                    </div>
                `;
            }).join('');
        }
    }
}

function updateRecommendationsSection(recommendation, riskLevel, mlAnalysis) {
    const recommendationsList = document.getElementById('recommendations-list');
    
    if (recommendationsList) {
        let recommendations = [recommendation];
        
        if (riskLevel.includes('High')) {
            recommendations.push('Research the company thoroughly using official channels');
            recommendations.push('Never provide personal information or pay any fees upfront');
            recommendations.push('Be suspicious of urgent hiring or immediate start dates');
        } else if (riskLevel.includes('Medium')) {
            recommendations.push('Verify the company exists and has a legitimate website');
            recommendations.push('Look up the company on professional networks like LinkedIn');
            recommendations.push('Be cautious about requests for personal information');
        } else {
            recommendations.push('Follow standard job application best practices');
            recommendations.push('Research the company and role as you normally would');
        }
        
        if (mlAnalysis && mlAnalysis.confidence > 0.7) {
            recommendations.push(`AI confidence level is high (${Math.round(mlAnalysis.confidence * 100)}%) - this analysis is reliable`);
        }
        
        recommendationsList.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <span class="rec-icon">💡</span>
                <span class="rec-text">${rec}</span>
            </div>
        `).join('');
    }
}

// State management
function showState(state) {
    const states = ['welcome', 'results', 'loading', 'error', 'permissions'];
    states.forEach(s => {
        const el = document.getElementById(s + '-state');
        if (el) el.style.display = s === state ? 'block' : 'none';
    });
    currentState = state;
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) errorEl.textContent = message;
    showState('error');
}

function updateStatus(text, type = 'ready') {
    const statusEl = document.getElementById('status-indicator');
    if (statusEl) {
        const textEl = statusEl.querySelector('.status-text');
        if (textEl) textEl.textContent = text;
        
        const dotEl = statusEl.querySelector('.status-dot');
        if (dotEl) {
            dotEl.style.background = {
                ready: '#4CAF50',
                loading: '#FF9800',
                warning: '#FF5722',
                error: '#f44336',
                neutral: '#9E9E9E'
            }[type] || '#4CAF50';
        }
    }
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

// Action handlers - Stub implementations
async function saveCurrentJob() {
    updateStatus('Job saved', 'ready');
}

function reportScam() {
    if (currentAnalysis) {
        chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard/report' });
    }
}

function viewFullReport() {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard/my-reports' });
}

function openSettings() {
    chrome.tabs.create({ url: 'https://spot-ghost-jobs.vercel.app/dashboard/profile' });
}

console.log('SpotGhost Side Panel: Script loaded successfully');