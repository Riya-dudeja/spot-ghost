import dbConnect from '@/lib/dbConnect';
import Job from '@/models/Job';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced job analysis using Gemini AI
async function analyzeJobWithGemini(jobData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const analysisPrompt = `
You are an expert job fraud detection system. Analyze this job posting for potential scams or red flags.

Job Details:
- Title: ${jobData.title || 'Not provided'}
- Company: ${jobData.company || 'Not provided'}
- Location: ${jobData.location || 'Not provided'}
- Salary: ${jobData.salary || 'Not provided'}
- Description: ${jobData.description || 'Not provided'}
- Requirements: ${jobData.requirements || 'Not provided'}
- Contact Email: ${jobData.contactEmail || 'Not provided'}
- Application URL: ${jobData.applicationUrl || 'Not provided'}

Please provide a comprehensive fraud analysis in the following JSON format:
{
  "riskScore": <number 0-100>,
  "riskLevel": "<Very Low|Low|Medium|High|Critical>",
  "safetyScore": <number 0-100>,
  "warnings": [
    "<specific warning messages>"
  ],
  "redFlags": [
    "<specific red flag descriptions>"
  ],
  "legitimacyIndicators": [
    "<positive indicators if any>"
  ],
  "confidenceScore": <number 0-100>,
  "reasoning": "<detailed explanation of the analysis>",
  "scamType": "<type of scam if detected, or 'none'>",
  "recommendations": [
    "<specific actionable recommendations>"
  ]
}

Focus on:
1. Common job scam patterns (upfront payments, unrealistic salaries, vague descriptions)
2. Language patterns typical of scammers (urgency, poor grammar, generic content)
3. Company legitimacy indicators
4. Contact information authenticity
5. Job posting quality and professionalism
6. Salary vs. role mismatch
7. Application process red flags

Be thorough but balanced - don't flag legitimate jobs as scams.
`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the response
        return {
          safetyScore: Math.max(0, Math.min(100, analysis.safetyScore || 100 - analysis.riskScore)),
          riskScore: Math.max(0, Math.min(100, analysis.riskScore || 0)),
          riskLevel: analysis.riskLevel || 'Medium',
          warnings: analysis.warnings || [],
          redFlags: analysis.redFlags || [],
          legitimacyIndicators: analysis.legitimacyIndicators || [],
          confidenceScore: analysis.confidenceScore || 50,
          reasoning: analysis.reasoning || 'Analysis completed',
          scamType: analysis.scamType || 'none',
          recommendations: analysis.recommendations || [],
          aiAnalysis: true
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Fall back to rule-based analysis
      return analyzeJobFallback(jobData);
    }
    
    // If no JSON found, fall back to rule-based analysis
    return analyzeJobFallback(jobData);
    
  } catch (error) {
    console.error('Gemini AI analysis failed:', error);
    // Fall back to rule-based analysis
    return analyzeJobFallback(jobData);
  }
}

