import dbConnect from '@/lib/dbConnect';
import Job from '@/models/Job';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Simple, reliable job data extraction
async function extractJobDataFromUrl(url) {
  try {
    console.log(`Fetching URL: ${url}`);
    
    // Simple fetch with basic headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Basic extraction - just get what we can easily
    const jobData = {
      title: '',
      company: '',
      location: '',
      description: '',
      salary: '',
      requirements: '',
      contactEmail: '',
      applicationUrl: url
    };
    
    // Try page title first (most reliable)
    const pageTitle = $('title').text().trim();
    if (pageTitle) {
      // LinkedIn: "Company hiring Job Title | LinkedIn"
      const linkedInMatch = pageTitle.match(/(.+?)\s+hiring\s+(.+?)\s+\|/i);
      if (linkedInMatch) {
        jobData.company = linkedInMatch[1].trim();
        jobData.title = linkedInMatch[2].trim();
      }
      // Generic: "Job Title at Company | Site"
      else if (pageTitle.includes(' at ') && pageTitle.includes(' | ')) {
        const parts = pageTitle.split(' | ')[0].split(' at ');
        if (parts.length === 2) {
          jobData.title = parts[0].trim();
          jobData.company = parts[1].trim();
        }
      }
    }
    
    // Fallback: try h1 for title
    if (!jobData.title) {
      const h1 = $('h1').first().text().trim();
      if (h1 && h1.length > 2 && h1.length < 200) {
        jobData.title = h1;
      }
    }
    
    // Get largest text block for description
    let largestText = '';
    $('div, section, article, p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > largestText.length && text.length > 50) {
        largestText = text;
      }
    });
    
    if (largestText && largestText.length > 100) {
      jobData.description = largestText.substring(0, 2000);
    }
    
    // Simple email extraction
    const fullText = $.text();
    const emailMatch = fullText.match(/[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/i);
    if (emailMatch && !emailMatch[0].includes('noreply')) {
      jobData.contactEmail = emailMatch[0];
    }
    
    // Clean extracted data
    Object.keys(jobData).forEach(key => {
      if (jobData[key] && typeof jobData[key] === 'string') {
        jobData[key] = jobData[key].replace(/\s+/g, ' ').trim();
      }
    });
    
    console.log('Extraction results:', {
      title: jobData.title || 'NOT FOUND',
      company: jobData.company || 'NOT FOUND',
      description: jobData.description ? `${jobData.description.length} chars` : 'NOT FOUND'
    });
    
    // If we got nothing useful, provide helpful error
    if (!jobData.title && !jobData.company && !jobData.description) {
      const domain = new URL(url).hostname;
      const needsAuth = fullText.toLowerCase().includes('sign in') || 
                       fullText.toLowerCase().includes('log in');
      
      if (needsAuth) {
        return {
          title: `Authentication Required - ${domain}`,
          company: 'Login Required',
          location: '',
          description: `This job posting requires login to view. Please copy the job details manually and use "Manual Entry" for analysis.`,
          salary: '',
          requirements: '',
          contactEmail: '',
          applicationUrl: url
        };
      } else {
        return {
          title: `Extraction Failed - ${domain}`,
          company: 'Unable to Extract',
          location: '',
          description: `Could not extract job details from ${url}. Please copy the job information manually and use "Manual Entry" for the most accurate analysis.`,
          salary: '',
          requirements: '',
          contactEmail: '',
          applicationUrl: url
        };
      }
    }
    
    return jobData;
    
  } catch (error) {
    console.error('Extraction error:', error.message);
    throw error;
  }
}

// Helper function to clean extracted text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ')
    .trim();
}

