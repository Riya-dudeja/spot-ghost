import dbConnect from '@/lib/dbConnect';
import Job from '@/models/Job';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// Handle GET requests for testing
export async function GET(req) {
  console.log('GET request received at /api/jobs/analyze');
  return NextResponse.json({ message: 'Analyze API is working', timestamp: new Date().toISOString() });
}

// Handle POST requests for job analysis
export async function POST(req) {
  console.log('POST request received at /api/jobs/analyze');
  try {
    const requestData = await req.json();
    console.log('Request data:', requestData);
    const { url, method } = requestData;
    
    let analysisResult;
    
    // Handle different analysis methods
    if (method === 'manual') {
      // Manual/extension job data entry: Only return Gemini's verdict and summary
      const jobData = {
        title: requestData.jobTitle,
        company: requestData.company,
        location: requestData.location,
        salary: requestData.salary,
        description: requestData.description,
        requirements: requestData.requirements,
        contactEmail: requestData.contactEmail,
        applicationUrl: requestData.applicationUrl
      };

      let geminiAI = null;
      let verdict = null;
      let summary = null;
      let text = '';
      try {
        geminiAI = await analyzeJobWithAI(jobData);
        if (geminiAI?.analysis) {
          text = geminiAI.analysis;
          verdict = geminiAI.verdict || null;
          summary = geminiAI.summary || null;
        }
      } catch (e) {
        console.warn('Gemini AI analysis for manual job failed:', e.message);
      }

      // Classic analysis
      const classic = analyzeJob(jobData);

      analysisResult = {
        job: {
          ...jobData,
          classicAnalysis: {
            safetyScore: classic.safetyScore,
            riskScore: classic.riskScore,
            riskLevel: classic.riskLevel,
            redFlags: classic.warnings,
            greenFlags: classic.greenFlags,
            recommendations: classic.recommendations
          },
          aiAnalysis: geminiAI ? {
            verdict: geminiAI.verdict,
            confidence: geminiAI.confidence,
            summary: geminiAI.summary,
            redFlags: geminiAI.red_flags,
            greenFlags: geminiAI.green_flags,
            companyAnalysis: geminiAI.company_analysis,
            jobDescriptionAnalysis: geminiAI.job_description_analysis,
            contactAnalysis: geminiAI.contact_analysis,
            otherNotes: geminiAI.other_notes,
            raw: geminiAI.analysis
          } : null
        },
        professionalSummary: generateProfessionalSummary(classic, geminiAI)
      };
    } else if (method === 'linkonly') {
      // For link-only, run classic analysis and return results
      analysisResult = await analyzeURL(url);
    } else if (method === 'link') {
      // For auto-fill URL, prompt user to use extension for full AI analysis
      analysisResult = {
        message: 'Please use the SpotGhost extension to extract job details for a full AI-powered analysis.'
      };
    } else if (method === 'linkedin' || method === 'url') {
      // For legacy/other modes, fallback to classic analysis
      analysisResult = await analyzeURL(url);
    } else {
      throw new Error('Invalid analysis method');
    }

    return NextResponse.json({ ...analysisResult, method });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Generate recommendations based on analysis
function generateRecommendations(warnings, safetyScore, riskLevel) {
  const recommendations = {
    summary: [],
    actionItems: [],
    verificationSteps: []
  };

  if (riskLevel === 'Critical' || riskLevel === 'High') {
    recommendations.summary.push('🚨 High risk job posting - proceed with extreme caution');
    recommendations.actionItems.push('Do not provide personal information or payment');
    recommendations.actionItems.push('Research the company thoroughly before applying');
  } else if (riskLevel === 'Medium') {
    recommendations.summary.push('⚠️ Some red flags detected - verify before applying');
    recommendations.actionItems.push('Research the company and verify contact information');
  } else {
    recommendations.summary.push('✅ Appears to be a legitimate job posting');
  }

  // Add verification steps
  recommendations.verificationSteps.push('Check the company website directly');
  recommendations.verificationSteps.push('Look up company reviews on Glassdoor');
  recommendations.verificationSteps.push('Verify the job posting on official company careers page');
  recommendations.verificationSteps.push('Be cautious of any requests for upfront payment');

  return recommendations;
}

// Core job analysis function
export function analyzeJob(jobData) {
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

  // 4. Website analysis
  if (jobData.applicationUrl) {
    const url = jobData.applicationUrl.toLowerCase();

    // Free website platforms
    if (url.includes('blogspot') || url.includes('wordpress.com') || url.includes('wix')) {
      warnings.push('⚠️ Job posted on free website platform');
      riskScore += 35;
    } else {
      greenFlags.push('Job not posted on a free website platform.');
    }

    // Shortened URLs
    if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('t.co')) {
      warnings.push('🚨 Uses shortened/hidden web address - major red flag');
      riskScore += 50;
    } else {
      greenFlags.push('No shortened or hidden web address detected.');
    }

    // Non-HTTPS
    if (url.startsWith('http://')) {
      warnings.push('⚠️ Website is not secure (no HTTPS)');
      riskScore += 20;
    } else if (url.startsWith('https://')) {
      greenFlags.push('Website uses secure HTTPS connection.');
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
    } else {
      greenFlags.push('Salary/compensation appears realistic.');
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
  } else {
    greenFlags.push('All key job information is present.');
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
    greenFlags,
    recommendations: generateRecommendations(warnings, safetyScore, riskLevel)
  };
}

// Professional summary generator for frontend display
function generateProfessionalSummary(classic, geminiAI) {
  let summary = '';
  if (classic.riskLevel === 'Very Low') {
    summary += '✅ This job posting appears to be legitimate based on our automated checks.';
    if (classic.greenFlags && classic.greenFlags.length > 0) {
      summary += '\n\n**Positive signals:**\n- ' + classic.greenFlags.join('\n- ');
    }
  } else {
    summary += '⚠️ This job posting has some risk factors:';
    if (classic.warnings && classic.warnings.length > 0) {
      summary += '\n\n**Red flags:**\n- ' + classic.warnings.join('\n- ');
    }
  }
  if (geminiAI && geminiAI.verdict) {
    summary += `\n\n**Gemini AI verdict:** ${geminiAI.verdict}`;
    if (geminiAI.summary) {
      summary += `\n${geminiAI.summary}`;
    }
    if (geminiAI.red_flags && geminiAI.red_flags.length > 0) {
      summary += '\n\n**AI-identified red flags:**\n- ' + geminiAI.red_flags.join('\n- ');
    }
    if (geminiAI.green_flags && geminiAI.green_flags.length > 0) {
      summary += '\n\n**AI-identified positive signals:**\n- ' + geminiAI.green_flags.join('\n- ');
    }
  }
  return summary.trim();
}

// Gemini AI analysis with structured prompt and robust JSON parsing
export async function analyzeJobWithAI(jobData) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const prompt = `You are an expert fraud detection agent for online job listings. Analyze the provided job details and return your findings in the following JSON format:

{
  "verdict": "LEGITIMATE | SUSPICIOUS | FRAUDULENT",
  "confidence": "0-100",
  "summary": "A concise summary of your reasoning.",
  "red_flags": ["List specific red flags with evidence from the job data."],
  "green_flags": ["List specific positive signals with evidence from the job data."],
  "company_analysis": "Is the company real, established, and reputable? Reference any evidence.",
  "job_description_analysis": "Is the job description realistic and detailed? Reference any evidence.",
  "contact_analysis": "Is the contact information professional and matching the company domain?",
  "other_notes": "Any other relevant observations."
}

Here are the job details:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || 'N/A'}
Job Type: ${jobData.jobType || 'N/A'}
Experience Level: ${jobData.experienceLevel || 'N/A'}
Salary/Compensation: ${jobData.salary || 'N/A'}
Company Size: ${jobData.companySize || 'N/A'}
Posted Date: ${jobData.postedDate || 'N/A'}
Application Deadline: ${jobData.applicationDeadline || 'N/A'}
Source URL: ${jobData.applicationUrl || 'N/A'}

Job Description:
${jobData.description}

Requirements:
${jobData.requirements || 'N/A'}

Qualifications:
${jobData.qualifications || 'N/A'}

Benefits:
${jobData.benefits || 'N/A'}

Contact Info:
${jobData.contactEmail || 'N/A'}

Application Instructions:
${jobData.applicationInstructions || 'N/A'}

Be as specific as possible, reference the job data directly, and do not provide generic statements. Only output valid JSON.`;
  
  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    const response = await axios.post(endpoint, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parsed = null;
    try {
      // Find the first JSON object in the response (in case Gemini adds text before/after)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (jsonErr) {
      // Parsing failed, fallback to raw text
      parsed = null;
    }
    if (parsed) {
      return {
        analysis: raw,
        hasContent: true,
        verdict: parsed.verdict,
        confidence: parsed.confidence,
        summary: parsed.summary,
        red_flags: parsed.red_flags,
        green_flags: parsed.green_flags,
        company_analysis: parsed.company_analysis,
        job_description_analysis: parsed.job_description_analysis,
        contact_analysis: parsed.contact_analysis,
        other_notes: parsed.other_notes
      };
    } else {
      return {
        analysis: raw,
        hasContent: raw.length > 0
      };
    }
  } catch (error) {
    console.error('Gemini AI analysis error:', error.message);
    if (error.response) {
      console.error('Gemini API response status:', error.response.status);
      console.error('Gemini API response data:', error.response.data);
    }
    return null;
  }
}

// Enhanced URL analysis with Gemini AI integration
async function analyzeURL(url) {
  const warnings = [];
  let riskScore = 0;
  let domain = 'unknown';
  let geminiAnalysis = null; // Declare outside try block

  let isLegitimate = false;

  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.toLowerCase();

    // 1. Basic URL structure analysis
    const legitimateJobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com'
    ];
    isLegitimate = legitimateJobBoards.some(board => domain.includes(board));
    if (isLegitimate) {
      warnings.push('✅ Posted on legitimate job board');
      // Always set perfect safety score for major job boards
      riskScore = 0;
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

    // 2. Gemini AI analysis (if API key is set)
    if (process.env.API_KEY) {
      try {
        console.log('Analyzing URL with Gemini AI:', url);
        const geminiResult = await analyzeWithGemini(url);
        if (geminiResult && geminiResult.hasContent) {
          geminiAnalysis = geminiResult.analysis;
          warnings.push('🤖 AI Analysis available - see detailed report');
        }
      } catch (geminiError) {
        console.warn('Gemini API analysis failed:', geminiError.message);
      }
    } else {
      console.warn('Gemini API key not configured');
    }

    // 3. URLScan.io analysis (if not a major job board to avoid rate limits)
    if (!isLegitimate) {
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
      }
    }
  } catch (error) {
    warnings.push('🚨 Invalid or malformed URL');
    riskScore += 50;
  }

  // Calculate scores
  riskScore = Math.min(100, Math.max(0, riskScore));
  let safetyScore = Math.max(0, 100 - riskScore);
  // For legitimate job boards, always set safetyScore to 100
  if (isLegitimate) safetyScore = 100;

  // Risk level
  let riskLevel;
  if (safetyScore >= 80) riskLevel = 'Very Low';
  else if (safetyScore >= 65) riskLevel = 'Low';
  else if (safetyScore >= 50) riskLevel = 'Medium';
  else if (safetyScore >= 35) riskLevel = 'High';
  else riskLevel = 'Critical';

  return {
    job: {
      title: 'URL Analysis',
      company: domain,
      description: `Analysis of ${url}`,
      analysis: {
        safetyScore,
        riskScore,
        riskLevel,
        warnings,
        recommendations: generateRecommendations(warnings, safetyScore, riskLevel),
        aiAnalysis: geminiAnalysis // Include the full Gemini analysis
      }
    }
  };
}

