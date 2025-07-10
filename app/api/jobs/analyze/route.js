import dbConnect from '@/lib/dbConnect';
import Job from '@/models/Job';
import axios from 'axios';

// Core job analysis function
function analyzeJob(jobData) {
  const warnings = [];
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
    }
  }
  
  // 4. Website analysis
  if (jobData.applicationUrl) {
    const url = jobData.applicationUrl.toLowerCase();
    
    // Free website platforms
    if (url.includes('blogspot') || url.includes('wordpress.com') || url.includes('wix')) {
      warnings.push('⚠️ Job posted on free website platform');
      riskScore += 35;
    }
    
    // Shortened URLs
    if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('t.co')) {
      warnings.push('🚨 Uses shortened/hidden web address - major red flag');
      riskScore += 50;
    }
    
    // Non-HTTPS
    if (url.startsWith('http://')) {
      warnings.push('⚠️ Website is not secure (no HTTPS)');
      riskScore += 20;
    }
  }
  
  // 5. Compensation red flags
  if (jobData.salary) {
    const salary = jobData.salary.toLowerCase();
    
    if (salary.includes('unlimited') || salary.includes('no limit')) {
      warnings.push('🚨 Promises unlimited earnings - classic scam tactic');
      riskScore += 50;
    }
    
    // Unrealistic daily/hourly rates
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
    }
  }
  
  // 6. Missing information
  const missingInfo = [];
  if (!jobData.company || jobData.company.length < 2) missingInfo.push('company name');
  if (!jobData.description || jobData.description.length < 50) missingInfo.push('job description');
  if (!jobData.title || jobData.title.length < 3) missingInfo.push('job title');
  
  if (missingInfo.length > 1) {
    warnings.push(`Missing key information: ${missingInfo.join(', ')}`);
    riskScore += missingInfo.length * 25;
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
  }
  
  // Calculate final scores
  riskScore = Math.min(100, riskScore);
  const safetyScore = Math.max(0, 100 - riskScore);
  
  // Determine risk level
  let riskLevel;
  if (safetyScore >= 80) riskLevel = 'Very Low';
  else if (safetyScore >= 65) riskLevel = 'Low';
  else if (safetyScore >= 50) riskLevel = 'Medium';
  else if (safetyScore >= 35) riskLevel = 'High';
  else riskLevel = 'Critical';
  
  return {
    safetyScore,
    riskScore,
    riskLevel,
    warnings,
    recommendations: generateRecommendations(warnings, safetyScore, riskLevel)
  };
}

// Enhanced URL analysis with URLScan.io integration
async function analyzeURL(url) {
  const warnings = [];
  let riskScore = 0;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // 1. Basic URL structure analysis
    // Legitimate job boards
    const legitimateJobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com'
    ];
    
    const isLegitimate = legitimateJobBoards.some(board => domain.includes(board));
    if (isLegitimate) {
      warnings.push('✅ Posted on legitimate job board');
      riskScore -= 20;
    } else {
      // Suspicious domains
      const suspiciousDomains = ['blogspot.com', 'wordpress.com', 'wix.com'];
      if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
        warnings.push('⚠️ Posted on free website platform');
        riskScore += 40;
      }
      
      // Suspicious TLDs
      const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
      if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
        warnings.push('🚨 Suspicious domain extension');
        riskScore += 35;
      }
    }
    
    // Shortened URLs
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co'];
    if (shorteners.some(shortener => domain.includes(shortener))) {
      warnings.push('🚨 Shortened URL - major red flag');
      riskScore += 60;
    }
    
    // HTTPS check
    if (!url.startsWith('https://')) {
      warnings.push('⚠️ Not secure (no HTTPS)');
      riskScore += 25;
    }
    
    // 2. URLScan.io analysis (if not a major job board to avoid rate limits)
    if (!isLegitimate && process.env.URLSCAN_API_KEY) {
      try {
        console.log('Running URLScan.io analysis for:', domain);
        const scanResult = await scanURLWithURLScan(url);
        
        if (scanResult.malicious) {
          warnings.push('🚨 URL flagged as malicious by security scan');
          riskScore += 80;
        }
        
        if (scanResult.suspicious) {
          warnings.push('⚠️ URL shows suspicious characteristics');
          riskScore += 40;
        }
        
        if (scanResult.phishing) {
          warnings.push('🚨 Possible phishing site detected');
          riskScore += 70;
        }
        
        if (scanResult.newDomain) {
          warnings.push('⚠️ Very new domain (recently registered)');
          riskScore += 30;
        }
        
      } catch (scanError) {
        console.warn('URLScan.io analysis failed:', scanError.message);
        // Don't fail the whole analysis if URLScan fails
      }
    }
    
  } catch (error) {
    warnings.push('🚨 Invalid or malformed URL');
    riskScore += 50;
  }
  
  // Calculate scores
  riskScore = Math.min(100, Math.max(0, riskScore));
  const safetyScore = Math.max(0, 100 - riskScore);
  
  // Risk level
  let riskLevel;
  if (safetyScore >= 80) riskLevel = 'Very Low';
  else if (safetyScore >= 65) riskLevel = 'Low';
  else if (safetyScore >= 50) riskLevel = 'Medium';
  else if (safetyScore >= 35) riskLevel = 'High';
  else riskLevel = 'Critical';
  
  return {
    safetyScore,
    riskScore,
    riskLevel,
    warnings,
    recommendations: generateRecommendations(warnings, safetyScore, riskLevel)
  };
}