// Fallback rule-based analysis (improved version of original)
function analyzeJobFallback(jobData) {
  const warnings = [];
  const redFlags = [];
  const legitimacyIndicators = [];
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
    'make $500 per day', 'earn thousands weekly', 'financial freedom',
    'work from home no experience', 'guaranteed income', 'no selling required'
  ];
  
  const foundCriticalPhrases = criticalScamPhrases.filter(phrase => fullText.includes(phrase));
  if (foundCriticalPhrases.length > 0) {
    redFlags.push(`Contains common scam phrases: ${foundCriticalPhrases.slice(0, 3).join(', ')}`);
    warnings.push('🚨 CRITICAL: This job posting contains language commonly used in employment scams');
    riskScore += foundCriticalPhrases.length * 35;
  }
  
  // 2. High-pressure tactics
  const highPressurePhrases = [
    'urgent hiring', 'immediate start', 'no interview required',
    'cash only', 'pay in advance', 'act now', 'limited time',
    'first come first serve', 'must decide today'
  ];
  
  const foundHighPressure = highPressurePhrases.filter(phrase => fullText.includes(phrase));
  if (foundHighPressure.length > 0) {
    warnings.push(`⚠️ Uses high-pressure language: ${foundHighPressure.slice(0, 2).join(', ')}`);
    riskScore += foundHighPressure.length * 20;
  }
  
  // 3. Salary analysis
  if (jobData.salary) {
    const salary = jobData.salary.toLowerCase();
    
    if (salary.includes('unlimited') || salary.includes('no limit')) {
      redFlags.push('Promises unlimited earnings');
      warnings.push('🚨 Promises unlimited earnings - classic scam tactic');
      riskScore += 40;
    }
    
    // Check for unrealistic rates
    const salaryNumbers = salary.match(/\$?\d+/g);
    if (salaryNumbers) {
      const maxNumber = Math.max(...salaryNumbers.map(n => parseInt(n.replace('$', ''))));
      if (salary.includes('day') && maxNumber > 400) {
        warnings.push('⚠️ Daily salary seems unrealistic for the role');
        riskScore += 30;
      }
      if (salary.includes('hour') && maxNumber > 150) {
        warnings.push('⚠️ Hourly wage seems unusually high');
        riskScore += 25;
      }
    }
  }
  
  // 4. Email analysis
  if (jobData.contactEmail) {
    const email = jobData.contactEmail.toLowerCase();
    const domain = email.split('@')[1];
    
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'
    ];
    
    if (freeEmailDomains.includes(domain)) {
      if (company.includes('corp') || company.includes('inc') || company.includes('llc')) {
        warnings.push('⚠️ Large company using personal email instead of business email');
        riskScore += 25;
      }
    }
  }
  
  // 5. Missing information analysis
  const missingInfo = [];
  if (!jobData.company || jobData.company.length < 2) missingInfo.push('company name');
  if (!jobData.description || jobData.description.length < 50) missingInfo.push('detailed job description');
  if (!jobData.title || jobData.title.length < 3) missingInfo.push('clear job title');
  
  if (missingInfo.length > 1) {
    warnings.push(`Missing key information: ${missingInfo.join(', ')}`);
    riskScore += missingInfo.length * 20;
  }
  
  // 6. Legitimacy indicators
  if (jobData.company && jobData.company.length > 10) {
    legitimacyIndicators.push('Provides detailed company name');
  }
  if (jobData.description && jobData.description.length > 200) {
    legitimacyIndicators.push('Includes comprehensive job description');
  }
  if (jobData.requirements && jobData.requirements.length > 50) {
    legitimacyIndicators.push('Lists specific job requirements');
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
    redFlags,
    legitimacyIndicators,
    confidenceScore: 70, // Lower confidence for rule-based
    reasoning: 'Analysis completed using rule-based detection (AI analysis unavailable)',
    scamType: riskScore > 70 ? 'potential-fraud' : 'none',
    recommendations: generateRecommendations(warnings, safetyScore, riskLevel),
    aiAnalysis: false
  };
}