// Enhanced function to analyze job data for red flags with improved accuracy
function analyzeJobData(jobData) {
  const userWarnings = []; // User-facing warnings about job authenticity
  const technicalIssues = []; // Backend/extraction issues (shown separately)
  let riskScore = 0;
  const analysis = {
    websiteRisk: 0,
    emailRisk: 0,
    contentRisk: 0,
    structureRisk: 0,
    compensationRisk: 0
  };
  
  // Normalize data for analysis
  const description = (jobData.description || '').toLowerCase();
  const title = (jobData.title || '').toLowerCase();
  const company = (jobData.company || '').toLowerCase();
  const fullText = `${description} ${title} ${company}`;
  
  // 1. WEBSITE/DOMAIN ANALYSIS (Weight: 25%)
  if (jobData.applicationUrl) {
    const url = jobData.applicationUrl.toLowerCase();
    
    // Extract domain for analysis
    let domain = '';
    try {
      domain = new URL(jobData.applicationUrl).hostname.toLowerCase();
    } catch (e) {
      domain = url;
    }
    
    // High-risk domains
    if (url.includes('blogspot') || url.includes('wordpress.com') || url.includes('wix') || 
        url.includes('weebly') || url.includes('squarespace') || url.includes('webnode') ||
        url.includes('jimdo') || url.includes('godaddy') || url.includes('000webhost')) {
      userWarnings.push('⚠️ Job posted on a free website platform - proceed with caution');
      analysis.websiteRisk += 40;
    }
    
    // Check if it's a legitimate job board
    const legitimateJobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com',
      'careerbuilder.com', 'simplyhired.com', 'dice.com', 'stackoverflow.com',
      'angel.co', 'upwork.com', 'freelancer.com', 'flexjobs.com'
    ];
    
    const isLegitimateJobBoard = legitimateJobBoards.some(board => url.includes(board));
    if (isLegitimateJobBoard) {
      analysis.websiteRisk -= 10; // Reduce risk for legitimate platforms
    }
    
    // Shortened URLs (extremely suspicious)
    if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('t.co') || 
        url.includes('short.link') || url.includes('tiny.cc') || url.includes('goo.gl')) {
      userWarnings.push('🚨 Uses a shortened/hidden web address - major red flag');
      analysis.websiteRisk += 50;
    }
    
    // Suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download', '.loan', '.top'];
    if (suspiciousTlds.some(tld => domain.includes(tld))) {
      userWarnings.push('⚠️ Website uses an unusual domain extension often associated with scams');
      analysis.websiteRisk += 30;
    }
    
    // Non-HTTPS for application forms
    if (url.startsWith('http://') && !url.startsWith('https://')) {
      userWarnings.push('⚠️ Website is not secure (no HTTPS) - your data may not be protected');
      analysis.websiteRisk += 20;
    }
    
    // Check for suspicious domain patterns
    if (/\d{4,}/.test(domain) || domain.includes('temp') || domain.includes('test') || 
        domain.includes('staging') || domain.includes('free')) {
      userWarnings.push('⚠️ Website appears to be temporary or suspicious');
      analysis.websiteRisk += 25;
    }
  }
  
  // 2. EMAIL ANALYSIS (Weight: 20%)
  if (jobData.contactEmail) {
    const email = jobData.contactEmail.toLowerCase();
    const domain = email.split('@')[1];
    
    // Free email services
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'mail.com', 'protonmail.com', 'yandex.com', 'icloud.com', 'live.com',
      'msn.com', 'comcast.net', 'verizon.net'
    ];
    
    if (freeEmailDomains.includes(domain)) {
      // Only flag if company looks legitimate (not for small businesses)
      if (company && (company.includes('inc') || company.includes('corp') || 
          company.includes('llc') || company.includes('ltd'))) {
        userWarnings.push('⚠️ Large company using personal email instead of business email');
        analysis.emailRisk += 35;
      } else {
        userWarnings.push('Uses personal email instead of company email (common for small businesses)');
        analysis.emailRisk += 20;
      }
    }
    
    // Suspicious email patterns
    if (email.includes('noreply') || email.includes('no-reply') || email.includes('temp') ||
        email.includes('admin') || email.includes('info') || email.includes('contact')) {
      userWarnings.push('Uses generic email address instead of specific recruiter contact');
      analysis.emailRisk += 15;
    }
    
    // Email domain doesn't match company
    if (jobData.company && domain && !freeEmailDomains.includes(domain)) {
      const companyName = jobData.company.toLowerCase()
        .replace(/[^a-z]/g, '')
        .replace(/(inc|corp|llc|ltd|company|co)$/g, '');
      
      if (companyName.length > 3 && !domain.includes(companyName) && 
          !companyName.includes(domain.split('.')[0])) {
        userWarnings.push('⚠️ Email domain doesn\'t match company name - verify legitimacy');
        analysis.emailRisk += 25;
      }
    }
  } else if (!jobData.applicationUrl || !jobData.applicationUrl.includes('linkedin.com')) {
    // Only flag missing email if not from LinkedIn (which doesn't show emails)
    userWarnings.push('No contact email provided');
    analysis.emailRisk += 10;
  }
  
  // 3. CONTENT ANALYSIS (Weight: 30%)
  
  // Critical scam keywords (very high risk)
  const criticalScamKeywords = [
    'quick money', 'easy money', 'fast cash', 'immediate payment', 'instant income',
    'processing fee', 'training fee', 'background check fee', 'startup fee', 'activation fee',
    'money transfer', 'western union', 'wire transfer', 'cryptocurrency', 'bitcoin',
    'pyramid scheme', 'mlm opportunity', 'multi-level marketing',
    'work from home guaranteed', 'no experience necessary guaranteed income',
    'make $500 per day', 'earn thousands weekly', 'financial freedom'
  ];
  
  const foundCriticalKeywords = criticalScamKeywords.filter(keyword => fullText.includes(keyword));
  if (foundCriticalKeywords.length > 0) {
    userWarnings.push(`🚨 SCAM WARNING: Contains phrases commonly used in job scams (${foundCriticalKeywords.slice(0,3).join(', ')})`);
    analysis.contentRisk += foundCriticalKeywords.length * 30;
  }
  
  // High-risk keywords (context dependent)
  const highRiskKeywords = [
    'urgent hiring', 'immediate start', 'no interview required', 'no questions asked',
    'cash only', 'pay in advance', 'send money', 'deposit required',
    'act now', 'limited time', 'exclusive opportunity'
  ];
  
  const foundHighRiskKeywords = highRiskKeywords.filter(keyword => fullText.includes(keyword));
  if (foundHighRiskKeywords.length > 0) {
    userWarnings.push(`⚠️ Uses high-pressure sales language: ${foundHighRiskKeywords.slice(0,3).join(', ')}`);
    analysis.contentRisk += foundHighRiskKeywords.length * 20;
  }
  
  // Medium-risk keywords (common in legitimate remote work but also scams)
  const mediumRiskKeywords = [
    'work from home', 'remote work', 'flexible schedule', 'part time',
    'data entry', 'customer service', 'online surveys', 'typing work'
  ];
  
  const foundMediumKeywords = mediumRiskKeywords.filter(keyword => fullText.includes(keyword));
  
  // Only flag if multiple medium-risk keywords AND other suspicious indicators
  if (foundMediumKeywords.length > 2) {
    const hasOtherRedFlags = analysis.websiteRisk > 20 || analysis.emailRisk > 20;
    if (hasOtherRedFlags) {
      userWarnings.push(`Multiple work-from-home indicators combined with other warning signs`);
      analysis.contentRisk += foundMediumKeywords.length * 8;
    } else if (foundMediumKeywords.length > 4) {
      userWarnings.push(`Job description uses excessive remote work buzzwords`);
      analysis.contentRisk += 15;
    }
  }
  
  // Grammar and professionalism check
  let unprofessionalCount = 0;
  
  // Check for excessive caps
  const capsMatches = description.match(/[A-Z]{4,}/g);
  if (capsMatches && capsMatches.length > 3) {
    unprofessionalCount++;
  }
  
  // Check for multiple exclamation marks
  const exclamationMatches = description.match(/!{2,}/g);
  if (exclamationMatches && exclamationMatches.length > 1) {
    unprofessionalCount++;
  }
  
  // Check for poor grammar patterns
  const grammarIssues = [
    /\b(there|their|they\'re)\b.*\b(there|their|they\'re)\b/g,
    /\b(your|you\'re)\b.*\b(your|you\'re)\b/g,
    /\b(to|too|two)\b.*\b(to|too|two)\b/g
  ];
  
  grammarIssues.forEach(pattern => {
    const matches = description.match(pattern);
    if (matches && matches.length > 0) unprofessionalCount++;
  });
  
  if (unprofessionalCount > 2) {
    userWarnings.push('Job posting contains unprofessional writing (poor grammar, excessive caps)');
    analysis.contentRisk += 15;
  }
  
  // 4. STRUCTURE ANALYSIS (Weight: 15%)
  
  // Description length analysis (more nuanced)
  const descLength = description.length;
  if (descLength < 50) {
    userWarnings.push('Job description is extremely short - may lack important details');
    analysis.structureRisk += 30;
  } else if (descLength < 150) {
    userWarnings.push('Job description is very brief - request more details about the role');
    analysis.structureRisk += 20;
  } else if (descLength > 3000) {
    userWarnings.push('Unusually long job description - may be copied from multiple sources');
    analysis.structureRisk += 10;
  }
  
  // EXTRACTION QUALITY ANALYSIS - These are technical issues, not job quality issues
  let extractionIssues = [];
  
  // Check for suspicious company names (especially LinkedIn extraction issues)
  if (jobData.company) {
    const companyName = jobData.company;
    
    // Flag suspicious patterns like "Company by X" or "Solutions by XX"
    if (/\b(by|via|through)\s+[A-Z]{2,}\b/i.test(companyName)) {
      technicalIssues.push('Suspicious company name pattern detected (possible extraction error)');
      analysis.structureRisk += 35;
      extractionIssues.push('company name pattern');
    }
    
    // Flag companies with "by" followed by short identifiers
    if (/\s+by\s+[A-Z]{1,3}(\s|$)/i.test(companyName)) {
      technicalIssues.push('Company name contains suspicious "by XX" pattern');
      analysis.structureRisk += 30;
      extractionIssues.push('company name format');
    }
    
    // Flag generic company suffixes that might indicate extraction errors
    const suspiciousCompanySuffixes = [
      'solutions by', 'services by', 'group by', 'consulting by',
      'technologies by', 'systems by', 'network by'
    ];
    
    if (suspiciousCompanySuffixes.some(suffix => companyName.toLowerCase().includes(suffix))) {
      technicalIssues.push('Generic company name with suspicious pattern');
      analysis.structureRisk += 25;
      extractionIssues.push('generic company pattern');
    }
  }
  
  // Check for authentication wall text in location/description
  const authWallIndicators = [
    'by clicking continue', 'sign in', 'create account', 'join or sign',
    'please log in', 'authentication required', 'login required',
    'access denied', 'unauthorized', 'you must be logged in'
  ];
  
  const locationText = (jobData.location || '').toLowerCase();
  const hasAuthWallInLocation = authWallIndicators.some(indicator => 
    locationText.includes(indicator)
  );
  
  if (hasAuthWallInLocation) {
    technicalIssues.push('Location field contains authentication/login text - data extraction may be incomplete');
    analysis.structureRisk += 40;
    extractionIssues.push('authentication wall in location');
  }
  
  const hasAuthWallInDescription = authWallIndicators.some(indicator => 
    description.includes(indicator)
  );
  
  if (hasAuthWallInDescription && description.length < 300) {
    technicalIssues.push('Description contains authentication text - incomplete extraction detected');
    analysis.structureRisk += 25;
    extractionIssues.push('authentication wall in description');
  }
  
  // Check for truncated or incomplete text patterns
  const truncationPatterns = [
    /\.\.\.$/, /\s+(in|at|by|for|and|or|the|a|an)\s*$/i,
    /\s+(continue|click|sign|log|join)\s*$/i
  ];
  
  const isTruncatedLocation = truncationPatterns.some(pattern => 
    pattern.test(jobData.location || '')
  );
  
  if (isTruncatedLocation) {
    technicalIssues.push('Location appears truncated or incomplete');
    analysis.structureRisk += 20;
    extractionIssues.push('truncated location');
  }
  
  // Check for very short descriptions on legitimate platforms (indicates extraction failure)
  const isLegitPlatform = jobData.applicationUrl && 
    (jobData.applicationUrl.includes('linkedin.com') || 
     jobData.applicationUrl.includes('indeed.com'));
     
  if (isLegitPlatform && descLength < 200) {
    technicalIssues.push('Unusually short description for legitimate platform - extraction may have failed');
    analysis.structureRisk += 25;
    extractionIssues.push('short description on legitimate platform');
  }
  
  // Check for navigation/header text contamination
  const navigationIndicators = [
    'home', 'jobs', 'career', 'search', 'filter', 'sort by', 'menu',
    'profile', 'settings', 'help', 'contact us', 'about us', 'privacy',
    'terms', 'cookies', 'browse jobs', 'post a job', 'my account'
  ];
  
  const hasNavigationInTitle = navigationIndicators.some(nav => 
    title.toLowerCase().includes(nav) && title.split(' ').length < 4
  );
  
  if (hasNavigationInTitle) {
    technicalIssues.push('Job title appears to be navigation/header text from website');
    analysis.structureRisk += 30;
    extractionIssues.push('navigation text in title');
  }
  
  // Check if company name looks like a website section rather than actual company
  const websiteSections = ['careers', 'jobs', 'opportunities', 'openings', 'hiring'];
  const companyLowercase = (jobData.company || '').toLowerCase();
  
  if (websiteSections.some(section => companyLowercase === section)) {
    technicalIssues.push('Company field contains website section name instead of actual company');
    analysis.structureRisk += 25;
    extractionIssues.push('website section as company');
  }
  
  // Check for CSS/technical content in job title
  const technicalPatterns = [
    'position:', 'absolute', 'relative', 'fixed', 'static', 'sticky',
    'display:', 'block', 'inline', 'flex', 'grid',
    'color:', 'background:', 'margin:', 'padding:',
    'font-', 'text-', 'border:', 'width:', 'height:'
  ];
  
  const hasTechnicalContent = technicalPatterns.some(pattern => 
    title.toLowerCase().includes(pattern)
  );
  
  if (hasTechnicalContent) {
    technicalIssues.push('Job title contains CSS/technical code - extraction failure detected');
    analysis.structureRisk += 45;
    extractionIssues.push('technical content in title');
  }
  
  // If multiple extraction issues, this is likely a failed extraction
  if (extractionIssues.length >= 2) {
    technicalIssues.push('Multiple extraction issues detected - data may be incomplete or corrupted');
    analysis.structureRisk += 30;
  }
  
  // Missing key information (more specific)
  let missingInfo = [];
  if (!jobData.company || jobData.company.length < 2) missingInfo.push('company name');
  if (!jobData.location && !fullText.includes('remote')) missingInfo.push('location');
  if (!description || description.length < 20) missingInfo.push('meaningful job description');
  if (!jobData.title || jobData.title.length < 3) missingInfo.push('job title');
  
  if (missingInfo.length > 1) {
    userWarnings.push(`Missing important information: ${missingInfo.join(', ')}`);
    analysis.structureRisk += missingInfo.length * 20;
  }
  
  // Critical extraction failure detection
  const hasCompleteExtractionFailure = 
    (!jobData.company || jobData.company.length < 2) &&
    (!description || description.length < 20) &&
    (!jobData.title || jobData.title.length < 10 || jobData.title.includes('position:') || jobData.title.includes('absolute'));
  
  if (hasCompleteExtractionFailure) {
    technicalIssues.push('Complete extraction failure - no meaningful job data could be extracted');
    analysis.structureRisk += 60; // Major penalty for complete failure
    extractionIssues.push('complete extraction failure');
  }
  
  // Vague job titles (context-aware)
  const vagueJobs = ['data entry', 'assistant', 'representative', 'clerk', 'operator'];
  const isVagueJob = vagueJobs.some(job => title.includes(job));
  
  if (isVagueJob && descLength < 200 && !title.includes('senior') && !title.includes('junior')) {
    userWarnings.push('Job title is very general with minimal description - request specific details');
    analysis.structureRisk += 25;
  }
  
  // Check for duplicate/template content
  const commonTemplateWords = ['lorem ipsum', 'placeholder', 'template', 'example'];
  if (commonTemplateWords.some(word => fullText.includes(word))) {
    userWarnings.push('Contains template or placeholder content - may not be a real job posting');
    analysis.structureRisk += 35;
  }
  
  // 5. COMPENSATION ANALYSIS (Weight: 10%)
  if (jobData.salary) {
    const salary = jobData.salary.toLowerCase();
    const salaryNumbers = salary.match(/\d+/g);
    
    // Unrealistic salaries
    if (salary.includes('unlimited') || salary.includes('no limit')) {
      userWarnings.push('🚨 Promises unlimited earnings - classic scam tactic');
      analysis.compensationRisk += 50;
    }
    
    // Check for suspiciously high daily/hourly rates
    if (salaryNumbers) {
      const maxNumber = Math.max(...salaryNumbers.map(Number));
      if ((salary.includes('day') || salary.includes('daily')) && maxNumber > 300) {
        userWarnings.push('⚠️ Daily salary amount seems unrealistic for most legitimate jobs');
        analysis.compensationRisk += 40;
      }
      if ((salary.includes('hour') || salary.includes('hourly')) && maxNumber > 100) {
        userWarnings.push('⚠️ Hourly wage seems unusually high - verify legitimacy');
        analysis.compensationRisk += 35;
      }
    }
    
    // Commission-only with high promises
    if ((salary.includes('commission') || salary.includes('percentage')) && 
        (salary.includes('up to') || salary.includes('earn up to'))) {
      userWarnings.push('Commission-only position with potentially unrealistic earning claims');
      analysis.compensationRisk += 30;
    }
    
    // Vague compensation
    if (salary.includes('competitive') && salary.length < 25) {
      analysis.compensationRisk += 5; // Minor red flag
    }
  } else {
    // Missing salary is only a minor issue for legitimate platforms
    const isLegitPlatform = jobData.applicationUrl && 
      (jobData.applicationUrl.includes('linkedin.com') || 
       jobData.applicationUrl.includes('indeed.com') ||
       jobData.applicationUrl.includes('glassdoor.com'));
    
    if (!isLegitPlatform) {
      userWarnings.push('No salary or compensation information provided');
      analysis.compensationRisk += 15;
    }
  }
  
  // 6. GHOST JOB & DUPLICATE POSTING ANALYSIS (Weight: 15%)
  
  // Check for ghost job indicators
  let ghostJobRisk = 0;
  
  // Generic job descriptions that are often copy-pasted
  const genericJobPhrases = [
    'competitive salary', 'work-life balance', 'dynamic environment', 'fast-paced environment',
    'team player', 'self-starter', 'detail-oriented', 'excellent communication skills',
    'ability to work independently', 'multitask', 'deadline-driven environment',
    'growing company', 'exciting opportunity', 'join our team', 'make a difference'
  ];
  
  const foundGenericPhrases = genericJobPhrases.filter(phrase => description.includes(phrase));
  if (foundGenericPhrases.length > 6) {
    userWarnings.push('Job description is extremely generic - may be a template or fake posting');
    ghostJobRisk += 25;
  } else if (foundGenericPhrases.length > 4) {
    userWarnings.push('Job description uses many generic business buzzwords');
    ghostJobRisk += 15;
  }
  
  // Check for vague requirements that don't match specific skills
  const vagueRequirements = [
    'bachelor\'s degree preferred', 'some experience', 'related experience',
    'equivalent experience', 'preferred qualifications', 'nice to have',
    'plus if you have', 'bonus points', 'ideally you have'
  ];
  
  const foundVagueReqs = vagueRequirements.filter(req => fullText.includes(req));
  if (foundVagueReqs.length > 3) {
    userWarnings.push('Job requirements are very vague - may indicate a non-specific posting');
    ghostJobRisk += 20;
  }
  
  // Check for "always hiring" indicators
  const alwaysHiringIndicators = [
    'always accepting applications', 'ongoing recruitment', 'continuous hiring',
    'we\'re always looking', 'join our talent pool', 'future opportunities',
    'multiple positions available', 'various roles', 'several openings'
  ];
  
  if (alwaysHiringIndicators.some(indicator => fullText.includes(indicator))) {
    userWarnings.push('May be a continuous posting for collecting resumes rather than active hiring');
    ghostJobRisk += 30;
  }
  
  // Check for unrealistic combination of requirements vs. level
  const seniorKeywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'director'];
  const entryKeywords = ['entry level', 'junior', 'graduate', 'new grad', 'recent graduate'];
  const expertiseKeywords = ['expert', 'advanced', '5+ years', '7+ years', '10+ years'];
  
  const hasSeniorTitle = seniorKeywords.some(keyword => title.includes(keyword));
  const hasEntryLevel = entryKeywords.some(keyword => fullText.includes(keyword));
  const requiresExpertise = expertiseKeywords.some(keyword => fullText.includes(keyword));
  
  if (hasEntryLevel && requiresExpertise) {
    userWarnings.push('Contradictory requirements: asks for entry-level but requires years of experience');
    ghostJobRisk += 25;
  }
  
  if (hasSeniorTitle && fullText.includes('entry level')) {
    userWarnings.push('Inconsistent job level: senior position described as entry-level');
    ghostJobRisk += 30;
  }
  
  // Check for suspiciously perfect job descriptions
  const perfectJobIndicators = [
    'dream job', 'perfect opportunity', 'ideal candidate', 'unicorn candidate',
    'rock star', 'ninja', 'guru', 'wizard', 'superhero'
  ];
  
  if (perfectJobIndicators.some(indicator => fullText.includes(indicator))) {
    userWarnings.push('Uses unrealistic "perfect candidate" language');
    ghostJobRisk += 15;
  }
  
  // Check for job description length vs. content ratio
  const meaningfulContentRatio = (description.length - (foundGenericPhrases.join('').length)) / description.length;
  if (meaningfulContentRatio < 0.3 && description.length > 200) {
    userWarnings.push('Most of the job description is generic content with few specific details');
    ghostJobRisk += 20;
  }
  
  // Add ghost job risk to structure risk
  analysis.structureRisk += ghostJobRisk;
  
  // Calculate weighted risk score (Ghost job analysis is included in structure risk)
  riskScore = Math.round(
    (analysis.websiteRisk * 0.25) +
    (analysis.emailRisk * 0.20) +
    (analysis.contentRisk * 0.30) +
    (analysis.structureRisk * 0.15) + // Now includes ghost job detection
    (analysis.compensationRisk * 0.10)
  );
  
  // Apply bonus/penalty modifiers
  
  // Check for critical extraction issues that override platform bonuses
  const hasCriticalExtractionIssues = technicalIssues.some(issue => 
      issue.includes('authentication') || 
      issue.includes('extraction') || 
      issue.includes('company name pattern') ||
      issue.includes('Multiple extraction issues')
  );
  
  // Bonus for legitimate platforms (but not if extraction failed)
  if (jobData.applicationUrl && !hasCriticalExtractionIssues) {
    const legitimatePlatforms = ['linkedin.com', 'indeed.com', 'glassdoor.com'];
    if (legitimatePlatforms.some(platform => jobData.applicationUrl.includes(platform))) {
      riskScore = Math.max(0, riskScore - 15);
    }
  }
  
  // Major penalty for critical extraction issues (even on legitimate platforms)
  if (hasCriticalExtractionIssues) {
    riskScore += 25; // This ensures extraction issues are serious
    // Only add a user warning if extraction completely failed - don't overwhelm with technical details
    if (technicalIssues.some(issue => issue.includes('Complete extraction failure'))) {
      userWarnings.push('⚠️ Unable to extract complete job information - verify details manually');
    }
  }
  
  // Penalty for excessive red flags
  if (userWarnings.length > 5) {
    riskScore += 10;
  }
  
  // Additional penalty for multiple critical issues
  const criticalFlags = userWarnings.filter(flag => flag.includes('🚨')).length;
  if (criticalFlags >= 2) {
    riskScore += 15;
  }
  
  // Cap the risk score at 100
  riskScore = Math.min(100, riskScore);
  
  // Calculate safety score (inverse of risk)
  const safetyScore = Math.max(0, 100 - riskScore);
  
  // Determine risk level with more sensitive thresholds for extraction issues
  let riskLevel;
  if (safetyScore >= 80) riskLevel = 'Very Low';
  else if (safetyScore >= 65) riskLevel = 'Low';
  else if (safetyScore >= 50) riskLevel = 'Medium';
  else if (safetyScore >= 35) riskLevel = 'High';
  else if (safetyScore >= 20) riskLevel = 'Very High';
  else riskLevel = 'Critical';
  
  return {
    safetyScore,
    riskScore,
    riskLevel,
    userWarnings,
    technicalIssues,
    analysis,
    recommendations: generateRecommendations(userWarnings, safetyScore, riskLevel, technicalIssues)
  };
}

