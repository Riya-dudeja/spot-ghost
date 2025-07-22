chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extractJob') {
    try {
      const currentUrl = window.location.href;
      
      // Check if we're on a job view page or search page
      if (currentUrl.includes('/jobs/view/')) {
        // Individual job page extraction
        extractFromJobViewPage(sendResponse);
      } else if (currentUrl.includes('/jobs/search/')) {
        // Search page - extract from the selected/highlighted job
        extractFromSearchPage(sendResponse);
      } else {
        sendResponse({ 
          title: '', 
          company: '', 
          description: '',
          error: 'Not on a supported LinkedIn jobs page'
        });
      }
    } catch (error) {
      console.error('SpotGhost extraction error:', error);
      sendResponse({ 
        title: '', 
        company: '', 
        description: '',
        error: 'Failed to extract job data'
      });
    }
  }
});

function extractFromJobViewPage(sendResponse) {
  // Multiple selectors for job title (LinkedIn changes these frequently)
  const titleSelectors = [
    'h1.top-card-layout__title',
    'h1[data-test-id="job-title"]',
    'h1.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title h1',
    'h1'
  ];
  
  // Multiple selectors for company name
  const companySelectors = [
    '.topcard__org-name-link',
    '.topcard__flavor',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
    '[data-test-id="job-poster-name"]',
    '.job-details-jobs-unified-top-card__primary-description-container .app-aware-link'
  ];
  
  // Multiple selectors for job description
  const descriptionSelectors = [
    '.description__text',
    '.description',
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.job-details-jobs-unified-top-card__job-description',
    '[data-test-id="job-details-description"]',
    '.jobs-description-content__text'
  ];
  
  // Location selectors
  const locationSelectors = [
    '.topcard__flavor--bullet',
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    '.topcard__flavor',
    '.job-details-jobs-unified-top-card__primary-description-container .jobs-unified-top-card__bullet'
  ];
  
  // Salary selectors
  const salarySelectors = [
    '.job-details-jobs-unified-top-card__job-insight--highlight',
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight',
    '.salary'
  ];
  
  // Company size selectors
  const companySizeSelectors = [
    '.job-details-jobs-unified-top-card__company-name + div',
    '.jobs-unified-top-card__company-name + div',
    '.job-details-jobs-unified-top-card__primary-description-container .jobs-unified-top-card__company-name + div'
  ];
  
  // Job type selectors (Full-time, Part-time, etc.)
  const jobTypeSelectors = [
    '.job-details-jobs-unified-top-card__job-insight span',
    '.jobs-unified-top-card__job-insight span',
    '.job-details-jobs-unified-top-card__job-insight'
  ];
  
  // Experience level selectors
  const experienceLevelSelectors = [
    '.job-details-jobs-unified-top-card__job-insight--highlight span',
    '.jobs-unified-top-card__job-insight--highlight span'
  ];
  
  // Extract basic data
  const title = getTextBySelectors(titleSelectors);
  const company = getTextBySelectors(companySelectors);
  const description = getTextBySelectors(descriptionSelectors);
  
  // Extract detailed data
  const location = getTextBySelectors(locationSelectors);
  const salary = extractSalaryInfo();
  const jobType = extractJobType();
  const experienceLevel = extractExperienceLevel();
  const companySize = extractCompanySize();
  
  // Extract job insights and criteria
  const jobInsights = extractJobInsights();
  const applicationDeadline = extractApplicationDeadline();
  const postedDate = extractPostedDate();
  
  // Extract skills and qualifications from description
  const { requirements, qualifications, benefits } = parseDescriptionSections(description);
  
  // Extract contact information
  const contactInfo = extractContactInfo();
  
  // Extract application instructions
  const applicationInstructions = extractApplicationInstructions();
  
  // Fallback: Extract additional data from full page text
  const fallbackData = extractFromFullPageText();
  
  // Merge fallback data with extracted data
  const finalSalary = salary || fallbackData.salary;
  const finalRequirements = requirements || fallbackData.requirements;
  const finalQualifications = qualifications || fallbackData.qualifications;
  const finalBenefits = benefits || fallbackData.benefits;
  const finalLocation = location || fallbackData.location;
  
  // Debug logging
  console.log('SpotGhost extraction debug:', {
    descriptionLength: description.length,
    descriptionPreview: description.substring(0, 200) + '...',
    location: location || 'NOT FOUND',
    salary: salary || 'NOT FOUND', 
    jobType: jobType || 'NOT FOUND',
    experienceLevel: experienceLevel || 'NOT FOUND',
    companySize: companySize || 'NOT FOUND',
    requirements: requirements || 'NOT FOUND',
    qualifications: qualifications || 'NOT FOUND',
    benefits: benefits || 'NOT FOUND',
    jobInsights: jobInsights || 'NOT FOUND',
    contactInfo: contactInfo || 'NOT FOUND',
    fallbackData: fallbackData
  });
  
  // Additional debugging - log available selectors
  console.log('Available selectors on page:');
  const testSelectors = [
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight',
    '.jobs-description__content',
    '.jobs-box__html-content'
  ];
  
  testSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    elements.forEach((el, i) => {
      console.log(`  [${i}]: ${el.innerText.substring(0, 100)}...`);
    });
  });
  
  // Log page text patterns
  const pageText = document.body.innerText;
  console.log('Page text contains:');
  console.log('- Stipend:', pageText.includes('Stipend'));
  console.log('- Eligibility:', pageText.includes('Eligibility'));
  console.log('- Duration:', pageText.includes('Duration'));
  console.log('- Remote:', pageText.includes('Remote'));
  console.log('- Greater Kolkata:', pageText.includes('Greater Kolkata'));
  
  // Clean up the extracted data
  const cleanedData = {
    title: title.replace(/\n/g, ' ').trim(),
    company: company.replace(/\n/g, ' ').trim(),
    description: description.replace(/\s+/g, ' ').trim(),
    location: (finalLocation || '').replace(/\n/g, ' ').trim(),
    salary: finalSalary || '',
    jobType: jobType || '',
    experienceLevel: experienceLevel || '',
    companySize: companySize || '',
    requirements: finalRequirements || '',
    qualifications: finalQualifications || '',
    benefits: finalBenefits || '',
    jobInsights: jobInsights || '',
    applicationDeadline: applicationDeadline || '',
    postedDate: postedDate || '',
    contactInfo: contactInfo || '',
    applicationInstructions: applicationInstructions || ''
  };
  
  console.log('SpotGhost extracted comprehensive data:', cleanedData);
  sendResponse(cleanedData);
}

