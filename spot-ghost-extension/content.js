// Fallback: Extract field from description text
function extractFieldFromDescription(description, fieldName) {
  if (!description) return '';
  const regex = new RegExp(fieldName + '[:\-\s]+([\w\s,]+)', 'i');
  const match = description.match(regex);
  return match ? match[1].trim() : '';
}
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
        '.jobsearch-JobInfoHeader-subtitle > div', // Most reliable for city/state
        '[data-testid="job-location"]',
        '.jobsearch-JobInfoHeader-subtitle div',
        '.jobsearch-JobMetadataHeader-item',
        '.jobsearch-JobInfoHeader-subtitle',
        '.jobsearch-JobInfoHeader-subtitle *'
      ],
      salary: [
        '.jobsearch-JobMetadataHeader-item',
        '[data-testid="job-salary"]',
        '.salary-snippet'
      ],
      postedDate: [
        '.jobsearch-JobMetadataFooter', // Often contains "Posted X days ago"
        '[data-testid="job-detail-date"]',
        '.jobsearch-JobInfoHeader-subtitle',
        'time',
        '[class*="date"]'
      ],
      applicationDeadline: [
        '[data-testid*="deadline"]',
        '[class*="deadline"]',
        '.application-deadline',
        '.jobsearch-JobMetadataFooter'
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
  
  // Extract core fields using platform-specific selectors (restored logic)
  for (const [field, selectors] of Object.entries(platform.extractors)) {
    const extractedValue = extractTextFromSelectors(selectors);
    jobData[field] = extractedValue;
    console.log(`SpotGhost: Extracted ${field}:`, extractedValue ? extractedValue.substring(0, 100) + '...' : 'EMPTY');
  }
  // Fallback: If location is still missing, use enhanced location extraction
  if (!jobData.location || jobData.location.length < 3) {
    const enhancedLoc = extractLocationWithFallbacks();
    if (enhancedLoc && enhancedLoc !== 'Unknown Location') {
      jobData.location = enhancedLoc;
      console.log('SpotGhost: Enhanced fallback location:', jobData.location);
    } else {
      // Fallback to parsing description for location
      const descLocation = extractFieldFromDescription(jobData.description, 'Location');
      if (descLocation && descLocation.length > 2) {
        jobData.location = descLocation;
        console.log('SpotGhost: Fallback location extracted from description:', descLocation);
      } else {
        jobData.location = '';
        console.log('SpotGhost: Location extraction failed, leaving as empty.');
      }
    }
  } else {
    console.log('SpotGhost: Primary location extraction successful:', jobData.location);
  }

  if (!jobData.postedDate || jobData.postedDate.length < 3) {
    // Try to extract posted date from description as fallback
    const descPosted = extractFieldFromDescription(jobData.description, 'Posted');
    if (descPosted && descPosted.length > 2) {
      jobData.postedDate = descPosted;
      console.log('SpotGhost: Fallback posted date extracted from description:', descPosted);
    }
  }
  
  // Extract additional fields with generic selectors
  jobData.requirements = extractRequirements();
  jobData.qualifications = extractQualifications();
  jobData.benefits = extractBenefits();
  jobData.jobType = extractJobType();
  jobData.experienceLevel = extractExperienceLevel();
  jobData.postedDate = extractPostedDate();
  jobData.contactEmail = extractContactEmail();

  // Extract positive indicators (green flags)
  jobData.positiveSignals = extractPositiveIndicators(jobData);

  // Clean and validate data
  return cleanJobData(jobData);
// Extract positive indicators (green flags) from job data
function extractPositiveIndicators(jobData) {
  const greenFlags = [];
  // 1. Company website or verified email
  if (jobData.contactEmail && /@(?!gmail|yahoo|hotmail|outlook|protonmail|aol)\w+\./i.test(jobData.contactEmail)) {
    greenFlags.push('Company email provided');
  }
  // 2. Benefits listed
  if (jobData.benefits && jobData.benefits.length > 10) {
    greenFlags.push('Benefits/perks listed');
  }
  // 3. Detailed requirements
  if (jobData.requirements && jobData.requirements.length > 30) {
    greenFlags.push('Detailed requirements specified');
  }
  // 4. Salary information present
  if (jobData.salary && jobData.salary.length > 2) {
    greenFlags.push('Salary information provided');
  }
  // 5. Company name is not generic
  if (jobData.company && !/unknown|company|inc|llc|ltd|enterprise|corp/i.test(jobData.company) && jobData.company.length > 2) {
    greenFlags.push('Company name appears specific');
  }
  // 6. Location is present and not generic
  if (jobData.location && !/unknown|remote/i.test(jobData.location) && jobData.location.length > 2) {
    greenFlags.push('Location specified');
  }
  // 7. Job description is detailed
  if (jobData.description && jobData.description.length > 200) {
    greenFlags.push('Detailed job description');
  }
  // 8. Application URL is present and not generic
  if (jobData.applicationUrl && jobData.applicationUrl.length > 10 && !/linkedin\.com\/jobs\/?$/.test(jobData.applicationUrl)) {
    greenFlags.push('Direct application link present');
  }
  return greenFlags;
}
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

// Real-time analysis and UI injection (streamlined for side panel)
function initializeRealTimeFeatures() {
  console.log('SpotGhost Content: Initializing real-time features...');
  
  // Clean up any existing UI elements
  const existingButton = document.getElementById('spotghost-floating-btn');
  if (existingButton) existingButton.remove();
  
  const existingWarnings = document.querySelectorAll('.spotghost-warning-container');
  existingWarnings.forEach(warning => warning.remove());
  
  const platform = detectPlatform();
  console.log('SpotGhost Content: Detected platform:', platform?.name || 'Unknown');
  console.log('SpotGhost Content: Real-time features initialized (side panel mode)');
}

// Classic analysis logic ported from backend (pure JS, safe for extension)
function classicJobAnalysis(jobData, opts = {}) {
  const warnings = [];
  const greenFlags = [];
  let riskScore = 0;

  // Normalize data
  const description = (jobData.description || '').toLowerCase();
  const title = (jobData.title || '').toLowerCase();
  const company = (jobData.company || '').toLowerCase();
  const fullText = `${description} ${title} ${company}`;

  // 1. Critical scam indicators
  const criticalScamPhrases = [
    'quick money', 'easy money', 'fast cash', 'instant income',
    'processing fee', 'training fee', 'startup fee', 'activation fee',
    'money transfer', 'western union', 'wire transfer', 'cryptocurrency',
    'pyramid scheme', 'mlm opportunity', 'multi-level marketing',
    'make $500 per day', 'earn thousands weekly', 'financial freedom'
  ];
  const foundCriticalPhrases = criticalScamPhrases.filter(phrase => fullText.includes(phrase));
  if (foundCriticalPhrases.length > 0) {
    warnings.push(`🚨 Contains common scam phrases: ${foundCriticalPhrases.slice(0, 2).join(', ')}`);
    riskScore += foundCriticalPhrases.length * 40;
  } else {
    greenFlags.push('No common scam phrases detected.');
  }

  // 2. High-pressure tactics
  const highPressurePhrases = [
    'urgent hiring', 'immediate start', 'no interview required',
    'cash only', 'pay in advance', 'act now', 'limited time'
  ];
  const foundHighPressure = highPressurePhrases.filter(phrase => fullText.includes(phrase));
  if (foundHighPressure.length > 0) {
    warnings.push(`⚠️ Uses high-pressure language: ${foundHighPressure.slice(0, 2).join(', ')}`);
    riskScore += foundHighPressure.length * 25;
  } else {
    greenFlags.push('No high-pressure or urgent language detected.');
  }

  // 3. Email analysis
  if (jobData.contactEmail) {
    const email = jobData.contactEmail.toLowerCase();
    const domain = email.split('@')[1];
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'
    ];
    if (freeEmailDomains.includes(domain) && company.includes('corp')) {
      warnings.push('⚠️ Large company using personal email instead of business email');
      riskScore += 30;
    } else if (!freeEmailDomains.includes(domain)) {
      greenFlags.push('Contact email uses a business domain.');
    }
  }

  // 4. Website/Application URL analysis
  if (jobData.applicationUrl) {
    const url = jobData.applicationUrl.toLowerCase();
    const majorJobPlatforms = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 
      'ziprecruiter.com', 'careerbuilder.com', 'jobs.google.com'
    ];
    const isOnMajorPlatform = majorJobPlatforms.some(platform => url.includes(platform));
    if (isOnMajorPlatform) {
      greenFlags.push('Job posted on reputable job platform.');
      if (url.includes('linkedin.com')) {
        greenFlags.push('LinkedIn requires company verification for job postings.');
      } else if (url.includes('indeed.com')) {
        greenFlags.push('Indeed has fraud prevention measures in place.');
      } else if (url.includes('glassdoor.com')) {
        greenFlags.push('Glassdoor requires employer verification for job posts.');
      }
    } else {
      if (url.includes('blogspot') || url.includes('wordpress.com') || url.includes('wix')) {
        warnings.push('⚠️ Job posted on free website platform');
        riskScore += 35;
      } else {
        greenFlags.push('Job not posted on a free website platform.');
      }
      if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('t.co')) {
        warnings.push('🚨 Uses shortened/hidden web address - major red flag');
        riskScore += 50;
      } else {
        greenFlags.push('No shortened or hidden web address detected.');
      }
      if (url.startsWith('http://')) {
        warnings.push('⚠️ Website is not secure (no HTTPS)');
        riskScore += 20;
      } else if (url.startsWith('https://')) {
        greenFlags.push('Website uses secure HTTPS connection.');
      }
    }
  } else {
    warnings.push('⚠️ No application URL provided');
    riskScore += 15;
  }

  // 5. Compensation red flags
  if (jobData.salary) {
    const salary = jobData.salary.toLowerCase();
    if (salary.includes('unlimited') || salary.includes('no limit')) {
      warnings.push('🚨 Promises unlimited earnings - classic scam tactic');
      riskScore += 50;
    }
    const salaryNumbers = salary.match(/\d+/g);
    if (salaryNumbers) {
      const maxNumber = Math.max(...salaryNumbers.map(Number));
      if (salary.includes('day') && maxNumber > 300) {
        warnings.push('⚠️ Daily salary seems unrealistic');
        riskScore += 35;
      }
      if (salary.includes('hour') && maxNumber > 100) {
        warnings.push('⚠️ Hourly wage seems unusually high');
        riskScore += 30;
      }
    } else {
      greenFlags.push('Salary/compensation appears realistic.');
    }
  }

  // 6. Missing critical information
  const missingInfo = [];
  if (!jobData.company || jobData.company.length < 2 || jobData.company === 'Unknown Company') {
    missingInfo.push('company name');
  }
  if (!jobData.description || jobData.description.length < 50) {
    missingInfo.push('job description');
  }
  if (!jobData.title || jobData.title.length < 3 || jobData.title === 'Unknown Job') {
    missingInfo.push('job title');
  }
  if (!jobData.location || jobData.location === 'Unknown Location' || jobData.location.length < 3) {
    missingInfo.push('location');
  }
  const hasValidApplicationUrl = jobData.applicationUrl && 
    (jobData.applicationUrl.startsWith('http') || jobData.applicationUrl.includes('.com'));
  if (!hasValidApplicationUrl) {
    missingInfo.push('application link');
  }
  if (missingInfo.length >= 1) {
    if (!opts.skipMissingPenalty) {
      warnings.push(`Missing key information: ${missingInfo.join(', ')}`);
      riskScore += missingInfo.length * 20;
    }
  } else {
    greenFlags.push('All essential job information is present.');
  }

  // 7. Generic content check
  const genericPhrases = [
    'competitive salary', 'dynamic environment', 'team player',
    'excellent communication skills', 'fast-paced environment'
  ];
  const foundGeneric = genericPhrases.filter(phrase => description.includes(phrase));
  if (foundGeneric.length > 4) {
    warnings.push('Job description is very generic');
    riskScore += 20;
  } else {
    greenFlags.push('Job description is specific and detailed.');
  }

  riskScore = Math.min(100, riskScore);
  const safetyScore = Math.max(0, 100 - riskScore);
  let riskLevel;
  if (safetyScore >= 85) riskLevel = 'Very Low';
  else if (safetyScore >= 70) riskLevel = 'Low'; 
  else if (safetyScore >= 55) riskLevel = 'Medium';
  else if (safetyScore >= 40) riskLevel = 'High';
  else riskLevel = 'Critical';

  return {
    safetyScore,
    riskScore,
    riskLevel,
    warnings,
    greenFlags
  };
}