// Enhanced function to generate comprehensive recommendations
function generateRecommendations(userWarnings, safetyScore, riskLevel, technicalIssues) {
  const recommendations = [];
  const actionItems = [];
  const warningLevel = safetyScore < 40 ? 'critical' : safetyScore < 60 ? 'high' : 'medium';
  
  // Critical risk recommendations
  if (safetyScore < 40) {
    recommendations.push('🚨 CRITICAL WARNING: This job listing shows multiple red flags indicating a high probability of being a scam');
    recommendations.push('❌ Do NOT provide personal information, SSN, bank details, or any payment');
    recommendations.push('❌ Do NOT download files or click suspicious links from this employer');
    actionItems.push('Report this listing to the job board immediately');
    actionItems.push('Consider reporting to FTC at reportfraud.ftc.gov');
  }
  
  // High risk recommendations
  else if (safetyScore < 60) {
    recommendations.push('⚠️ HIGH RISK: Exercise extreme caution with this job listing');
    recommendations.push('🔍 Thoroughly verify company legitimacy before proceeding');
    recommendations.push('❌ Never provide sensitive information upfront');
  }
  
  // Medium risk recommendations
  else if (safetyScore < 75) {
    recommendations.push('⚠️ MEDIUM RISK: Some concerning elements detected');
    recommendations.push('✅ Verify company details through multiple sources');
  }
  
  // Low risk recommendations
  else {
    recommendations.push('✅ Generally appears legitimate, but always stay vigilant');
  }
  
  // Specific flag-based recommendations
  const flagText = userWarnings.join(' ').toLowerCase();
  
  if (flagText.includes('free email') || flagText.includes('email')) {
    actionItems.push('Contact the company directly through their official website');
    actionItems.push('Verify the email domain matches the company\'s official domain');
  }
  
  if (flagText.includes('website') || flagText.includes('url')) {
    actionItems.push('Research the company on LinkedIn, Better Business Bureau, and Google');
    actionItems.push('Check if the company has an official website and verify the domain');
    actionItems.push('Look up the company on Glassdoor for employee reviews');
  }
  
  if (flagText.includes('scam') || flagText.includes('suspicious language')) {
    actionItems.push('Be extremely wary of any requests for upfront payments');
    actionItems.push('Legitimate employers never ask for money for training, background checks, or equipment');
    actionItems.push('Research common job scam tactics online');
  }
  
  if (flagText.includes('salary') || flagText.includes('compensation')) {
    actionItems.push('Research typical salaries for this role in your area using sites like Glassdoor or PayScale');
    actionItems.push('Be skeptical of compensation that seems too good to be true');
  }
  
  if (flagText.includes('missing') || flagText.includes('short')) {
    actionItems.push('Request additional information about the role and company');
    actionItems.push('Ask for detailed job responsibilities and company background');
  }
  
  if (flagText.includes('generic') || flagText.includes('template') || flagText.includes('ghost')) {
    actionItems.push('Ask specific questions about the role during interviews');
    actionItems.push('Request to speak with the direct hiring manager or team');
    actionItems.push('Look for other employees in this role on LinkedIn');
    actionItems.push('Ask about the specific reason for hiring (replacement vs. growth)');
  }
  
  if (flagText.includes('posted') && (flagText.includes('times') || flagText.includes('frequently'))) {
    actionItems.push('Question why the position is posted so frequently');
    actionItems.push('Ask about average tenure and turnover in this role');
    actionItems.push('Research employee reviews mentioning high turnover');
    actionItems.push('Be cautious - this may indicate poor working conditions');
  }
  
  if (flagText.includes('extraction') || flagText.includes('authentication') || flagText.includes('incomplete') || technicalIssues.length > 0) {
    actionItems.push('⚠️ NOTICE: Data extraction had issues - information may be incomplete');
    actionItems.push('Try accessing the job posting directly through the original website');
    actionItems.push('Contact the company through official channels to verify job details');
    actionItems.push('Use Manual Entry with complete job details for better analysis accuracy');
  }
  
  // Universal safety recommendations
  const universalTips = [
    'Trust your instincts - if something feels wrong, it probably is',
    'Never pay money for a job opportunity, training, or equipment',
    'Research the company thoroughly using multiple sources',
    'Verify job offers through official company channels',
    'Be cautious of jobs requiring minimal qualifications with high pay',
    'Interview should be professional and at a legitimate business location',
    'Legitimate employers provide clear job descriptions and company information',
    'Be wary of companies that constantly post the same job listings',
    'Ghost jobs (fake postings) are used to collect resumes and market research'
  ];
  
  // Add verification checklist based on risk level
  const verificationSteps = [];
  
  if (warningLevel === 'critical' || warningLevel === 'high') {
    verificationSteps.push('🔍 MANDATORY VERIFICATION STEPS:');
    verificationSteps.push('• Search "[Company Name] scam" or "[Company Name] reviews"');
    verificationSteps.push('• Check Better Business Bureau (BBB) rating');
    verificationSteps.push('• Verify company address and phone number');
    verificationSteps.push('• Look up company on LinkedIn and check employee count/activity');
    verificationSteps.push('• Call the company directly using a number from their official website');
  }
  
  return {
    level: warningLevel,
    summary: recommendations,
    actionItems: actionItems,
    verificationSteps: verificationSteps,
    universalTips: universalTips.slice(0, 5), // Limit to 5 most important tips
    additionalResources: [
      'FTC Job Scam Information: consumer.ftc.gov/articles/job-scams',
      'Better Business Bureau Scam Tracker: bbb.org/scamtracker',
      'Indeed Job Scam Guide: indeed.com/career-advice/finding-a-job/job-scam-warning-signs'
    ]
  };
}

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { method, url, ...manualData } = body;
    
    console.log('Analysis request:', { method, url: url || 'manual entry' });
    
    let jobData;
    let analysis;
    
    if (method === 'linkonly' && url) {
      // Link-only analysis without content extraction
      console.log('Performing link-only analysis for URL:', url);
      analysis = analyzeLinkAuthenticity(url);
      
      // Create minimal job data for database storage
      jobData = {
        title: 'Link Analysis Only',
        company: 'Not extracted',
        location: '',
        description: `Link authenticity check performed for: ${url}`,
        salary: '',
        requirements: '',
        contactEmail: '',
        applicationUrl: url
      };
      
      console.log('Link analysis complete. Safety score:', analysis.safetyScore, 'Risk level:', analysis.riskLevel, 'User warnings:', analysis.userWarnings.length);
      
    } else if (method === 'manual') {
      // Use manually entered data
      jobData = {
        title: manualData.jobTitle || '',
        company: manualData.company || '',
        location: manualData.location || '',
        description: manualData.description || '',
        salary: manualData.salary || '',
        requirements: manualData.requirements || '',
        contactEmail: manualData.contactEmail || '',
        applicationUrl: manualData.applicationUrl || ''
      };
      
      console.log('Manual entry data:', {
        title: jobData.title || 'NOT PROVIDED',
        company: jobData.company || 'NOT PROVIDED',
        descriptionLength: jobData.description?.length || 0
      });
    } else {
      return Response.json({ error: 'Invalid method or missing data' }, { status: 400 });
    }
    
    // For link-only analysis, we already have the analysis result
    // For other methods, we need to analyze the job data
    if (method !== 'linkonly') {
      console.log('Starting analysis for job:', jobData.title || 'Unknown');
      
      // Check for duplicate postings before main analysis
      const duplicateCheck = await checkForDuplicatePostings(jobData);
      
      analysis = analyzeJobData(jobData);
      
      // Add duplicate posting flags and risk to the main analysis
      if (duplicateCheck.flags.length > 0) {
        analysis.userWarnings.push(...duplicateCheck.flags);
        analysis.analysis.structureRisk += duplicateCheck.duplicateRisk;
        
        // Recalculate risk score with duplicate data
        const newRiskScore = Math.round(
          (analysis.analysis.websiteRisk * 0.25) +
          (analysis.analysis.emailRisk * 0.20) +
          (analysis.analysis.contentRisk * 0.30) +
          (analysis.analysis.structureRisk * 0.15) +
          (analysis.analysis.compensationRisk * 0.10)
        );
        
        analysis.riskScore = Math.min(100, newRiskScore);
        analysis.safetyScore = Math.max(0, 100 - analysis.riskScore);
        
        // Update risk level with new thresholds
        if (analysis.safetyScore >= 80) analysis.riskLevel = 'Very Low';
        else if (analysis.safetyScore >= 65) analysis.riskLevel = 'Low';
        else if (analysis.safetyScore >= 50) analysis.riskLevel = 'Medium';
        else if (analysis.safetyScore >= 35) analysis.riskLevel = 'High';
        else if (analysis.safetyScore >= 20) analysis.riskLevel = 'Very High';
        else analysis.riskLevel = 'Critical';
      }
      
      console.log('Analysis complete. Safety score:', analysis.safetyScore, 'Risk level:', analysis.riskLevel, 'User warnings:', analysis.userWarnings.length, 'Technical issues:', analysis.technicalIssues.length);
    }
    
    // Save to database (combine user warnings and technical issues for storage)
    const allFlags = [...analysis.userWarnings, ...analysis.technicalIssues];
    
    const job = await Job.create({
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: jobData.description,
      salary: jobData.salary,
      requirements: jobData.requirements,
      email: jobData.contactEmail,
      website: jobData.applicationUrl,
      score: analysis.safetyScore,
      flags: allFlags,
      riskLevel: analysis.riskLevel,
      method: method,
      sourceUrl: url || null
    });

    return Response.json({ 
      success: true, 
      job: {
        id: job._id,
        ...jobData,
        analysis: {
          safetyScore: analysis.safetyScore,
          riskScore: analysis.riskScore,
          riskLevel: analysis.riskLevel,
          userWarnings: analysis.userWarnings,
          technicalIssues: analysis.technicalIssues,
          recommendations: analysis.recommendations,
          // Include detailed breakdown for debugging
          breakdown: analysis.analysis
        }
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze job listing', 
      details: error.message 
    }, { status: 500 });
  }
}

