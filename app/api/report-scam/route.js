export async function POST(req) {
  try {
    const { jobTitle, company, url, reason, analysis } = await req.json();

    // Log the scam report (you can enhance this to save to database)
    console.log('Scam Report Received:', {
      jobTitle,
      company,
      url,
      reason,
      timestamp: new Date().toISOString(),
      analysis: analysis ? 'included' : 'not included'
    });

    // Here you could save to your database
    // await Report.create({ jobTitle, company, url, reason, analysis, type: 'scam' });

    return Response.json({ 
      success: true, 
      message: 'Scam report submitted successfully' 
    });

  } catch (error) {
    console.error('Report scam error:', error);
    return Response.json({ 
      error: 'Failed to submit report' 
    }, { status: 500 });
  }
}
