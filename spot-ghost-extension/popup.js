document.getElementById('extractBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const button = document.getElementById('extractBtn');
  
  // Show loading state
  button.disabled = true;
  button.textContent = 'Extracting...';
  status.textContent = '🔍 Extracting job data...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a LinkedIn job page
    if (!tab.url.includes('linkedin.com/jobs/')) {
      status.textContent = '❌ Please navigate to a LinkedIn jobs page';
      button.disabled = false;
      button.textContent = 'Analyze This Job';
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, async (response) => {
      if (chrome.runtime.lastError) {
        status.textContent = '❌ Failed to connect to page. Try refreshing.';
        button.disabled = false;
        button.textContent = 'Send to SpotGhost';
        return;
      }
      
      if (!response || !response.title) {
        status.textContent = '❌ Could not extract job data. Try refreshing the page.';
        button.disabled = false;
        button.textContent = 'Send to SpotGhost';
        return;
      }
      
      // Validate extracted data
      if (!response.title.trim() || !response.company.trim() || !response.description.trim()) {
        status.textContent = '❌ Incomplete job data extracted. Try refreshing the page.';
        button.disabled = false;
        button.textContent = 'Send to SpotGhost';
        return;
      }
      
      const job = { 
        ...response, 
        sourceURL: tab.url,
        title: response.title.trim(),
        company: response.company.trim(),
        description: response.description.trim()
      };
      
      // Debug: Log what we're sending
      console.log('Sending job data to API:', {
        title: job.title,
        company: job.company,
        hasLocation: !!job.location,
        hasSalary: !!job.salary,
        hasRequirements: !!job.requirements,
        hasQualifications: !!job.qualifications,
        hasBenefits: !!job.benefits
      });
      
      status.textContent = '📡 Sending to SpotGhost for analysis...';
      
      try {
        // Use localhost for development, change for production
        const apiUrl = 'http://localhost:3000/api/from-extension';
        
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job)
        });
        
        const result = await res.json();
        
        if (res.ok) {
          const analysis = result.analysis;
          const riskEmoji = analysis.riskLevel === 'Critical' || analysis.riskLevel === 'High' ? '🚨' : 
                           analysis.riskLevel === 'Medium' ? '⚠️' : '✅';
          
          const aiStatus = analysis.aiAnalysis ? '🤖 AI Analysis included' : '';
          
          status.innerHTML = `
            ${riskEmoji} Analysis complete!<br>
            <small>Safety Score: ${analysis.safetyScore}/100 (${analysis.riskLevel} Risk)</small><br>
            <small>${analysis.warningCount} warning(s) found</small><br>
            <small style="color: #a855f7;">${aiStatus}</small>
          `;
        } else {
          status.textContent = `❌ API Error: ${result.error || 'Unknown error'}`;
        }
      } catch (fetchError) {
        console.error('Network error:', fetchError);
        status.textContent = '❌ Network error. Is SpotGhost running?';
      }
      
      button.disabled = false;
      button.textContent = 'Send to SpotGhost';
    });
  } catch (error) {
    console.error('Extension error:', error);
    status.textContent = '❌ Extension error occurred';
    button.disabled = false;
    button.textContent = 'Send to SpotGhost';
  }
});
