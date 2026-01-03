import dbConnect from '@/lib/dbConnect';
import Job from '@/models/Job';

// Import the analysis functions from the main analyze route
import { analyzeJob, analyzeJobWithAI, generateRecommendations } from '../jobs/analyze/route.js';

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { 
      title, 
      company, 
      description, 
      sourceURL, 
      location, 
      salary, 
      jobType, 
      experienceLevel, 
      companySize, 
      requirements, 
      qualifications, 
      benefits, 
      jobInsights, 
      applicationDeadline, 
      postedDate, 
      contactInfo, 
      applicationInstructions 
    } = body;
    
    console.log('Extension job received:', { 
      title: title?.substring(0, 50), 
      company, 
      sourceURL,
      hasExtendedData: !!(salary || requirements || qualifications || location || jobType || benefits),
      receivedFields: {
        location: !!location,
        salary: !!salary,
        jobType: !!jobType,
        requirements: !!requirements,
        qualifications: !!qualifications,
        benefits: !!benefits
      }
    });
    
    // Validate required fields
    if (!title || !company || !description || !sourceURL) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['title', 'company', 'description', 'sourceURL']
      }, { status: 400 });
    }
    
    // Prepare comprehensive job data for analysis
    const jobData = {
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      location: (location || '').trim(),
      salary: (salary || '').trim(),
      jobType: (jobType || '').trim(),
      experienceLevel: (experienceLevel || '').trim(),
      companySize: (companySize || '').trim(),
      requirements: (requirements || '').trim(),
      qualifications: (qualifications || '').trim(),
      benefits: (benefits || '').trim(),
      jobInsights: (jobInsights || '').trim(),
      applicationDeadline: (applicationDeadline || '').trim(),
      postedDate: (postedDate || '').trim(),
      contactEmail: (contactInfo || '').trim(),
      applicationUrl: sourceURL,
      applicationInstructions: (applicationInstructions || '').trim()
    };
    
    // Analyze the job with traditional methods
    const analysis = analyzeJob(jobData);
    
    // Get AI analysis with the actual job content
    let aiAnalysis = null;
    try {
      console.log('Running AI analysis on job content...');
      const aiResult = await analyzeJobWithAI(jobData);
      if (aiResult && aiResult.hasContent) {
        aiAnalysis = aiResult.analysis;
        console.log('AI analysis completed successfully');
      }
    } catch (aiError) {
      console.warn('AI analysis failed:', aiError.message);
    }
    
    // Save to database with analysis results
    // Note: Extension doesn't have auth, so we'll use a default user or skip saving
    // For now, we'll require auth or return analysis without saving
    const { verifyAuth } = await import('@/lib/auth');
    const user = await verifyAuth();
    
    if (!user) {
      // Return analysis without saving if not authenticated
      console.log('Extension request without auth - returning analysis only');
      return Response.json({ 
        success: true,
        message: 'Job analyzed successfully (not saved - please login)',
        analysis: {
          safetyScore: analysis.safetyScore,
          riskLevel: analysis.riskLevel,
          warnings: analysis.warnings,
          greenFlags: analysis.greenFlags,
          recommendations: analysis.recommendations
        },
        aiAnalysis: aiAnalysis
      });
    }
    
    const job = await Job.create({
      userId: user.userId,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: jobData.description,
      salary: jobData.salary,
      requirements: jobData.requirements,
      email: jobData.contactEmail,
      website: jobData.applicationUrl,
      score: analysis.safetyScore,
      flags: analysis.warnings, // Note: using 'flags' field as per Job model
      riskLevel: analysis.riskLevel,
      method: 'extension',
      sourceUrl: sourceURL
    });

    console.log('Extension analysis complete:', { 
      safetyScore: analysis.safetyScore, 
      riskLevel: analysis.riskLevel, 
      warningCount: analysis.warnings.length 
    });

    return Response.json({ 
      success: true,
      message: 'Job analyzed and saved successfully',
      jobId: job._id,
      analysis: {
        safetyScore: analysis.safetyScore,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        warnings: analysis.warnings,
        warningCount: analysis.warnings.length,
        recommendations: analysis.recommendations,
        aiAnalysis: aiAnalysis // Include the AI analysis
      }
    });
    
  } catch (error) {
    console.error('Extension API error:', error);
    return Response.json({ 
      error: 'Failed to process job data',
      details: error.message 
    }, { status: 500 });
  }
}
