// Platform detection and extraction configuration
const PLATFORMS = {
  linkedin: {
  name: 'LinkedIn',
  patterns: ['linkedin.com'],
  extractors: {
    title: [
      'h1.top-card-layout__title',
      'h1[data-test-id="job-title"]', 
      'h1.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title a',
      'h1'
    ],
    company: [
      '.topcard__org-name-link',
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a', 
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '[data-test-id="job-poster-name"]'
    ],
    description: [
      '.jobs-description-content__text',
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.description__text',
      '.description',
      '[data-test-id="job-details-description"]'
    ],
    location: [
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__bullet', 
      '.topcard__flavor--bullet',
      '.jobs-unified-top-card__primary-description-container .jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container .jobs-unified-top-card__bullet'
    ],
    salary: [
      '.jobs-unified-top-card__job-insight--highlight',
      '.job-details-jobs-unified-top-card__job-insight--highlight',
      '.jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__job-insight'
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
  },
  uplers: {
    name: 'Uplers',
    patterns: ['uplers.com'],
    extractors: {
      title: [
        'h1',
        '.job-title',
        '[class*="title"]',
        '.position-title'
      ],
      company: [
        '.company-name',
        '[class*="company"]',
        '.employer-name'
      ],
      description: [
        '.job-description',
        '[class*="description"]',
        '.job-details',
        'main',
        '.content'
      ],
      location: [
        '.job-location',
        '[class*="location"]',
        '.address'
      ],
      salary: [
        '.salary',
        '[class*="salary"]',
        '.compensation'
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

// Generic job data extractor for non-platform sites
function extractJobDataGeneric() {
  console.log('SpotGhost: Using generic extraction for non-platform site');
  
  const actualJobUrl = getActualJobUrl();
  
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
    applicationUrl: actualJobUrl,
    sourceURL: actualJobUrl,
    platform: 'Generic Website',
    extractedAt: new Date().toISOString()
  };
  
  // Generic selectors that work on most websites
  const genericSelectors = {
    title: [
      'h1', 
      'h2',
      '[class*="title"]',
      '[class*="job-title"]',
      '[class*="position"]',
      '.title',
      '.job-title',
      '.position-title'
    ],
    company: [
      '[class*="company"]',
      '[class*="employer"]',
      '[class*="organization"]',
      '.company',
      '.company-name',
      '.employer',
      '.organization'
    ],
    description: [
      '[class*="description"]',
      '[class*="content"]',
      '[class*="details"]',
      '.description',
      '.job-description',
      '.content',
      '.details',
      'main',
      'article',
      '.main-content'
    ],
    location: [
      '[class*="location"]',
      '[class*="address"]',
      '[class*="city"]',
      '.location',
      '.address',
      '.city'
    ]
  };
  
  // Extract using generic selectors
  for (const [field, selectors] of Object.entries(genericSelectors)) {
    const extractedValue = extractTextFromSelectors(selectors);
    jobData[field] = extractedValue;
    console.log(`SpotGhost Generic: Extracted ${field}:`, extractedValue ? extractedValue.substring(0, 100) + '...' : 'EMPTY');
  }
  // Do NOT use fallback location extraction to avoid picking up irrelevant page locations
  if (!jobData.location || jobData.location.length < 3) {
    console.log('SpotGhost Generic: Location extraction failed, leaving as empty.');
    jobData.location = '';
  } else {
    console.log('SpotGhost Generic: Primary location extraction successful:', jobData.location);
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

// Universal job data extractor
function extractJobData() {
  const platform = detectPlatform();
  
  // If no specific platform detected, use generic extraction
  if (!platform) {
    console.log('SpotGhost: No specific platform detected, using generic extraction...');
    return extractJobDataGeneric();
  }
  
  // Get the actual job URL (important for LinkedIn)
  const actualJobUrl = getActualJobUrl();
  
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
    applicationUrl: actualJobUrl,
    sourceURL: actualJobUrl,
    platform: platform.name,
    extractedAt: new Date().toISOString()
  };
  
  // Extract core fields using platform-specific selectors
  for (const [field, selectors] of Object.entries(platform.extractors)) {
    const extractedValue = extractTextFromSelectors(selectors);
    jobData[field] = extractedValue;
    console.log(`SpotGhost: Extracted ${field}:`, extractedValue ? extractedValue.substring(0, 100) + '...' : 'EMPTY');
  }
  // Do NOT use fallback location extraction to avoid picking up irrelevant page locations
  if (!jobData.location || jobData.location.length < 3) {
    console.log('SpotGhost: Location extraction failed, leaving as empty.');
    jobData.location = '';
  } else {
    console.log('SpotGhost: Primary location extraction successful:', jobData.location);
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

// Get the actual job URL, handling LinkedIn's complex URL structure
function getActualJobUrl() {
  const currentUrl = window.location.href;
  
  console.log('SpotGhost: Original URL:', currentUrl);
  
  // Handle LinkedIn job URLs
  if (currentUrl.includes('linkedin.com')) {
    // Check for currentJobId parameter
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('currentJobId');
    
    console.log('SpotGhost: LinkedIn currentJobId from URL params:', jobId);
    
    if (jobId) {
      const cleanJobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;
      console.log('SpotGhost: Constructed clean LinkedIn URL:', cleanJobUrl);
      return cleanJobUrl;
    }
    
    // Check if we're already on a direct job view URL
    const jobViewMatch = currentUrl.match(/linkedin\.com\/jobs\/view\/(\d+)/);
    if (jobViewMatch) {
      const cleanUrl = currentUrl.split('?')[0]; // Remove query parameters
      console.log('SpotGhost: Direct job view URL cleaned:', cleanUrl);
      return cleanUrl;
    }
    
    // Try to find job ID in URL path
    const pathJobMatch = currentUrl.match(/\/(\d{8,})/);
    if (pathJobMatch) {
      const constructedUrl = `https://www.linkedin.com/jobs/view/${pathJobMatch[1]}`;
      console.log('SpotGhost: Constructed URL from path job ID:', constructedUrl);
      return constructedUrl;
    }
    
    console.log('SpotGhost: No LinkedIn job ID found, using original URL');
  }
  
  // For other platforms or if no specific handling needed
  const cleanUrl = currentUrl.split('?')[0]; // Remove query parameters for cleaner URLs
  console.log('SpotGhost: Final clean URL:', cleanUrl);
  return cleanUrl;
}

// Enhanced location extraction with multiple fallback strategies
function extractLocationWithFallbacks() {
  console.log('SpotGhost: Attempting enhanced location extraction...');
  
  // Generic location selectors that work across multiple platforms
  const genericLocationSelectors = [
    '[class*="location"]',
    '[data-testid*="location"]', 
    '[data-test*="location"]',
    '[aria-label*="location"]',
    '[class*="job-location"]',
    '[class*="jobLocation"]',
    '[id*="location"]',
    '.location',
    '.job-location',
    '.address',
    '[class*="address"]',
    '[class*="city"]',
    '[class*="state"]',
    '[class*="country"]'
  ];
  
  // Try generic selectors first
  for (const selector of genericLocationSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element && element.textContent) {
          const text = cleanText(element.textContent);
          if (text.length > 3 && text.length < 100 && 
              !text.toLowerCase().includes('sign in') && 
              !text.toLowerCase().includes('follow') &&
              !text.toLowerCase().includes('apply') &&
              (text.includes(',') || text.match(/\b(city|state|country|remote|hybrid)\b/i))) {
            console.log(`SpotGhost: Found location via selector "${selector}":`, text);
            return text;
          }
        }
      }
    } catch (error) {
      console.warn(`SpotGhost: Selector failed - ${selector}:`, error);
    }
  }
  
  // Try searching for location patterns in text content
  const pageText = document.body.textContent;
  
  // Look for location patterns: "City, State", "City, Country", etc.
  const locationPatterns = [
    /([A-Z][a-zA-Z\s]{2,30}),\s*([A-Z][a-zA-Z\s]{2,30})/g, // City, State/Country
    /([A-Z][a-zA-Z\s]{2,20})\s*[-–]\s*([A-Z][a-zA-Z\s]{2,20})/g, // City - State
    /(Remote|Hybrid|Work from home)/gi, // Remote work indicators
    /([A-Z][a-zA-Z\s]{3,30}),\s*([A-Z]{2})\b/g, // City, State (2-letter state code)
    /\b([A-Z][a-zA-Z\s]{3,20}),\s*([A-Z][a-zA-Z\s]{3,20}),\s*([A-Z][a-zA-Z\s]{3,20})\b/g // City, State, Country
  ];
  
  for (const pattern of locationPatterns) {
    const matches = [...pageText.matchAll(pattern)];
    for (const match of matches) {
      const potentialLocation = match[0].trim();
      if (potentialLocation.length > 5 && potentialLocation.length < 80) {
        console.log(`SpotGhost: Found location via pattern matching:`, potentialLocation);
        return potentialLocation;
      }
    }
  }
  
  // Try looking for location information in structured data (JSON-LD, microdata)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data.jobLocation || data.address || (data.location && data.location.address)) {
        const location = data.jobLocation?.address?.addressLocality || 
                         data.jobLocation?.address?.addressRegion ||
                         data.address?.addressLocality ||
                         data.address?.addressRegion ||
                         data.location?.address?.addressLocality ||
                         data.location?.name;
        if (location && typeof location === 'string' && location.length > 2) {
          console.log('SpotGhost: Found location in structured data:', location);
          return location;
        }
      }
    } catch (error) {
      // Invalid JSON, skip
    }
  }
  
  console.log('SpotGhost: Enhanced location extraction failed, no location found');
  return 'Unknown Location';
}

// Extract text using multiple selectors (fallback approach)
function extractTextFromSelectors(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Wait for element to be fully loaded for LinkedIn's dynamic content
        if (window.location.href.includes('linkedin.com')) {
          // For LinkedIn, sometimes content loads asynchronously
          let attempts = 0;
          while (attempts < 3 && element.textContent.trim().length < 10) {
            setTimeout(() => {}, 100); // Small delay
            attempts++;
          }
        }
        let text = cleanText(element.textContent);
        // Strictly filter out generic country names for location field
        if (selector.toLowerCase().includes('location') || selector.toLowerCase().includes('bullet')) {
          const genericCountries = [
            'united states', 'usa', 'us', 'india', 'canada', 'united kingdom', 'uk', 'remote', 'worldwide', 'global'
          ];
          const textLower = text.toLowerCase().trim();
          // If the text is only a generic country name (with or without whitespace), ignore it completely
          if (genericCountries.includes(textLower)) {
            // Set location to empty and skip
            return '';
          }
        }
        return text;
      }
    } catch (error) {
      console.warn(`SpotGhost: Selector failed - ${selector}:`, error);
    }
  }
  return '';
}