// ML Data Collection for Training
class MLDataCollector {
  constructor() {
    this.storageKey = 'spotghost_ml_training_data';
    this.maxSamples = 1000; // Limit storage size
  }

  async saveJobSample(jobData, humanLabel = null, classicResult = null) {
    try {
      const sample = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        jobData: {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description?.substring(0, 2000), // Limit size
          location: jobData.location,
          salary: jobData.salary,
          platform: jobData.platform
        },
        features: this.extractFeatures(jobData),
        humanLabel, // 'scam' | 'legitimate' | null (unlabeled)
        classicResult: classicResult ? {
          riskLevel: classicResult.riskLevel,
          safetyScore: classicResult.safetyScore,
          warningCount: classicResult.warnings?.length || 0
        } : null
      };

      const stored = await this.getStoredSamples();
      stored.push(sample);
      
      // Keep only recent samples to prevent storage overflow
      if (stored.length > this.maxSamples) {
        stored.splice(0, stored.length - this.maxSamples);
      }

      await chrome.storage.local.set({ [this.storageKey]: stored });
      console.log('SpotGhost ML: Sample saved for training', sample.id);
      return sample.id;
    } catch (error) {
      console.error('SpotGhost ML: Failed to save training sample', error);
    }
  }

  async getStoredSamples() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || [];
    } catch (error) {
      console.error('SpotGhost ML: Failed to get stored samples', error);
      return [];
    }
  }

  async getLabeledSamples() {
    const samples = await this.getStoredSamples();
    return samples.filter(sample => sample.humanLabel !== null);
  }

  extractFeatures(jobData) {
    // Extract numerical features for ML training
    const desc = (jobData.description || '').toLowerCase();
    const title = (jobData.title || '').toLowerCase();
    const company = (jobData.company || '').toLowerCase();
    
    return {
      descriptionLength: desc.length,
      titleLength: title.length,
      companyLength: company.length,
      hasEmail: !!jobData.contactEmail,
      hasSalary: !!jobData.salary,
      hasLocation: !!jobData.location,
      isRemote: desc.includes('remote') || desc.includes('work from home'),
      urgencyWords: (desc.match(/urgent|immediate|asap|quickly/g) || []).length,
      moneyWords: (desc.match(/money|cash|payment|fee/g) || []).length,
      genericWords: (desc.match(/competitive|dynamic|team player|excellent/g) || []).length,
      platform: jobData.platform || 'unknown'
    };
  }

  async exportForTraining() {
    const labeledSamples = await this.getLabeledSamples();
    console.log(`SpotGhost ML: Exporting ${labeledSamples.length} labeled samples for training`);
    return labeledSamples;
  }
}

