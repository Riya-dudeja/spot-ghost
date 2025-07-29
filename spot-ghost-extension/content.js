// SpotGhost Universal Job Extractor
// Supports LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, and more

// Platform detection and extraction configuration
const PLATFORMS = {
  linkedin: {
    name: 'LinkedIn',
    patterns: ['linkedin.com/jobs'],
    extractors: {
      title: [
        'h1.top-card-layout__title',
        'h1[data-test-id="job-title"]',
        'h1.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title h1',
        'h1'
      ],
      company: [
        '.topcard__org-name-link',
        '.topcard__flavor',
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        '[data-test-id="job-poster-name"]',
        '.job-details-jobs-unified-top-card__primary-description-container .app-aware-link'
      ],
      description: [
        '.description__text',
        '.description',
        '.jobs-description__content',
        '.jobs-box__html-content',
        '.job-details-jobs-unified-top-card__job-description',
        '[data-test-id="job-details-description"]',
        '.jobs-description-content__text'
      ],
      location: [
        '.topcard__flavor--bullet',
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__bullet',
        '.topcard__flavor',
        '.job-details-jobs-unified-top-card__primary-description-container .jobs-unified-top-card__bullet'
      ],
      salary: [
        '.job-details-jobs-unified-top-card__job-insight--highlight',
        '.job-details-jobs-unified-top-card__job-insight',
        '.jobs-unified-top-card__job-insight',
        '.salary'
      ]
    }
  },
  indeed: {
    name: 'Indeed',
    patterns: ['indeed.com'],
    extractors: {
      title: [
        '[data-testid="jobsearch-JobInfoHeader-title"] h1',
        '.jobsearch-JobInfoHeader-title h1',
        'h1[data-testid="job-title"]',
        '.jobsearch-JobInfoHeader-title',
        'h1'
      ],
      company: [
        '[data-testid="inlineHeader-companyName"] a',
        '[data-testid="inlineHeader-companyName"]',
        '.jobsearch-JobInfoHeader-subtitle a',
        '.jobsearch-JobInfoHeader-subtitle',
        '.jobsearch-InlineCompanyRating a'
      ],
      description: [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[data-testid="job-description"]',
        '.jobsearch-JobComponent-description'
      ],
      location: [
        '[data-testid="job-location"]',
        '.jobsearch-JobInfoHeader-subtitle div',
        '.jobsearch-JobMetadataHeader-item'
      ],
      salary: [
        '.jobsearch-JobMetadataHeader-item',
        '[data-testid="job-salary"]',
        '.salary-snippet'
      ]
    }
  },
  glassdoor: {
    name: 'Glassdoor',
    patterns: ['glassdoor.com'],
    extractors: {
      title: [
        '[data-test="job-title"]',
        '.jobHeader h1',
        '.job-title',
        'h1'
      ],
      company: [
        '[data-test="employer-name"]',
        '.jobHeader .employer',
        '.employer-name a',
        '.employer-name'
      ],
      description: [
        '[data-test="job-description-content"]',
        '.jobDescriptionContent',
        '.job-description-content',
        '.jobDesc'
      ],
      location: [
        '[data-test="job-location"]',
        '.jobHeader .location',
        '.job-location'
      ],
      salary: [
        '[data-test="job-salary"]',
        '.salary',
        '.pay-range'
      ]
    }
  },
  monster: {
    name: 'Monster',
    patterns: ['monster.com'],
    extractors: {
      title: [
        '.job-header h1',
        '[data-testid="job-title"]',
        '.job-title h1',
        'h1'
      ],
      company: [
        '.job-header .company',
        '[data-testid="company-name"]',
        '.company-name a',
        '.company-name'
      ],
      description: [
        '.job-description',
        '[data-testid="job-description"]',
        '.job-content'
      ],
      location: [
        '.job-header .location',
        '[data-testid="job-location"]',
        '.job-location'
      ],
      salary: [
        '.salary-info',
        '[data-testid="job-salary"]',
        '.pay-range'
      ]
    }
  },
  ziprecruiter: {
    name: 'ZipRecruiter',
    patterns: ['ziprecruiter.com'],
    extractors: {
      title: [
        '.job_title h1',
        '[data-testid="job-title"]',
        'h1.job-title',
        'h1'
      ],
      company: [
        '.hiring_company a',
        '[data-testid="company-name"]',
        '.company-name',
        '.hiring_company'
      ],
      description: [
        '.job_description',
        '[data-testid="job-description"]',
        '.job-content'
      ],
      location: [
        '.job_location',
        '[data-testid="job-location"]',
        '.location'
      ],
      salary: [
        '.salary',
        '[data-testid="job-salary"]',
        '.compensation'
      ]
    }
  },
  google: {
    name: 'Google Jobs',
    patterns: ['jobs.google.com'],
    extractors: {
      title: [
        '.KLsYvd',
        'h2[data-test-id="job-title"]',
        '.job-title h2',
        'h2'
      ],
      company: [
        '.vNEEBe',
        '[data-test-id="company-name"]',
        '.company-name'
      ],
      description: [
        '.HBvzbc',
        '[data-test-id="job-description"]',
        '.job-description'
      ],
      location: [
        '.pwO9Dc',
        '[data-test-id="job-location"]',
        '.location'
      ],
      salary: [
        '.I2Cbhb',
        '[data-testid="job-salary"]',
        '.salary'
      ]
    }
  }
};

