// Test the extraction issue detection
const testJobData = {
  title: 'Full Stack Developer',
  company: 'WebBoost Solutions by UM',
  location: 'in now By clicking Continue to join or sign in, yo',
  description: 'We are looking for a full stack developer to join our team. Must have experience with JavaScript and Node.js. Great opportunity for growth.',
  applicationUrl: 'https://linkedin.com/jobs/view/123456'
};

// Simple test function to check patterns
function testPatterns() {
  const companyName = testJobData.company;
  const location = testJobData.location.toLowerCase();
  
  console.log('Testing extraction quality patterns:');
  console.log('Company:', companyName);
  console.log('Location:', location);
  
  // Test company pattern 1
  const companyPattern1 = /\b(by|via|through)\s+[A-Z]{2,}\b/i;
  console.log('Company pattern 1 match (by XX):', companyPattern1.test(companyName));
  
  // Test company pattern 2
  const companyPattern2 = /\s+by\s+[A-Z]{1,3}(\s|$)/i;
  console.log('Company pattern 2 match (by X):', companyPattern2.test(companyName));
  
  // Test auth wall indicators
  const authWallIndicators = ['by clicking continue', 'sign in', 'join or sign'];
  const hasAuthWall = authWallIndicators.some(indicator => location.includes(indicator));
  console.log('Auth wall detected in location:', hasAuthWall);
  
  // Test description length
  console.log('Description length:', testJobData.description.length);
  console.log('Is short for LinkedIn?:', testJobData.description.length < 200);
}

testPatterns();