// Function to analyze URL authenticity without content extraction
function analyzeLinkAuthenticity(url) {
  const userWarnings = []; // User-facing warnings about URL safety
  const technicalIssues = []; // Technical URL analysis details
  let riskScore = 0;
  const analysis = {
    domainRisk: 0,
    urlStructureRisk: 0,
    securityRisk: 0,
    reputationRisk: 0
  };
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
    
    // 1. DOMAIN REPUTATION ANALYSIS (Weight: 40%)
    
    // Check for legitimate job boards (POSITIVE indicators)
    const legitimateJobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com',
      'careerbuilder.com', 'simplyhired.com', 'dice.com', 'stackoverflow.com',
      'angel.co', 'upwork.com', 'freelancer.com', 'flexjobs.com', 'jobsdb.com',
      'seek.com', 'jobstreet.com', 'naukri.com', 'shine.com', 'timesjobs.com'
    ];
    
    const isLegitimateJobBoard = legitimateJobBoards.some(board => domain.includes(board));
    if (isLegitimateJobBoard) {
      analysis.reputationRisk -= 30; // Strong positive indicator
      userWarnings.push('✅ Posted on legitimate job board platform');
    } else {
      // Check for suspicious domains
      const suspiciousDomains = [
        'blogspot.com', 'wordpress.com', 'wix.com', 'weebly.com', 'squarespace.com',
        'webnode.com', 'jimdo.com', 'godaddy.com', '000webhost.com', 'freewebhostingarea.com',
        'freehostingnoads.net', 'x10hosting.com', 'awardspace.com', 'bravenet.com'
      ];
      
      if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
        userWarnings.push('⚠️ Job posted on free website platform - proceed with caution');
        analysis.reputationRisk += 45;
      }
      
      // Check for very new or suspicious TLDs
      const suspiciousTlds = [
        '.tk', '.ml', '.ga', '.cf', '.click', '.download', '.loan', '.top',
        '.review', '.party', '.work', '.career', '.jobs', '.bid', '.stream'
      ];
      
      if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
        userWarnings.push('🚨 Website uses suspicious domain extension often associated with scams');
        analysis.reputationRisk += 35;
      }
    }
    
    // 2. URL STRUCTURE ANALYSIS (Weight: 30%)
    
    // Shortened URLs (CRITICAL red flag)
    const shorteners = [
      'bit.ly', 'tinyurl.com', 't.co', 'short.link', 'tiny.cc', 'goo.gl',
      'ow.ly', 'buff.ly', 'is.gd', 'tr.im', 'url.ie', 'x.co', 'soo.gd'
    ];
    
    if (shorteners.some(shortener => domain.includes(shortener))) {
      userWarnings.push('🚨 Uses shortened/hidden web address - major red flag');
      analysis.urlStructureRisk += 60;
    }
    
    // Suspicious domain patterns
    if (/\d{4,}/.test(domain)) {
      userWarnings.push('⚠️ Website address contains suspicious number patterns');
      analysis.urlStructureRisk += 25;
    }
    
    // Check for suspicious keywords in domain
    const suspiciousKeywords = [
      'temp', 'test', 'staging', 'free', 'quick', 'easy', 'money', 'cash',
      'job-scam', 'fake', 'fraud', 'phishing', 'spam'
    ];
    
    if (suspiciousKeywords.some(keyword => domain.includes(keyword))) {
      userWarnings.push('⚠️ Website address contains suspicious keywords');
      analysis.urlStructureRisk += 30;
    }
    
    // Check for excessive subdomains (potential subdomain abuse)
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 2) {
      technicalIssues.push('Unusual subdomain structure detected');
      analysis.urlStructureRisk += 20;
    }
    
    // 3. SECURITY ANALYSIS (Weight: 20%)
    
    // HTTPS check
    if (!url.startsWith('https://')) {
      userWarnings.push('⚠️ Website is not secure (no HTTPS) - your data may not be protected');
      analysis.securityRisk += 30;
    }
    
    // Check for suspicious URL patterns
    if (fullUrl.includes('redirect') || fullUrl.includes('goto') || 
        fullUrl.includes('link.php') || fullUrl.includes('click.php')) {
      userWarnings.push('⚠️ Website uses suspicious redirect patterns');
      analysis.urlStructureRisk += 25;
    }
    
    // Check for IP addresses instead of domains
    if (/\d+\.\d+\.\d+\.\d+/.test(domain)) {
      userWarnings.push('🚨 Uses raw IP address instead of proper domain name - major red flag');
      analysis.securityRisk += 40;
    }
    
    // 4. PATH ANALYSIS (Weight: 10%)
    
    const path = urlObj.pathname.toLowerCase();
    
    // Check for suspicious paths
    const suspiciousPaths = [
      'admin', 'phishing', 'fake', 'scam', 'temp', 'test',
      'download.php', 'get.php', 'go.php', 'click.php'
    ];
    
    if (suspiciousPaths.some(suspPath => path.includes(suspPath))) {
      userWarnings.push('⚠️ Website path contains suspicious elements');
      analysis.urlStructureRisk += 20;
    }
    
    // Check for generic job posting patterns that might indicate mass posting
    if (path.includes('/job/') && /\/job\/\d{1,3}$/.test(path)) {
      technicalIssues.push('Generic job ID pattern detected (may indicate mass posting)');
      analysis.urlStructureRisk += 10;
    }
    
  } catch (urlError) {
    userWarnings.push('🚨 Invalid or malformed web address');
    analysis.urlStructureRisk += 50;
  }
  
  // Calculate weighted risk score
  riskScore = Math.round(
    (analysis.reputationRisk * 0.40) +
    (analysis.urlStructureRisk * 0.30) +
    (analysis.securityRisk * 0.20) +
    (analysis.domainRisk * 0.10)
  );
  
  // Apply bonuses and penalties
  if (userWarnings.some(warning => warning.includes('legitimate job board'))) {
    riskScore = Math.max(0, riskScore - 20);
  }
  
  if (userWarnings.filter(warning => warning.includes('🚨')).length > 1) {
    riskScore += 15; // Penalty for multiple critical issues
  }
  
  // Cap the risk score
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  // Calculate safety score
  const safetyScore = Math.max(0, 100 - riskScore);
  
  // Determine risk level
  let riskLevel;
  if (safetyScore >= 85) riskLevel = 'Very Low';
  else if (safetyScore >= 70) riskLevel = 'Low';
  else if (safetyScore >= 55) riskLevel = 'Medium';
  else if (safetyScore >= 40) riskLevel = 'High';
  else if (safetyScore >= 25) riskLevel = 'Very High';
  else riskLevel = 'Critical';
  
  return {
    safetyScore,
    riskScore,
    riskLevel,
    userWarnings,
    technicalIssues,
    analysis,
    recommendations: generateLinkRecommendations(userWarnings, safetyScore, riskLevel, url, technicalIssues)
  };
}