// Current platform detection
let currentPlatform = null;

// Initialize platform detection
function detectPlatform() {
  const url = window.location.href.toLowerCase();
  
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.patterns.some(pattern => url.includes(pattern))) {
      currentPlatform = key;
      console.log(`SpotGhost: Detected platform - ${platform.name}`);
      return platform;
    }
  }
  
  return null;
}

// Universal job data extractor
function extractJobData() {
  const platform = detectPlatform();
  if (!platform) {
    throw new Error('Unsupported platform');
  }
  
  const jobData = {
    title: '',
    company: '',
    description: '',
    location: '',
    salary: '',
    requirements: '',
    qualifications: '',
    benefits: '',
    jobType: '',
    experienceLevel: '',
    companySize: '',
    postedDate: '',
    applicationDeadline: '',
    contactEmail: '',
    applicationUrl: window.location.href,
    sourceURL: window.location.href,
    platform: platform.name,
    extractedAt: new Date().toISOString()
  };
  
  // Extract core fields using platform-specific selectors
  for (const [field, selectors] of Object.entries(platform.extractors)) {
    jobData[field] = extractTextFromSelectors(selectors);
  }
  
  // Extract additional fields with generic selectors
  jobData.requirements = extractRequirements();
  jobData.qualifications = extractQualifications();
  jobData.benefits = extractBenefits();
  jobData.jobType = extractJobType();
  jobData.experienceLevel = extractExperienceLevel();
  jobData.postedDate = extractPostedDate();
  jobData.contactEmail = extractContactEmail();
  
  // Clean and validate data
  return cleanJobData(jobData);
}

// Extract text using multiple selectors (fallback approach)
function extractTextFromSelectors(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return cleanText(element.textContent);
      }
    } catch (error) {
      console.warn(`SpotGhost: Selector failed - ${selector}:`, error);
    }
  }
  return '';
}

// Extract requirements with intelligent parsing
function extractRequirements() {
  const commonSelectors = [
    '.requirements',
    '.job-requirements',
    '[class*="requirement"]',
    '[class*="qualification"]',
    '.qualifications'
  ];
  
  // Look for sections containing "requirements" or "qualifications"
  const allText = document.body.textContent.toLowerCase();
  const sections = document.querySelectorAll('div, section, p, ul, li');
  
  let requirements = '';
  
  for (const section of sections) {
    const text = section.textContent.toLowerCase();
    const parent = section.parentElement?.textContent.toLowerCase() || '';
    
    if ((text.includes('requirement') || text.includes('qualification') || 
         text.includes('must have') || text.includes('experience')) &&
        section.textContent.length > 50 && section.textContent.length < 2000) {
      requirements += cleanText(section.textContent) + '\n';
    }
  }
  
  return requirements.trim();
}