// URLScan.io integration
async function scanURLWithURLScan(url) {
  const apiKey = process.env.URLSCAN_API_KEY;
  
  if (!apiKey) {
    throw new Error('URLScan.io API key not configured');
  }
  
  try {
    // Submit URL for scanning
    const submitResponse = await axios.post('https://urlscan.io/api/v1/scan/', {
      url: url,
      visibility: 'private' // Keep scans private
    }, {
      headers: {
        'API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const scanId = submitResponse.data.uuid;
    
    // Wait a moment for scan to complete
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Get scan results
    const resultResponse = await axios.get(`https://urlscan.io/api/v1/result/${scanId}/`, {
      timeout: 10000
    });
    
    const result = resultResponse.data;
    
    // Analyze the results
    const analysis = {
      malicious: false,
      suspicious: false,
      phishing: false,
      newDomain: false
    };
    
    // Check verdicts
    if (result.verdicts) {
      analysis.malicious = result.verdicts.overall?.malicious || false;
      analysis.suspicious = result.verdicts.overall?.suspicious || false;
      
      // Check for phishing indicators
      if (result.verdicts.engines) {
        analysis.phishing = Object.values(result.verdicts.engines).some(engine => 
          engine.categories?.includes('phishing') || 
          engine.categories?.includes('malicious')
        );
      }
    }
    
    // Check domain age
    if (result.page?.domain) {
      const domainInfo = result.page.domain;
      if (domainInfo.creation_date) {
        const creationDate = new Date(domainInfo.creation_date);
        const daysSinceCreation = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
        analysis.newDomain = daysSinceCreation < 30; // Less than 30 days old
      }
    }
    
    console.log('URLScan.io analysis result:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('URLScan.io API error:', error.message);
    
    // If rate limited or temporary error, return neutral result
    if (error.response?.status === 429) {
      console.warn('URLScan.io rate limit reached');
    }
    
    throw error;
  }
}

// Generate actionable recommendations
function generateRecommendations(warnings, safetyScore, riskLevel) {
  const recommendations = [];
  const actionItems = [];
  
  // Risk-based main recommendations
  if (safetyScore < 40) {
    recommendations.push('🚨 HIGH RISK: This job shows multiple red flags');
    recommendations.push('❌ Do NOT provide personal information or payment');
    actionItems.push('Report this listing to the job board');
    actionItems.push('Consider reporting to FTC at reportfraud.ftc.gov');
  } else if (safetyScore < 65) {
    recommendations.push('⚠️ MEDIUM RISK: Exercise caution');
    recommendations.push('🔍 Verify company legitimacy before proceeding');
    actionItems.push('Research the company thoroughly');
  } else {
    recommendations.push('✅ Appears legitimate, but stay vigilant');
  }
  
  // Specific action items based on warnings
  const warningText = warnings.join(' ').toLowerCase();
  
  if (warningText.includes('scam')) {
    actionItems.push('Never pay money for job opportunities');
    actionItems.push('Research common job scam tactics');
  }
  
  if (warningText.includes('email')) {
    actionItems.push('Contact company through official website');
    actionItems.push('Verify email domain matches company');
  }
  
  if (warningText.includes('website') || warningText.includes('url')) {
    actionItems.push('Check company on LinkedIn and BBB');
    actionItems.push('Verify company has legitimate website');
  }
  
  // Universal safety tips
  const universalTips = [
    'Trust your instincts - if something feels wrong, it probably is',
    'Never pay money for training, equipment, or background checks',
    'Research the company using multiple sources',
    'Legitimate employers provide clear job details and company info'
  ];
  
  return {
    level: safetyScore < 40 ? 'critical' : safetyScore < 65 ? 'high' : 'medium',
    summary: recommendations,
    actionItems: actionItems.slice(0, 6), // Limit to 6 most relevant
    universalTips: universalTips
  };
}

// Main API handler
export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { method, url, ...manualData } = body;
    
    console.log('Analysis request:', { method, url: url || 'manual entry' });
    
    let jobData;
    let analysis;
    
    if (method === 'linkonly' && url) {
      // URL-only analysis with URLScan.io
      analysis = await analyzeURL(url);
      
      jobData = {
        title: 'Link Analysis Only',
        company: 'Not extracted',
        location: '',
        description: `URL safety check for: ${url}`,
        salary: '',
        requirements: '',
        contactEmail: '',
        applicationUrl: url
      };
      
    } else if (method === 'manual') {
      // Manual entry analysis
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
      
      analysis = analyzeJob(jobData);
      
    } else {
      return Response.json({ error: 'Invalid method or missing data' }, { status: 400 });
    }
    
    // Save to database
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
      flags: analysis.warnings,
      riskLevel: analysis.riskLevel,
      method: method,
      sourceUrl: url || null
    });

    console.log('Analysis complete:', { 
      safetyScore: analysis.safetyScore, 
      riskLevel: analysis.riskLevel, 
      warningCount: analysis.warnings.length 
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
          warnings: analysis.warnings,
          recommendations: analysis.recommendations
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