// Generate recommendations specifically for link-only analysis
function generateLinkRecommendations(userWarnings, safetyScore, riskLevel, url, technicalIssues) {
  const recommendations = [];
  const actionItems = [];
  const warningLevel = safetyScore < 40 ? 'critical' : safetyScore < 60 ? 'high' : 'medium';
  
  // URL-specific recommendations
  if (safetyScore < 40) {
    recommendations.push('🚨 CRITICAL WARNING: This website shows multiple red flags indicating high scam risk');
    recommendations.push('❌ Do NOT click this link or provide any personal information');
    recommendations.push('❌ This appears to be a potentially malicious or fraudulent website');
    actionItems.push('Report this URL to the platform where you found it');
    actionItems.push('Report to anti-phishing organizations');
  } else if (safetyScore < 60) {
    recommendations.push('⚠️ HIGH RISK: This website has concerning characteristics');
    recommendations.push('🔍 Exercise extreme caution before visiting this website');
    recommendations.push('❌ Verify the legitimacy through other channels first');
  } else if (safetyScore < 75) {
    recommendations.push('⚠️ MEDIUM RISK: Some suspicious elements detected in website address');
    recommendations.push('✅ Proceed with caution and verify company independently');
  } else {
    recommendations.push('✅ Website appears legitimate based on address analysis');
    recommendations.push('ℹ️ Remember to still verify job content for red flags');
  }
  
  // Specific URL-based action items
  const flagText = userWarnings.join(' ').toLowerCase();
  
  if (flagText.includes('shortened') || flagText.includes('masked')) {
    actionItems.push('NEVER click shortened URLs from unknown sources');
    actionItems.push('Use URL expanders to see the real destination first');
  }
  
  if (flagText.includes('free website') || flagText.includes('suspicious domain')) {
    actionItems.push('Research the company through official business directories');
    actionItems.push('Look up the company on LinkedIn and verify employee presence');
    actionItems.push('Check Better Business Bureau for company legitimacy');
  }
  
  if (flagText.includes('no https') || flagText.includes('insecure')) {
    actionItems.push('Never enter personal information on non-HTTPS sites');
    actionItems.push('Consider this a major security red flag');
  }
  
  if (flagText.includes('legitimate job board')) {
    actionItems.push('Even on legitimate platforms, verify the specific employer');
    actionItems.push('Check the employer\'s profile and posting history');
  }
  
  // URL verification steps
  const verificationSteps = [
    '🔍 URL VERIFICATION CHECKLIST:',
    '• Check if the domain matches the claimed company',
    '• Look up the domain registration date and details',
    '• Search for "[domain name] scam" or "[domain name] reviews"',
    '• Verify SSL certificate if using HTTPS',
    '• Check if the website has an official "About Us" page'
  ];
  
  if (warningLevel === 'critical' || warningLevel === 'high') {
    verificationSteps.push('• Use VirusTotal or similar services to scan the URL');
    verificationSteps.push('• Check domain reputation on sites like URLVoid');
  }
  
  return {
    level: warningLevel,
    summary: recommendations,
    actionItems: actionItems,
    verificationSteps: verificationSteps,
    universalTips: [
      'Always verify job opportunities through multiple channels',
      'Legitimate companies have professional websites with proper domains',
      'Be extremely wary of URLs that don\'t match the company name',
      'Never click suspicious links from unsolicited job offers',
      'When in doubt, contact the company directly through their official website'
    ],
    additionalResources: [
      'URL Safety Checker: urlscan.io',
      'Domain Information: whois.net',
      'Scam Database: scammer.info',
      'Anti-Phishing Working Group: apwg.org'
    ]
  };
}