function extractFromSearchPage(sendResponse) {
  // On search pages, try to get the currently selected/visible job details
  const titleSelectors = [
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title',
    'h1[data-test-id="job-title"]'
  ];
  
  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
    '.job-details-jobs-unified-top-card__primary-description-container .app-aware-link'
  ];
  
  const descriptionSelectors = [
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.job-details-jobs-unified-top-card__job-description'
  ];
  
  const title = getTextBySelectors(titleSelectors);
  const company = getTextBySelectors(companySelectors);
  const description = getTextBySelectors(descriptionSelectors);
  
  // If we can't find job details in the right panel, suggest clicking on a job
  if (!title || !company || !description) {
    sendResponse({ 
      title: '', 
      company: '', 
      description: '',
      error: 'Please click on a specific job from the search results first'
    });
    return;
  }
  
  const cleanedData = {
    title: title.replace(/\n/g, ' ').trim(),
    company: company.replace(/\n/g, ' ').trim(),
    description: description.replace(/\s+/g, ' ').trim(),
    location: ''
  };
  
  console.log('SpotGhost extracted from search page:', cleanedData);
  sendResponse(cleanedData);
}

// Helper function to try multiple selectors
function getTextBySelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText.trim()) {
      return element.innerText.trim();
    }
  }
  return '';
}

// Extract salary information
function extractSalaryInfo() {
  const salarySelectors = [
    '.job-details-jobs-unified-top-card__job-insight--highlight',
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight',
    '.salary'
  ];
  
  for (const selector of salarySelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText.trim();
      if (text && (text.includes('$') || text.includes('salary') || text.includes('pay') || text.includes('stipend'))) {
        return text;
      }
    }
  }
  
  // Also check in the full page text for salary patterns
  const pageText = document.body.innerText;
  const salaryPatterns = [
    /stipend[:\s]*([^\n]+)/i,
    /salary[:\s]*([^\n]+)/i,
    /compensation[:\s]*([^\n]+)/i,
    /\$[\d,]+/g,
    /[\d,]+k[\s]*-[\s]*[\d,]+k/i
  ];
  
  for (const pattern of salaryPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return '';
}