// Initialize ML data collector and ML model
const mlDataCollector = new MLDataCollector();
let mlModel = null;

// Initialize ML model when page loads
async function initializeMLModel() {
  try {
    if (typeof SpotGhostMLModel !== 'undefined') {
      mlModel = new SpotGhostMLModel();
      await mlModel.initialize(); // Use the new initialize method that loads TensorFlow
      console.log('SpotGhost ML: Model initialized', mlModel.getStatus());
    } else {
      console.warn('SpotGhost ML: MLModel class not available');
    }
  } catch (error) {
    console.error('SpotGhost ML: Failed to initialize model', error);
  }
}

// Removed showQuickWarning - not needed for side panel mode

// Analyze current job (triggered by user action)
async function analyzeCurrentJob() {
  try {
    const jobData = extractJobData();
    // Run classic analysis locally for instant feedback
    const classicAnalysis = classicJobAnalysis(jobData);
    
    // Save job data for ML training (with classic analysis results)
    await mlDataCollector.saveJobSample(jobData, null, classicAnalysis);
    
    // Show loading state
    showAnalysisLoading();
    
    // Send to background script for full AI analysis
    chrome.runtime.sendMessage({
      action: 'analyzeJob',
      data: jobData
    }, (response) => {
      hideAnalysisLoading();
      if (response && response.success) {
        // Merge classic analysis with backend results for display
        const merged = {
          ...response.analysis,
          job: {
            ...response.analysis.job,
            classicAnalysis
          }
        };
        showAnalysisResults(merged);
        console.log('SpotGhost: Analysis complete, results shown in side panel');
      } else {
        // If backend fails, still show local classic analysis
        showAnalysisResults({ job: { ...jobData, classicAnalysis } });
        showAnalysisError(response?.error || 'Analysis failed');
      }
    });
  } catch (error) {
    hideAnalysisLoading();
    // If extraction or classic analysis fails, show error
    showAnalysisError(error.message);
  }
}