// Enhanced URL analysis with Gemini AI
async function analyzeURLWithGemini(url) {
  const warnings = [];
  let riskScore = 0;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Basic URL structure analysis first
    const legitimateJobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 
      'ziprecruiter.com', 'careerbuilder.com', 'dice.com'
    ];
    
    const isLegitimate = legitimateJobBoards.some(board => domain.includes(board));
    if (isLegitimate) {
      warnings.push('✅ Posted on legitimate job board');
      riskScore -= 30;
    }
    
    // Use Gemini AI for URL analysis
    if (process.env.GEMINI_API_KEY && !isLegitimate) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const urlPrompt = `
Analyze this URL for potential job scam indicators: ${url}

Consider:
1. Domain reputation and age indicators
2. URL structure and suspicious patterns
3. Known scam website characteristics
4. Suspicious TLDs or domain patterns
5. Shortened URL usage
6. Free hosting platform usage

Provide analysis in JSON format:
{
  "riskScore": <0-100>,
  "warnings": ["<warning messages>"],
  "isSuspicious": <true/false>,
  "reasoning": "<explanation>"
}
`;

        const result = await model.generateContent(urlPrompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const urlAnalysis = JSON.parse(jsonMatch[0]);
          riskScore += urlAnalysis.riskScore || 0;
          warnings.push(...(urlAnalysis.warnings || []));
        }
      } catch (aiError) {
        console.warn('Gemini URL analysis failed:', aiError.message);
      }
    }
    
    // Fallback URL checks
    const suspiciousDomains = ['blogspot.com', 'wordpress.com', 'wix.com'];
    if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
      warnings.push('⚠️ Posted on free website platform');
      riskScore += 30;
    }
    
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co'];
    if (shorteners.some(shortener => domain.includes(shortener))) {
      warnings.push('🚨 Shortened URL - major red flag');
      riskScore += 50;
    }
    
    if (!url.startsWith('https://')) {
      warnings.push('⚠️ Not secure (no HTTPS)');
      riskScore += 20;
    }
    
  } catch (error) {
    warnings.push('🚨 Invalid or malformed URL');
    riskScore += 40;
  }
  
  // Calculate scores
  riskScore = Math.min(100, Math.max(0, riskScore));
  const safetyScore = Math.max(0, 100 - riskScore);
  
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
    recommendations: generateRecommendations(warnings, safetyScore, riskLevel),
    aiAnalysis: process.env.GEMINI_API_KEY ? true : false
  };
}

// Generate actionable recommendations
function generateRecommendations(warnings, safetyScore, riskLevel) {
  const recommendations = [];
  const actionItems = [];
  
  if (safetyScore < 40) {
    recommendations.push('🚨 HIGH RISK: This job shows multiple red flags');
    recommendations.push('❌ Do NOT provide personal information or payment');
    actionItems.push('Report this listing to the job board');
    actionItems.push('Consider reporting to FTC at reportfraud.ftc.gov');
    actionItems.push('Block the sender if contacted directly');
  } else if (safetyScore < 65) {
    recommendations.push('⚠️ MEDIUM RISK: Exercise caution');
    recommendations.push('🔍 Verify company legitimacy before proceeding');
    actionItems.push('Research the company thoroughly');
    actionItems.push('Contact company through official website');
  } else {
    recommendations.push('✅ Appears legitimate, but stay vigilant');
    actionItems.push('Still verify company details independently');
  }
  
  // Universal safety tips
  const universalTips = [
    'Never pay money for job opportunities',
    'Legitimate employers don\'t ask for upfront payments',
    'Research the company using multiple sources',
    'Trust your instincts - if something feels wrong, it probably is'
  ];
  
  return {
    level: safetyScore < 40 ? 'critical' : safetyScore < 65 ? 'high' : 'medium',
    summary: recommendations,
    actionItems: actionItems.slice(0, 6),
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
      // URL-only analysis
      analysis = await analyzeURLWithGemini(url);
      
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
      // Manual entry analysis with Gemini AI
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
      
      // Use Gemini AI for comprehensive analysis
      analysis = await analyzeJobWithGemini(jobData);
      
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
      sourceUrl: url || null,
      aiAnalyzed: analysis.aiAnalysis || false,
      confidenceScore: analysis.confidenceScore || 50
    });

    console.log('Analysis complete:', { 
      safetyScore: analysis.safetyScore, 
      riskLevel: analysis.riskLevel, 
      warningCount: analysis.warnings.length,
      aiAnalysis: analysis.aiAnalysis
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
          redFlags: analysis.redFlags || [],
          legitimacyIndicators: analysis.legitimacyIndicators || [],
          recommendations: analysis.recommendations,
          confidenceScore: analysis.confidenceScore,
          reasoning: analysis.reasoning,
          scamType: analysis.scamType,
          aiAnalysis: analysis.aiAnalysis
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