// Extract job type (Full-time, Part-time, etc.)
function extractJobType() {
  const jobTypeSelectors = [
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight'
  ];
  
  for (const selector of jobTypeSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText.trim().toLowerCase();
      if (text.includes('full-time') || text.includes('part-time') || text.includes('contract') || text.includes('internship')) {
        return element.innerText.trim();
      }
    }
  }
  return '';
}

// Extract experience level
function extractExperienceLevel() {
  const expSelectors = [
    '.job-details-jobs-unified-top-card__job-insight--highlight',
    '.job-details-jobs-unified-top-card__job-insight'
  ];
  
  for (const selector of expSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText.trim().toLowerCase();
      if (text.includes('entry') || text.includes('junior') || text.includes('senior') || text.includes('mid') || text.includes('years')) {
        return element.innerText.trim();
      }
    }
  }
  return '';
}

// Extract company size
function extractCompanySize() {
  const sizeSelectors = [
    '.job-details-jobs-unified-top-card__company-name + div',
    '.jobs-unified-top-card__company-name + div'
  ];
  
  for (const selector of sizeSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText.trim();
      if (text.includes('employees') || text.includes('people') || text.includes('size')) {
        return text;
      }
    }
  }
  return '';
}

// Extract job insights (skills, seniority, etc.)
function extractJobInsights() {
  const insights = [];
  const insightSelectors = [
    '.job-details-jobs-unified-top-card__job-insight',
    '.jobs-unified-top-card__job-insight'
  ];
  
  for (const selector of insightSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText.trim();
      if (text && !insights.includes(text)) {
        insights.push(text);
      }
    }
  }
  return insights.join(', ');
}

// Extract application deadline
function extractApplicationDeadline() {
  const deadlineSelectors = [
    '.job-details-jobs-unified-top-card__job-insight--highlight',
    '.jobs-unified-top-card__job-insight--highlight'
  ];
  
  for (const selector of deadlineSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText.trim().toLowerCase();
      if (text.includes('deadline') || text.includes('apply by') || text.includes('expires')) {
        return element.innerText.trim();
      }
    }
  }
  return '';
}

// Extract posted date
function extractPostedDate() {
  const dateSelectors = [
    '.job-details-jobs-unified-top-card__primary-description-container time',
    '.jobs-unified-top-card__primary-description-container time',
    'time'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText.trim();
    }
  }
  return '';
}

// Parse description sections for requirements, qualifications, and benefits
function parseDescriptionSections(description) {
  const sections = {
    requirements: '',
    qualifications: '',
    benefits: ''
  };
  
  if (!description) return sections;
  
  const text = description.toLowerCase();
  const lines = description.split('\n');
  
  // Find requirements section
  const requirementKeywords = ['requirements:', 'required:', 'must have:', 'responsibilities:', 'what you\'ll do:', 'role overview', 'what you\'ll work on'];
  const qualificationKeywords = ['qualifications:', 'preferred:', 'nice to have:', 'skills:', 'experience:', 'eligibility:', 'what we\'re looking for'];
  const benefitKeywords = ['benefits:', 'we offer:', 'perks:', 'what we offer:', 'compensation:', 'stipend:', 'salary:', 'about gradxpert', 'about the company'];
  
  // Extract requirements
  for (const keyword of requirementKeywords) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      const startIndex = index + keyword.length;
      const endIndex = findSectionEnd(text, startIndex, [...qualificationKeywords, ...benefitKeywords]);
      sections.requirements = description.substring(startIndex, endIndex).trim();
      break;
    }
  }
  
  // Extract qualifications
  for (const keyword of qualificationKeywords) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      const startIndex = index + keyword.length;
      const endIndex = findSectionEnd(text, startIndex, [...requirementKeywords, ...benefitKeywords]);
      sections.qualifications = description.substring(startIndex, endIndex).trim();
      break;
    }
  }
  
  // Extract benefits
  for (const keyword of benefitKeywords) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      const startIndex = index + keyword.length;
      const endIndex = findSectionEnd(text, startIndex, [...requirementKeywords, ...qualificationKeywords]);
      sections.benefits = description.substring(startIndex, endIndex).trim();
      break;
    }
  }
  
  // Fallback: look for common patterns in the text
  if (!sections.requirements && !sections.qualifications) {
    // Try to extract based on common patterns
    const salaryMatch = text.match(/stipend[:\s]*([^\n]+)/i);
    if (salaryMatch) {
      sections.benefits = salaryMatch[1].trim();
    }
    
    const eligibilityMatch = text.match(/eligibility[:\s]*([^\n]+)/i);
    if (eligibilityMatch) {
      sections.qualifications = eligibilityMatch[1].trim();
    }
    
    const durationMatch = text.match(/duration[:\s]*([^\n]+)/i);
    if (durationMatch) {
      sections.requirements = durationMatch[1].trim();
    }
  }
  
  return sections;
}

