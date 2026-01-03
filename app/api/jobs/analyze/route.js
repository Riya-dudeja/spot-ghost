import dbConnect from '@/lib/dbConnect';
import Job from '@/models/Job';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/lib/auth';

// Handle GET requests for testing
export async function GET(req) {
  console.log('GET request received at /api/jobs/analyze');
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const legacyKey = process.env.API_KEY;
  
  // Test Gemini API connection
  let geminiTest = 'Not tested';
  let geminiError = null;
  
  try {
    if (geminiKey) {
      console.log('Testing Gemini API with student account key...');
      const { GoogleGenAI } = await import('@google/genai');
      const genAI = new GoogleGenAI({});  // Auto-detects GEMINI_API_KEY from env
      
      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Just say "Hello from Gemini!"'
      });
      geminiTest = 'SUCCESS: ' + result.text;
    } else {
      geminiTest = 'No GEMINI_API_KEY found';
    }
  } catch (error) {
    console.error('Gemini API test error:', error.message);
    console.error('Full error:', error);
    geminiError = error.message;
    geminiTest = 'ERROR: ' + error.message;
  }
  
  return NextResponse.json({ 
    message: 'Analyze API is working', 
    timestamp: new Date().toISOString(),
    hasGeminiApiKey: !!geminiKey,
    hasLegacyApiKey: !!legacyKey,
    geminiKeyLength: geminiKey ? geminiKey.length : 0,
    nodeEnv: process.env.NODE_ENV,
    geminiTest: geminiTest,
    geminiError: geminiError
  });
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

      // Identify missing fields for UI display
      const missingFields = [];
      if (!jobData.company || jobData.company.length < 2 || jobData.company === 'Unknown Company') {
        missingFields.push('Company Name');
      }
      if (!jobData.description || jobData.description.length < 50) {
        missingFields.push('Job Description');
      }
      if (!jobData.title || jobData.title.length < 3 || jobData.title === 'Unknown Job') {
        missingFields.push('Job Title');
      }
      if (!jobData.location || jobData.location === 'Unknown Location' || jobData.location.length < 3) {
        missingFields.push('Location');
      }
      // Only flag missing application URL if we don't have a valid URL from a major platform
      const hasValidApplicationUrl = jobData.applicationUrl && 
        (jobData.applicationUrl.startsWith('http') || jobData.applicationUrl.includes('.com'));
      if (!hasValidApplicationUrl) {
        missingFields.push('Application Link');
      }

      let geminiAI = null;
      let verdict = null;
      let summary = null;
      let text = '';
      try {
        console.log('🤖 Attempting Gemini AI analysis with API key configured:', !!process.env.API_KEY);
        console.log('📝 Job data for AI analysis:', {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description?.substring(0, 100) + '...',
          hasContactEmail: !!jobData.contactEmail,
          fullJobData: jobData
        });
        
        console.log('🚀 Calling analyzeJobWithAI function...');
        geminiAI = await analyzeJobWithAI(jobData);
        console.log('🔍 Gemini AI analysis result type:', typeof geminiAI);
        console.log('🔍 Gemini AI result keys:', geminiAI ? Object.keys(geminiAI) : 'null');
        console.log('🔍 Gemini AI has real analysis:', !!(geminiAI && geminiAI.verdict && !geminiAI.analysis?.includes('Fallback')));
        
        if (geminiAI?.analysis) {
          text = geminiAI.analysis;
          verdict = geminiAI.verdict || null;
          summary = geminiAI.summary || null;
          console.log('✅ Using real Gemini AI analysis with verdict:', verdict, 'summary length:', summary?.length || 0);
        } else {
          console.log('⚠️ Gemini AI returned null or empty analysis, geminiAI object:', geminiAI);
        }
      } catch (e) {
        console.error('❌ Gemini AI analysis for manual job failed:', e.message);
        console.error('Full error stack:', e.stack);
      }

      // If Gemini AI failed, create a fallback AI analysis based on classic analysis
      if (!geminiAI) {
        console.log('Creating enhanced fallback AI analysis since Gemini AI failed');
        const classic = analyzeJob(jobData, { skipMissingPenalty: true });
        
        // Generate more sophisticated AI-style analysis
        let verdict = 'LEGITIMATE';
        let confidence = 70;
        let aiSummary = '';
        let companyAnalysis = '';
        let jobDescAnalysis = '';
        let contactAnalysis = '';
        let recommendations = [];
        
        // Determine verdict based on risk level
        if (classic.riskLevel === 'Very Low') {
          verdict = 'LEGITIMATE';
          confidence = 90;
          aiSummary = `This job posting demonstrates strong legitimacy indicators. The job description is well-structured with specific technical requirements, realistic salary expectations, and professional presentation. No significant red flags detected in the content analysis.`;
        } else if (classic.riskLevel === 'Low') {
          verdict = 'LEGITIMATE';
          confidence = 80;
          aiSummary = `This appears to be a legitimate job posting with minor areas of concern. The overall structure and content suggest a real employment opportunity, though some details could be more specific.`;
        } else if (classic.riskLevel === 'Medium') {
          verdict = 'SUSPICIOUS';
          confidence = 65;
          aiSummary = `This job posting contains mixed signals that warrant careful evaluation. While some elements appear legitimate, there are concerning aspects that suggest proceeding with caution and additional verification.`;
        } else {
          verdict = 'FRAUDULENT';
          confidence = 85;
          aiSummary = `This job posting exhibits multiple characteristics commonly associated with fraudulent or scam listings. The content analysis reveals significant red flags that strongly suggest this is not a legitimate employment opportunity.`;
        }
        
        // Generate specific analysis sections
        companyAnalysis = jobData.company ? 
          `Company "${jobData.company}" requires independent verification. ${classic.riskLevel === 'Very Low' || classic.riskLevel === 'Low' ? 'Company name appears professional and realistic.' : 'Company legitimacy should be thoroughly researched before proceeding.'}` :
          'No company information provided, which is a significant red flag for legitimate employment opportunities.';
        
        jobDescAnalysis = jobData.description ? 
          `Job description analysis reveals ${classic.riskLevel.toLowerCase()} risk indicators. ${classic.greenFlags.includes('Job description is specific and detailed.') ? 'Content is specific and includes relevant technical details.' : 'Description may lack sufficient detail or contain concerning language patterns.'}` :
          'Insufficient job description provided for comprehensive analysis.';
        
        contactAnalysis = jobData.contactEmail ? 
          `Contact information provided: ${jobData.contactEmail}. ${jobData.contactEmail.includes('@gmail.com') || jobData.contactEmail.includes('@yahoo.com') ? 'Using personal email domain rather than business domain.' : 'Email domain appears professional.'}` :
          'No direct contact information provided, which may indicate lower legitimacy.';
        
        // Generate recommendations
        recommendations = [
          'Research the company independently through their official website',
          'Verify the job posting on the company\'s official careers page',
          'Look up company reviews on platforms like Glassdoor or Indeed',
          'Be cautious of any requests for upfront payments or personal financial information',
          'Validate the contact information through official company channels'
        ];
        
        if (classic.riskLevel === 'Medium' || classic.riskLevel === 'High' || classic.riskLevel === 'Critical') {
          recommendations.unshift('Exercise extreme caution - this posting shows significant risk indicators');
          recommendations.push('Consider this posting potentially fraudulent until verified');
        }

        geminiAI = {
          verdict: verdict,
          confidence: confidence,
          summary: aiSummary,
          red_flags: classic.warnings || [],
          green_flags: classic.greenFlags || [],
          company_analysis: companyAnalysis,
          job_description_analysis: jobDescAnalysis,
          contact_analysis: contactAnalysis,
          recommendations: recommendations,
          other_notes: 'Analysis completed using advanced rule-based AI detection system. For enhanced accuracy, consider upgrading to full AI analysis.',
          analysis: `Enhanced Analysis: ${aiSummary}`
        };
        
        console.log('✅ Created enhanced fallback AI analysis with verdict:', verdict);
      }

      // Classic analysis (no missing field penalty for manual)
      const classic = analyzeJob(jobData, { skipMissingPenalty: true });

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
            domainAnalysis: geminiAI.domain_analysis,
            recommendations: geminiAI.recommendations,
            otherNotes: geminiAI.other_notes,
            raw: geminiAI.analysis
          } : null,
          missingFields // For UI to display as a separate section
        },
        professionalSummary: generateProfessionalSummary(classic, geminiAI)
      };

      console.log('📤 Final analysis result being sent to frontend:');
      console.log('- Has aiAnalysis:', !!analysisResult.job.aiAnalysis);
      console.log('- aiAnalysis verdict:', analysisResult.job.aiAnalysis?.verdict);
      console.log('- aiAnalysis summary length:', analysisResult.job.aiAnalysis?.summary?.length || 0);
      console.log('- Full aiAnalysis keys:', analysisResult.job.aiAnalysis ? Object.keys(analysisResult.job.aiAnalysis) : 'null');
    } else if (method === 'linkonly') {
      // For link-only, run classic analysis and return results
      analysisResult = await analyzeURL(url);
    } else if (method === 'link') {
      // For auto-fill URL, prompt user to use extension for full AI analysis
      analysisResult = {
        job: {
          title: 'Extension Required',
          company: 'SpotGhost',
          description: 'Please use the SpotGhost browser extension for full analysis',
          extensionPrompt: true
        },
        message: 'Please use the SpotGhost extension to extract job details for a full AI-powered analysis.'
      };
    } else if (method === 'linkedin' || method === 'url') {
      // For legacy/other modes, fallback to classic analysis
      analysisResult = await analyzeURL(url);
    } else {
      throw new Error('Invalid analysis method');
    }

    // Save the analyzed job to database if user is authenticated
    await dbConnect();
    const user = await verifyAuth();
    
    console.log('💾 Attempting to save job - User authenticated:', !!user);
    console.log('💾 Has analysisResult.job:', !!analysisResult?.job);
    console.log('💾 Is extension prompt:', !!analysisResult?.job?.extensionPrompt);
    
    if (!user) {
      console.log('⚠️ Job not saved - user not authenticated');
    } else if (!analysisResult.job) {
      console.log('⚠️ Job not saved - no job data in analysis result');
    } else if (analysisResult.job.extensionPrompt) {
      console.log('⚠️ Job not saved - extension prompt placeholder');
    }
    
    if (user && analysisResult.job && !analysisResult.job.extensionPrompt) {
      try {
        const savedJob = await Job.create({
          userId: user.userId,
          title: analysisResult.job.title || 'Unknown Job',
          company: analysisResult.job.company || 'Unknown Company',
          location: analysisResult.job.location || 'Unknown Location',
          description: analysisResult.job.description || '',
          salary: analysisResult.job.salary || '',
          requirements: analysisResult.job.requirements || '',
          email: analysisResult.job.contactEmail || '',
          website: analysisResult.job.applicationUrl || url || '',
          score: analysisResult.job.classicAnalysis?.safetyScore || 0,
          flags: analysisResult.job.classicAnalysis?.redFlags || [],
          riskLevel: analysisResult.job.classicAnalysis?.riskLevel || 'Medium',
          aiVerdict: analysisResult.job.aiAnalysis?.verdict || null,
          aiSummary: analysisResult.job.aiAnalysis?.summary || null,
          aiConfidence: analysisResult.job.aiAnalysis?.confidence || null,
          method: method,
          sourceUrl: url || ''
        });
        console.log('✅ Job saved to database with ID:', savedJob._id);
        analysisResult.jobId = savedJob._id;
        analysisResult.saved = true;
      } catch (saveError) {
        console.error('❌ Failed to save job to database:', saveError.message);
        console.error('Full error:', saveError);
        analysisResult.saveError = saveError.message;
      }
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
export function analyzeJob(jobData, opts = {}) {
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

    // Check if it's a major job platform (these are legitimate by default)
    const majorJobPlatforms = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 
      'ziprecruiter.com', 'careerbuilder.com', 'jobs.google.com'
    ];
    
    const isOnMajorPlatform = majorJobPlatforms.some(platform => url.includes(platform));
    
    if (isOnMajorPlatform) {
      greenFlags.push('Job posted on reputable job platform.');
      
      // Add specific positive feedback for different platforms
      if (url.includes('linkedin.com')) {
        greenFlags.push('LinkedIn requires company verification for job postings.');
      } else if (url.includes('indeed.com')) {
        greenFlags.push('Indeed has fraud prevention measures in place.');
      } else if (url.includes('glassdoor.com')) {
        greenFlags.push('Glassdoor requires employer verification for job posts.');
      }
      
      // Don't penalize jobs on major platforms
    } else {
      // Free website platforms (only flag if not on major job boards)
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
  } else {
    // Only flag missing application URL if it's not from a major platform
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
  // Only flag missing application URL if we don't have a valid URL from a major platform
  const hasValidApplicationUrl = jobData.applicationUrl && 
    (jobData.applicationUrl.startsWith('http') || jobData.applicationUrl.includes('.com'));
  if (!hasValidApplicationUrl) {
    missingInfo.push('application link');
  }

  // Only warn if missing 1+ critical pieces of information
  if (missingInfo.length >= 1) {
    if (!opts.skipMissingPenalty) {
      warnings.push(`Missing key information: ${missingInfo.join(', ')}`);
      riskScore += missingInfo.length * 20; // Reduced penalty but still significant
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

  // Calculate final scores
  riskScore = Math.min(100, riskScore);
  const safetyScore = Math.max(0, 100 - riskScore);

  // Determine risk level - made more strict
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

// Enhanced Gemini AI analysis with intelligent company research
export async function analyzeJobWithAI(jobData) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log('🔑 Checking API keys...');
  console.log('🔑 GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);
  console.log('🔑 Legacy API_KEY available:', !!process.env.API_KEY);
  console.log('🔑 Using key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');
  
  if (!apiKey) {
    console.log('❌ No API key configured');
    return null;
  }

  try {
    console.log('🤖 Performing intelligent AI analysis with company research...');
    console.log('🌐 Initializing Google GenAI client...');
    const genAI = new GoogleGenAI({});  // Auto-detects GEMINI_API_KEY from env
    
    const intelligentPrompt = `You are an expert job fraud detection agent with comprehensive knowledge of companies, industries, and job market patterns. Before analyzing the job posting, you must first research and verify the company background using your knowledge base.

ANALYSIS PROCESS:
1. COMPANY RESEARCH & VERIFICATION (Do this first):
   - Use your knowledge to identify if this is a real, established company
   - Check if the company name matches known legitimate businesses
   - Assess company reputation, industry standing, and public presence
   - Identify if it's a Fortune 500, publicly traded, or well-known private company
   - Look for red flags in company naming patterns (generic names, suspicious keywords)
   - Evaluate domain/website legitimacy if provided
   - Cross-reference company industry with job description

2. JOB CONTENT ANALYSIS:
   - Analyze job description quality and authenticity
   - Check for scam language patterns and unrealistic promises
   - Evaluate salary appropriateness for role and location
   - Assess contact information professionalism
   - Verify job requirements align with company type

3. INTEGRATED ASSESSMENT:
   - Combine company research findings with job content analysis
   - Provide final verdict based on comprehensive evaluation

Return your findings in this JSON format:

{
  "verdict": "LEGITIMATE | SUSPICIOUS | FRAUDULENT",
  "confidence": "0-100",
  "summary": "A comprehensive summary that leads with your company research findings, then job analysis (3-4 sentences)",
  "red_flags": ["List specific red flags from company research AND job content"],
  "green_flags": ["List specific positive signals from company research AND job content"],
  "company_analysis": "Detailed company research results - is this a real, established company? Include specific details about company type, industry, reputation",
  "job_description_analysis": "Analysis of job description quality, authenticity, and alignment with company profile",
  "contact_analysis": "Analysis of contact information professionalism and company alignment",
  "domain_analysis": "Website/domain legitimacy assessment if URL provided",
  "recommendations": ["Specific actionable recommendations based on complete research and analysis"]
}

JOB DETAILS TO ANALYZE:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || 'N/A'}
Salary/Compensation: ${jobData.salary || 'N/A'}
Application URL: ${jobData.applicationUrl || 'N/A'}

Job Description:
${jobData.description}

Requirements:
${jobData.requirements || 'N/A'}

Contact Info:
${jobData.contactEmail || 'N/A'}

CRITICAL INSTRUCTIONS:
- Start with thorough company research using your knowledge base
- If you recognize the company as legitimate (Fortune 500, well-known tech company, established corporation), weight this heavily in your analysis
- If the company is unknown or has suspicious naming patterns, be more skeptical
- Provide specific, evidence-based reasoning that references your company knowledge
- Cross-reference all job details with your company research findings
- Be comprehensive but concise in your analysis

Only output valid JSON.`;

    console.log('📤 Sending intelligent research request to Gemini 2.5 Flash...');
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: intelligentPrompt
    });
    
    console.log('📥 Intelligent Gemini response received');
    const raw = result.text;
    console.log('📝 Raw Gemini response (first 200 chars):', raw.substring(0, 200));    let parsed = null;
    try {
      // Find the first JSON object in the response (in case Gemini adds text before/after)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (jsonErr) {
      console.warn('⚠️ Failed to parse Gemini response as JSON:', jsonErr.message);
      parsed = null;
    }
    
    if (parsed) {
      console.log('✅ Successfully parsed intelligent Gemini JSON response');
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
        domain_analysis: parsed.domain_analysis,
        recommendations: parsed.recommendations,
        other_notes: parsed.other_notes
      };
    } else {
      console.log('⚠️ Failed to parse intelligent Gemini response as JSON, returning raw text');
      return {
        analysis: raw,
        hasContent: raw.length > 0
      };
    }
  } catch (error) {
    console.error('❌ Intelligent Gemini AI analysis error:', error.message);
    console.error('Error details:', error);
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
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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