// Gemini API integration (for URL analysis)
async function analyzeWithGemini(jobUrl) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const prompt = `You are a job fraud detection expert. Analyze this job posting URL for potential fraud, scam, or suspicious activity. Provide a comprehensive analysis covering:

**COMPANY VERIFICATION:**
- Research the company name and verify if it's legitimate
- Check if this is a known company with an established online presence
- Look for red flags like generic company names or suspicious company descriptions
- Verify if the company domain matches the job posting domain

**JOB POSTING ANALYSIS:**
- Analyze if this appears to be a duplicate or template job posting
- Check for generic job descriptions with minimal specific details
- Look for unrealistic salary promises or compensation structure
- Identify vague job requirements or responsibilities
- Check for urgent hiring language or pressure tactics

**FRAUD INDICATORS:**
- Look for common scam patterns (work-from-home schemes, payment requests, etc.)
- Check for suspicious contact methods (personal emails, non-business phones)
- Identify requests for personal information, fees, or upfront payments
- Look for multi-level marketing or pyramid scheme indicators
- Check for poor grammar, spelling, or unprofessional language

**DOMAIN & URL ANALYSIS:**
- Analyze the domain reputation and legitimacy
- Check for suspicious URL patterns or redirects
- Verify if it's posted on legitimate job boards vs suspicious sites
- Look for shortened URLs or suspicious domain extensions

**OVERALL ASSESSMENT:**
Provide a clear verdict: LEGITIMATE, SUSPICIOUS, or FRAUDULENT with specific reasoning.

URL to analyze: ${jobUrl}

Respond with detailed findings for each section above, highlighting specific red flags found.`;
  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    const response = await axios.post(endpoint, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    // Get Gemini's actual analysis
    const analysis = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Return the full analysis instead of trying to parse artificial scores
    return {
      analysis: analysis,
      hasContent: analysis.length > 0
    };
  } catch (error) {
    console.error('Gemini API error:', error.message);
    if (error.response) {
      console.error('Gemini API response status:', error.response.status);
      console.error('Gemini API response data:', error.response.data);
    }
    return null;
  }
}

// URLScan.io integration
// Note: urlscan.io public API does NOT require an API key for basic scans.
async function scanURLWithURLScan(url) {
  try {
    // Submit URL for scanning (public endpoint, no API key)
    const submitResponse = await axios.post('https://urlscan.io/api/v1/scan/', {
      url: url,
      visibility: 'public' // Use public scans
    }, {
      headers: {
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
    if (result.page && result.page.domainAgeDays !== undefined) {
      if (result.page.domainAgeDays < 30) {
        analysis.newDomain = true;
      }
    }

    return analysis;
  } catch (error) {
    console.warn('URLScan.io analysis failed:', error.message);
    return {
      malicious: false,
      suspicious: false,
      phishing: false,
      newDomain: false
    };
  }
}