// Removed checkCompanyReputation - not used in current flow

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

// Message listener for popup/sidepanel communication (guarded)
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
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
      if (message.action === 'extractAndAnalyzeJob') {
        (async () => {
          try {
            const jobData = extractJobData();
            // Run classic analysis - streamlined version
            const classicAnalysis = classicJobAnalysis(jobData);
            jobData.classicAnalysis = classicAnalysis;
            
            // Save for ML training
            await mlDataCollector.saveJobSample(jobData, null, classicAnalysis);
            
            // Try ML analysis if model is ready
            let mlAnalysis = null;
            if (mlModel && mlModel.isReady) {
              try {
                mlAnalysis = await mlModel.predict(jobData);
                console.log('SpotGhost ML: ML prediction completed', mlAnalysis);
              } catch (mlError) {
                console.warn('SpotGhost ML: ML prediction failed', mlError);
              }
            }
            
            // Prepare response with both classic and ML analysis
            const analysis = {
              job: {
                ...jobData,
                classicAnalysis,
                mlAnalysis, // New ML-based analysis
                aiAnalysis: null, // Backend AI analysis (separate)
                platform: message.platform || jobData.platform || null
              }
            };
            sendResponse({ success: true, analysis });
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      // ML Data Management endpoints
      if (message.action === 'labelJobData') {
        (async () => {
          try {
            const { jobId, label } = message;
            const samples = await mlDataCollector.getStoredSamples();
            const sample = samples.find(s => s.id === jobId);
            if (sample) {
              sample.humanLabel = label; // 'scam' or 'legitimate'
              await chrome.storage.local.set({ [mlDataCollector.storageKey]: samples });
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'Job not found' });
            }
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      if (message.action === 'exportMLData') {
        (async () => {
          try {
            const data = await mlDataCollector.exportForTraining();
            sendResponse({ success: true, data });
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      // ML Model Training endpoints
      if (message.action === 'trainMLModel') {
        (async () => {
          try {
            if (!mlModel) {
              mlModel = new SpotGhostMLModel();
              await mlModel.initialize(); // Initialize with TensorFlow loading
            }
            
            const labeledData = await mlDataCollector.getLabeledSamples();
            if (labeledData.length < 10) {
              sendResponse({ success: false, error: 'Need at least 10 labeled samples to train' });
              return;
            }
            
            const result = await mlModel.trainModel(labeledData);
            sendResponse({ success: true, result });
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      if (message.action === 'getMLStatus') {
        (async () => {
          try {
            const status = mlModel ? mlModel.getStatus() : { isReady: false, hasModel: false };
            const dataStats = await mlDataCollector.getStoredSamples();
            const labeledCount = dataStats.filter(s => s.humanLabel).length;
            
            sendResponse({ 
              success: true, 
              status: {
                ...status,
                totalSamples: dataStats.length,
                labeledSamples: labeledCount
              }
            });
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }
    } catch (error) {
      console.error('SpotGhost Content: Message handling error:', error);
      sendResponse({ error: error.message });
    }
    return true;
  });
}

// Initialize when page loads
console.log('SpotGhost Content: Script loaded, document state:', document.readyState);

if (document.readyState === 'loading') {
  console.log('SpotGhost Content: Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('SpotGhost Content: DOMContentLoaded fired');
    initializeRealTimeFeatures();
    initializeMLModel(); // Initialize ML model
  });
} else {
  console.log('SpotGhost Content: Document already ready, initializing immediately');
  initializeRealTimeFeatures();
  initializeMLModel(); // Initialize ML model
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