// Helper function to find the end of a section
function findSectionEnd(text, startIndex, stopKeywords) {
  let endIndex = text.length;
  
  for (const keyword of stopKeywords) {
    const keywordIndex = text.indexOf(keyword, startIndex);
    if (keywordIndex !== -1 && keywordIndex < endIndex) {
      endIndex = keywordIndex;
    }
  }
  
  return endIndex;
}

// Extract contact information
function extractContactInfo() {
  const contactSelectors = [
    '.job-details-jobs-unified-top-card__primary-description-container a[href*="mailto"]',
    '.jobs-unified-top-card__primary-description-container a[href*="mailto"]',
    'a[href*="mailto"]'
  ];
  
  for (const selector of contactSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.href.replace('mailto:', '');
    }
  }
  return '';
}

// Extract application instructions
function extractApplicationInstructions() {
  const instructionSelectors = [
    '.job-details-jobs-unified-top-card__primary-description-container',
    '.jobs-unified-top-card__primary-description-container'
  ];
  
  for (const selector of instructionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText.trim().toLowerCase();
      if (text.includes('apply') || text.includes('contact') || text.includes('email')) {
        // Extract the relevant portion
        const lines = element.innerText.split('\n');
        const relevantLines = lines.filter(line => {
          const lowerLine = line.toLowerCase();
          return lowerLine.includes('apply') || lowerLine.includes('contact') || lowerLine.includes('email');
        });
        return relevantLines.join(' ').trim();
      }
    }
  }
  return '';
}

// Extract data from full page text as fallback
function extractFromFullPageText() {
  const pageText = document.body.innerText;
  console.log('Full page text extraction - page text length:', pageText.length);
  
  const result = {
    salary: '',
    requirements: '',
    qualifications: '',
    benefits: '',
    location: ''
  };
  
  // Extract salary/stipend
  const salaryPatterns = [
    /stipend[:\s]*([^\n]+)/i,
    /salary[:\s]*([^\n]+)/i,
    /compensation[:\s]*([^\n]+)/i,
    /\$[\d,]+[\s]*-[\s]*\$[\d,]+/i,
    /[\d,]+k[\s]*-[\s]*[\d,]+k/i
  ];
  
  for (const pattern of salaryPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      result.salary = match[0].trim();
      console.log('Found salary pattern:', match[0]);
      break;
    }
  }
  
  // Extract eligibility (qualifications)
  const eligibilityMatch = pageText.match(/eligibility[:\s]*([^\n]+)/i);
  if (eligibilityMatch) {
    result.qualifications = eligibilityMatch[1].trim();
    console.log('Found eligibility:', eligibilityMatch[1]);
  }
  
  // Extract duration (requirements)
  const durationMatch = pageText.match(/duration[:\s]*([^\n]+)/i);
  if (durationMatch) {
    result.requirements = durationMatch[1].trim();
    console.log('Found duration:', durationMatch[1]);
  }
  
  // Extract location from common patterns
  const locationPatterns = [
    /location[:\s]*([^\n]+)/i,
    /remote[\s]*\([^)]+\)/i,
    /greater[\s]+[\w\s]+area/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      result.location = match[0].trim();
      console.log('Found location pattern:', match[0]);
      break;
    }
  }
  
  console.log('Full page text extraction result:', result);
  return result;
}