// Extract qualifications
function extractQualifications() {
  const sections = document.querySelectorAll('div, section, p, ul, li');
  let qualifications = '';
  
  for (const section of sections) {
    const text = section.textContent.toLowerCase();
    
    if ((text.includes('preferred') || text.includes('nice to have') || 
         text.includes('plus') || text.includes('bonus')) &&
        section.textContent.length > 30 && section.textContent.length < 1000) {
      qualifications += cleanText(section.textContent) + '\n';
    }
  }
  
  return qualifications.trim();
}

// Extract benefits
function extractBenefits() {
  const sections = document.querySelectorAll('div, section, p, ul, li');
  let benefits = '';
  
  for (const section of sections) {
    const text = section.textContent.toLowerCase();
    
    if ((text.includes('benefit') || text.includes('perk') || 
         text.includes('insurance') || text.includes('vacation') ||
         text.includes('401k') || text.includes('healthcare')) &&
        section.textContent.length > 20 && section.textContent.length < 1000) {
      benefits += cleanText(section.textContent) + '\n';
    }
  }
  
  return benefits.trim();
}

// Extract job type (Full-time, Part-time, Contract, etc.)
function extractJobType() {
  const text = document.body.textContent.toLowerCase();
  const jobTypes = ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'freelance'];
  
  for (const type of jobTypes) {
    if (text.includes(type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  return '';
}

// Extract experience level
function extractExperienceLevel() {
  const text = document.body.textContent.toLowerCase();
  const levels = [
    { pattern: 'entry level', value: 'Entry Level' },
    { pattern: 'junior', value: 'Junior' },
    { pattern: 'mid level', value: 'Mid Level' },
    { pattern: 'senior', value: 'Senior' },
    { pattern: 'lead', value: 'Lead' },
    { pattern: 'principal', value: 'Principal' },
    { pattern: 'director', value: 'Director' },
    { pattern: 'executive', value: 'Executive' }
  ];
  
  for (const level of levels) {
    if (text.includes(level.pattern)) {
      return level.value;
    }
  }
  
  return '';
}

// Extract posted date
function extractPostedDate() {
  const dateSelectors = [
    '[class*="posted"]',
    '[class*="date"]',
    'time',
    '.job-date',
    '.post-date'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.match(/\d+\s+(day|week|month|hour)s?\s+ago|\d{1,2}\/\d{1,2}\/\d{4}/)) {
      return cleanText(element.textContent);
    }
  }
  
  return '';
}

// Extract contact email
function extractContactEmail() {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const pageText = document.body.textContent;
  const emails = pageText.match(emailRegex) || [];
  
  // Filter out common non-contact emails
  const filteredEmails = emails.filter(email => 
    !email.includes('noreply') && 
    !email.includes('no-reply') &&
    !email.includes('support') &&
    !email.includes('help')
  );
  
  return filteredEmails[0] || '';
}

// Clean and normalize text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

// Clean and validate job data
function cleanJobData(jobData) {
  // Remove empty fields and normalize data
  for (const [key, value] of Object.entries(jobData)) {
    if (typeof value === 'string') {
      jobData[key] = cleanText(value);
      
      // Remove if too short to be meaningful
      if (key !== 'sourceURL' && key !== 'applicationUrl' && value.length < 2) {
        jobData[key] = '';
      }
    }
  }
  
  // Validate required fields
  if (!jobData.title || jobData.title.length < 3) {
    throw new Error('Job title not found or too short');
  }
  
  if (!jobData.company || jobData.company.length < 2) {
    throw new Error('Company name not found or too short');
  }
  
  if (!jobData.description || jobData.description.length < 50) {
    throw new Error('Job description not found or too short');
  }
  
  return jobData;
}

// Real-time analysis and UI injection
function initializeRealTimeFeatures() {
  // Add floating analysis button
  addFloatingAnalysisButton();
  
  // Add inline risk indicators
  addInlineRiskIndicators();
  
  // Auto-scan for critical red flags
  setTimeout(performAutoScan, 3000);
}

// Add floating analysis button
function addFloatingAnalysisButton() {
  if (document.getElementById('spotghost-floating-btn')) return;
  
  const button = document.createElement('div');
  button.id = 'spotghost-floating-btn';
  button.innerHTML = `
    <div class="spotghost-btn">
      <div class="spotghost-icon">🛡️</div>
      <div class="spotghost-text">Analyze Job</div>
    </div>
  `;
  
  button.addEventListener('click', () => {
    analyzeCurrentJob();
  });
  
  document.body.appendChild(button);
}

// Add inline risk indicators next to job elements
function addInlineRiskIndicators() {
  const platform = detectPlatform();
  if (!platform) return;
  
  // Add risk indicator next to company name
  const companyElement = document.querySelector(platform.extractors.company[0]);
  if (companyElement) {
    const indicator = document.createElement('span');
    indicator.className = 'spotghost-risk-indicator';
    indicator.innerHTML = '🔍';
    indicator.title = 'Click to check company reputation';
    indicator.addEventListener('click', () => checkCompanyReputation(companyElement.textContent));
    companyElement.appendChild(indicator);
  }
}

// Perform automatic scan for red flags
function performAutoScan() {
  try {
    const jobData = extractJobData();
    const quickScan = performQuickRiskScan(jobData);
    
    if (quickScan.riskLevel === 'High' || quickScan.riskLevel === 'Critical') {
      showQuickWarning(quickScan);
    }
  } catch (error) {
    console.warn('SpotGhost: Auto-scan failed:', error);
  }
}

// Quick risk scan for immediate feedback
function performQuickRiskScan(jobData) {
  const redFlags = [];
  let riskScore = 0;
  
  const fullText = `${jobData.title} ${jobData.company} ${jobData.description}`.toLowerCase();
  
  // Critical scam phrases
  const criticalPhrases = [
    'pay upfront fee', 'processing fee', 'training fee', 'activation fee',
    'wire transfer', 'western union', 'cryptocurrency',
    'work from home $500/day', 'make money fast', 'pyramid scheme'
  ];
  
  criticalPhrases.forEach(phrase => {
    if (fullText.includes(phrase)) {
      redFlags.push(`Contains scam phrase: "${phrase}"`);
      riskScore += 40;
    }
  });
  
  // Unrealistic salary promises
  if (jobData.salary && /\$\d{3,}.*day/.test(jobData.salary)) {
    redFlags.push('Unrealistic daily salary promise');
    riskScore += 30;
  }
  
  // Generic company names
  const genericCompanyWords = ['corp', 'inc', 'llc', 'ltd', 'company', 'enterprise'];
  if (genericCompanyWords.every(word => jobData.company.toLowerCase().includes(word))) {
    redFlags.push('Very generic company name');
    riskScore += 20;
  }
  
  // Missing key information
  if (!jobData.location) {
    redFlags.push('No location specified');
    riskScore += 15;
  }
  
  if (!jobData.requirements && !jobData.qualifications) {
    redFlags.push('No job requirements specified');
    riskScore += 15;
  }
  
  // Determine risk level
  let riskLevel = 'Very Low';
  if (riskScore >= 60) riskLevel = 'Critical';
  else if (riskScore >= 40) riskLevel = 'High';
  else if (riskScore >= 25) riskLevel = 'Medium';
  else if (riskScore >= 15) riskLevel = 'Low';
  
  return {
    riskLevel,
    riskScore,
    redFlags,
    safetyScore: Math.max(0, 100 - riskScore)
  };
}

// Show quick warning for high-risk jobs
function showQuickWarning(scanResult) {
  if (document.getElementById('spotghost-quick-warning')) return;
  
  const warning = document.createElement('div');
  warning.id = 'spotghost-quick-warning';
  warning.className = 'spotghost-warning';
  warning.innerHTML = `
    <div class="spotghost-warning-content">
      <div class="spotghost-warning-header">
        <span class="spotghost-warning-icon">⚠️</span>
        <span class="spotghost-warning-title">Potential Risk Detected</span>
        <button class="spotghost-warning-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="spotghost-warning-body">
        <p>This job posting has been flagged with <strong>${scanResult.riskLevel}</strong> risk level.</p>
        <ul>
          ${scanResult.redFlags.map(flag => `<li>${flag}</li>`).join('')}
        </ul>
        <button class="spotghost-analyze-btn" onclick="analyzeCurrentJob()">
          Get Detailed Analysis
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(warning);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (warning.parentElement) {
      warning.remove();
    }
  }, 10000);
}

// Analyze current job (triggered by user action)
async function analyzeCurrentJob() {
  try {
    const jobData = extractJobData();
    
    // Show loading state
    showAnalysisLoading();
    
    // Send to background script for full analysis
    chrome.runtime.sendMessage({
      action: 'analyzeJob',
      data: jobData
    }, (response) => {
      hideAnalysisLoading();
      
      if (response && response.success) {
        showAnalysisResults(response.analysis);
      } else {
        showAnalysisError(response?.error || 'Analysis failed');
      }
    });
    
  } catch (error) {
    hideAnalysisLoading();
    showAnalysisError(error.message);
  }
}

// Check company reputation
function checkCompanyReputation(companyName) {
  chrome.runtime.sendMessage({
    action: 'checkCompanyReputation',
    company: companyName
  }, (response) => {
    if (response && response.isKnownScam) {
      alert(`⚠️ WARNING: "${companyName}" has been reported as a potential scam company.`);
    } else {
      alert(`✅ No scam reports found for "${companyName}".`);
    }
  });
}

// Show analysis loading state
function showAnalysisLoading() {
  const loading = document.createElement('div');
  loading.id = 'spotghost-loading';
  loading.className = 'spotghost-loading';
  loading.innerHTML = `
    <div class="spotghost-loading-content">
      <div class="spotghost-spinner"></div>
      <p>Analyzing job posting...</p>
    </div>
  `;
  document.body.appendChild(loading);
}

// Hide analysis loading state
function hideAnalysisLoading() {
  const loading = document.getElementById('spotghost-loading');
  if (loading) loading.remove();
}

// Show analysis results
function showAnalysisResults(analysis) {
  console.log('SpotGhost Analysis Results:', analysis);
  
  // For now, show a simple alert - this will be enhanced with a proper modal
  const riskLevel = analysis.job?.classicAnalysis?.riskLevel || 'Unknown';
  const safetyScore = analysis.job?.classicAnalysis?.safetyScore || 0;
  
  alert(`SpotGhost Analysis Complete!\n\nSafety Score: ${safetyScore}/100\nRisk Level: ${riskLevel}\n\nCheck the extension popup for detailed results.`);
}

// Show analysis error
function showAnalysisError(error) {
  alert(`SpotGhost Analysis Error: ${error}`);
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJob') {
    try {
      const jobData = extractJobData();
      sendResponse(jobData);
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
  return true;
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRealTimeFeatures);
} else {
  initializeRealTimeFeatures();
}

// Re-initialize on navigation (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setTimeout(initializeRealTimeFeatures, 2000);
  }
}).observe(document, { subtree: true, childList: true });

console.log('SpotGhost Universal Job Extractor loaded successfully!');