// Extract requirements with intelligent parsing
function extractRequirements() {
  // First try to find dedicated requirements sections
  const requirementSections = document.querySelectorAll('[class*="requirement"], [class*="qualification"]');
  if (requirementSections.length > 0) {
    let requirements = '';
    requirementSections.forEach(section => {
      if (section.textContent.length > 20 && section.textContent.length < 1000) {
        requirements += cleanText(section.textContent) + '\n';
      }
    });
    if (requirements.trim()) return requirements.trim();
  }

  // Look for text patterns in the job description
  const descriptionElement = document.querySelector('.jobs-description-content__text, .jobs-description__content, .description__text');
  if (!descriptionElement) return '';

  const fullText = descriptionElement.textContent;
  const sections = fullText.split(/(?:\n\s*){2,}|\. [A-Z]|Requirements:|Qualifications:|Responsibilities:/i);
  
  let requirements = '';
  
  for (const section of sections) {
    const lowerSection = section.toLowerCase();
    // Look for sections that contain requirement keywords
    if ((lowerSection.includes('requirement') || 
         lowerSection.includes('must have') || 
         lowerSection.includes('experience') ||
         lowerSection.includes('skill') ||
         lowerSection.includes('proficiency')) &&
        section.length > 50 && section.length < 800) {
      requirements += cleanText(section) + '\n';
      break; // Take first matching section to avoid duplicates
    }
  }
  
  return requirements.trim();
}