// Function to check for duplicate/frequent postings by the same company
async function checkForDuplicatePostings(jobData) {
  try {
    const flags = [];
    let duplicateRisk = 0;
    
    if (!jobData.company || jobData.company.length < 2) {
      return { flags, duplicateRisk };
    }
    
    // Search for similar jobs from the same company in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Clean company name for comparison
    const cleanCompanyName = jobData.company.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const duplicateJobs = await Job.find({
      company: new RegExp(cleanCompanyName, 'i'),
      submittedAt: { $gte: thirtyDaysAgo }
    }).select('title company description submittedAt').lean();
    
    if (duplicateJobs.length > 1) {
      // Check for identical or very similar job titles
      const sameTitleJobs = duplicateJobs.filter(job => {
        const cleanJobTitle = job.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const cleanCurrentTitle = jobData.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        return cleanJobTitle === cleanCurrentTitle;
      });
      
      if (sameTitleJobs.length > 2) {
        flags.push(`Same job title posted ${sameTitleJobs.length} times in 30 days by this company`);
        duplicateRisk += 30;
      }
      
      // Check for very similar descriptions (possible template reuse)
      const similarDescriptions = duplicateJobs.filter(job => {
        if (!job.description || job.description.length < 50) return false;
        
        // Simple similarity check using common words
        const currentWords = new Set(jobData.description.toLowerCase().split(/\s+/));
        const jobWords = new Set(job.description.toLowerCase().split(/\s+/));
        const intersection = new Set([...currentWords].filter(x => jobWords.has(x)));
        const similarity = intersection.size / Math.max(currentWords.size, jobWords.size);
        
        return similarity > 0.7; // 70% similarity threshold
      });
      
      if (similarDescriptions.length > 1) {
        flags.push(`${similarDescriptions.length} very similar job descriptions from this company recently`);
        duplicateRisk += 25;
      }
      
      // Check for excessive posting frequency
      if (duplicateJobs.length > 10) {
        flags.push(`Company has posted ${duplicateJobs.length} jobs in the last 30 days (possible job farm)`);
        duplicateRisk += 40;
      } else if (duplicateJobs.length > 5) {
        flags.push(`Company posts frequently (${duplicateJobs.length} jobs in 30 days)`);
        duplicateRisk += 20;
      }
      
      // Check posting patterns (too frequent posting of same role)
      const postingDates = duplicateJobs.map(job => job.submittedAt).sort();
      let rapidRepostingCount = 0;
      
      for (let i = 1; i < postingDates.length; i++) {
        const daysBetween = (postingDates[i] - postingDates[i-1]) / (1000 * 60 * 60 * 24);
        if (daysBetween < 3) { // Posted within 3 days
          rapidRepostingCount++;
        }
      }
      
      if (rapidRepostingCount > 2) {
        flags.push('Company frequently reposts similar jobs within days (red flag)');
        duplicateRisk += 35;
      }
    }
    
    return { flags, duplicateRisk };
    
  } catch (error) {
    console.error('Error checking for duplicate postings:', error);
    return { flags: [], duplicateRisk: 0 };
  }
}