// Extract qualifications  
function extractQualifications() {
  const descriptionElement = document.querySelector('.jobs-description-content__text, .jobs-description__content, .description__text');
  if (!descriptionElement) return '';

  const fullText = descriptionElement.textContent;
  const sections = fullText.split(/(?:\n\s*){2,}|\. [A-Z]|Preferred:|Nice to have:|Bonus:/i);
  
  let qualifications = '';
  
  for (const section of sections) {
    const lowerSection = section.toLowerCase();
    if ((lowerSection.includes('preferred') || 
         lowerSection.includes('nice to have') || 
         lowerSection.includes('bonus') ||
         lowerSection.includes('plus')) &&
        section.length > 30 && section.length < 600) {
      qualifications += cleanText(section) + '\n';
      break; // Take first matching section
    }
  }
  
  return qualifications.trim();
}

// Extract benefits
function extractBenefits() {
  const descriptionElement = document.querySelector('.jobs-description-content__text, .jobs-description__content, .description__text');
  if (!descriptionElement) return '';

  const fullText = descriptionElement.textContent;
  const sections = fullText.split(/(?:\n\s*){2,}|\. [A-Z]|Benefits:|What we offer:|Perks:/i);
  
  let benefits = '';
  
  for (const section of sections) {
    const lowerSection = section.toLowerCase();
    if ((lowerSection.includes('benefit') || 
         lowerSection.includes('offer') || 
         lowerSection.includes('perk') ||
         lowerSection.includes('insurance') ||
         lowerSection.includes('vacation') ||
         lowerSection.includes('remote') ||
         lowerSection.includes('flexible')) &&
        section.length > 30 && section.length < 600) {
      benefits += cleanText(section) + '\n';
      break; // Take first matching section
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

function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')           // Multiple spaces to single space
    .replace(/\n+/g, '\n')          // Multiple newlines to single newline
    .replace(/\t+/g, ' ')           // Replace tabs with spaces
    .replace(/\r/g, '')             // Remove carriage returns
    .replace(/(.{100,}?)\1+/g, '$1') // Remove duplicate long text blocks (more conservative)
    .trim();
}

// Clean and validate job data
function cleanJobData(jobData) {
  // Remove empty fields and normalize data
  for (const [key, value] of Object.entries(jobData)) {
    if (typeof value === 'string') {
      let cleanedValue = value;
      
      // Don't clean URLs - preserve them as-is
      if (key === 'sourceURL' || key === 'applicationUrl') {
        // Just trim whitespace for URLs
        cleanedValue = value.trim();
      } else {
        // Clean the text and handle Unicode properly for other fields
        cleanedValue = cleanText(value);
        
        // Remove or replace problematic Unicode characters that might cause issues
        cleanedValue = cleanedValue
          .replace(/[\u2018\u2019]/g, "'")  // Smart quotes to regular quotes
          .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
          .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes to regular dash
          .replace(/[\u2026]/g, '...')      // Ellipsis
          .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, '') // Keep only common Latin characters
          .trim();
      }
      
      jobData[key] = cleanedValue;
      
      // Remove if too short to be meaningful (but not URLs)
      if (key !== 'sourceURL' && key !== 'applicationUrl' && cleanedValue.length < 2) {
        jobData[key] = '';
      }
    }
  }
  
  // Set fallback values for missing data
  if (!jobData.title || jobData.title.length < 3) {
    jobData.title = 'Unknown Job';
  }

  if (!jobData.company || jobData.company.length < 2) {
    jobData.company = 'Unknown Company';
  }

  // --- Improved location extraction for onboarding/remote/India ---
  const desc = (jobData.description || '').toLowerCase();
  let overrideLocation = '';
  if ((desc.includes('onboarding') && (desc.includes('india') || desc.includes('delhi') || desc.includes('bangalore')))) {
    overrideLocation = 'India (Onboarding), Remote';
  } else if (desc.includes('remote') || desc.includes('work from anywhere') || desc.includes('work from home')) {
    overrideLocation = 'Remote';
  }
  if (overrideLocation) {
    jobData.location = overrideLocation;
  } else if (!jobData.location || jobData.location.length < 3) {
    jobData.location = 'Unknown Location';
  }
  
  // Validate and fix URLs
  if (jobData.applicationUrl && !jobData.applicationUrl.startsWith('http')) {
    jobData.applicationUrl = window.location.href;
  }
  if (jobData.sourceURL && !jobData.sourceURL.startsWith('http')) {
    jobData.sourceURL = window.location.href;
  }
  
  // Validate required fields - now check against fallback values
  if (jobData.title === 'Unknown Job') {
    throw new Error('Job title not found or too short');
  }
  
  if (jobData.company === 'Unknown Company') {
    throw new Error('Company name not found or too short');
  }
  
  if (!jobData.description || jobData.description.length < 50) {
    throw new Error('Job description not found or too short');
  }
  
  // Log the cleaned data for debugging
  console.log('SpotGhost Content: Cleaned job data:', {
    title: jobData.title?.substring(0, 50) + '...',
    company: jobData.company,
    descriptionLength: jobData.description?.length || 0,
    applicationUrl: jobData.applicationUrl,
    sourceURL: jobData.sourceURL
  });
  
  return jobData;
}

// Real-time analysis and UI injection
function initializeRealTimeFeatures() {
  console.log('SpotGhost Content: Initializing real-time features...');
  
  // Remove any existing floating buttons and UI elements first
  const existingButton = document.getElementById('spotghost-floating-btn');
  if (existingButton) {
    existingButton.remove();
    console.log('SpotGhost: Removed existing floating button');
  }
  
  // Remove any existing warning banners
  const existingWarnings = document.querySelectorAll('.spotghost-warning-container');
  existingWarnings.forEach(warning => {
    warning.remove();
    console.log('SpotGhost: Removed existing warning banner');
  });
  
  // Remove any existing styles that might contain floating button CSS
  const existingStyles = document.getElementById('spotghost-styles');
  if (existingStyles) {
    existingStyles.remove();
    console.log('SpotGhost: Removed existing styles');
  }
  
  // DON'T inject enhanced styles that contain floating button CSS
  // injectEnhancedStyles();
  
  const platform = detectPlatform();
  console.log('SpotGhost Content: Detected platform:', platform?.name || 'Unknown');
  
  // DISABLED: All UI features disabled for side panel mode
  // addInlineRiskIndicators();
  // setTimeout(performAutoScan, 3000);
  
  console.log('SpotGhost Content: Real-time features initialized (all UI features disabled for side panel)');
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
  
  // Improved: Do not flag location contradiction if location was overridden to 'India (Onboarding), Remote' or 'Remote'
  const location = (jobData.location || '').toLowerCase();
  if (!location || location === 'unknown location') {
    redFlags.push('No location specified');
    riskScore += 15;
  }
  // Do not flag contradiction if location is 'india (onboarding), remote' or 'remote'
  else if (
    location !== 'india (onboarding), remote' &&
    location !== 'remote' &&
    location !== 'remote, india (onboarding)'
  ) {
    // (If you want to keep the contradiction logic, add it here, but skip for these cases)
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

// Show quick warning for high-risk jobs (DISABLED for side panel mode)
function showQuickWarning(scanResult) {
  console.log('SpotGhost: Quick warning disabled in side panel mode');
  return;
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
        // Results will be shown in side panel - no need for modal popup
        console.log('SpotGhost: Analysis complete, results shown in side panel');
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

// Show analysis results (Modified for side panel integration)
function showAnalysisResults(analysis) {
  console.log('SpotGhost Analysis Results:', analysis);
  
  // Only send results to side panel, do not show any modal or floating button
  chrome.runtime.sendMessage({
    action: 'analysisComplete',
    data: analysis
  }, (response) => {
    console.log('SpotGhost: Analysis results sent to side panel');
  });
}

// Show analysis error
function showAnalysisError(error) {
  alert(`SpotGhost Analysis Error: ${error}`);
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'ping') {
      sendResponse({ status: 'ready', platform: detectPlatform()?.name || 'unknown' });
      return true;
    }
    
    if (message.action === 'extractJob') {
      const jobData = extractJobData();
      console.log('SpotGhost Content: Job data extracted:', jobData);
      sendResponse(jobData);
      return true;
    }
  } catch (error) {
    console.error('SpotGhost Content: Message handling error:', error);
    sendResponse({ error: error.message });
  }
  return true;
});

// Initialize when page loads
console.log('SpotGhost Content: Script loaded, document state:', document.readyState);

if (document.readyState === 'loading') {
  console.log('SpotGhost Content: Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('SpotGhost Content: DOMContentLoaded fired');
    initializeRealTimeFeatures();
  });
} else {
  console.log('SpotGhost Content: Document already ready, initializing immediately');
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