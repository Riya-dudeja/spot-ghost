"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ReportPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobLink: '',
    description: '',
    contactEmail: ''
  });
  const [status, setStatus] = useState(null);
  const [extensionData, setExtensionData] = useState(null);
  const [isExtensionAccess, setIsExtensionAccess] = useState(false);

  // Check for extension data on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const jobData = urlParams.get('job');
    
    if (source === 'extension') {
      setIsExtensionAccess(true);
      
      if (jobData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(jobData));
          setExtensionData(parsed);
          // Pre-fill form with extension data
          setFormData(prev => ({
            ...prev,
            jobTitle: parsed.title || '',
            company: parsed.company || '',
            jobLink: parsed.url || ''
          }));
        } catch (error) {
          console.error('Failed to parse extension data:', error);
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
      setFormData({ jobTitle: '', company: '', jobLink: '', description: '', contactEmail: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  // Content component
  const ReportContent = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          {extensionData ? 'Analysis Results & Report' : 'Submit Ghost Job Report'}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {extensionData 
            ? 'Review the analysis results from the extension and submit a report if needed.'
            : 'Help SpotGhost by flagging suspicious or ghost job listings. Fill out the form below to submit a report.'
          }
        </p>
      </div>

      {/* Extension Analysis Results */}
      {extensionData && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                🛡️
              </span>
              Analysis Results
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Job Title</label>
                  <p className="text-white text-lg">{extensionData.title || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Company</label>
                  <p className="text-white text-lg">{extensionData.company || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Risk Level</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    extensionData.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    extensionData.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    extensionData.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    extensionData.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {extensionData.riskLevel || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2 ${
                    extensionData.safetyScore >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    extensionData.safetyScore >= 40 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                    'bg-gradient-to-br from-red-500 to-pink-600'
                  }`}>
                    {extensionData.safetyScore || 0}
                  </div>
                  <p className="text-gray-400 text-sm">Safety Score</p>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {extensionData.redFlags && extensionData.redFlags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  ⚠️ Red Flags
                </h3>
                <ul className="space-y-2">
                  {extensionData.redFlags.map((flag, index) => (
                    <li key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-200">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Green Flags */}
            {extensionData.greenFlags && extensionData.greenFlags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  ✅ Positive Signals
                </h3>
                <ul className="space-y-2">
                  {extensionData.greenFlags.map((flag, index) => (
                    <li key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-200">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  required
                  placeholder="Senior Software Engineer"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  placeholder="Tech Corp Inc."
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Link (optional)</label>
                <input
                  type="url"
                  name="jobLink"
                  value={formData.jobLink}
                  onChange={handleChange}
                  placeholder="https://company.com/job"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email (optional)</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="hr@company.com"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe why you think this job is a ghost job..."
                rows={5}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none min-h-[100px]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={status === 'loading' || !formData.jobTitle || !formData.company || !formData.description}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {status === 'loading' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
          {/* Feedback */}
          {status === 'success' && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-400/20 rounded-xl text-center backdrop-blur-sm">
              <p className="text-emerald-200 font-light text-sm">Report submitted successfully! 🎉</p>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-xl text-center backdrop-blur-sm">
              <p className="text-red-200 font-light text-sm">Submission failed. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Return appropriate layout based on access type
  if (isExtensionAccess) {
    // For extension access, use DashboardLayout directly without AuthProtection
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        {/* Header for extension access */}
        <div className="backdrop-blur-md bg-black/20 border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">SpotGhost</span>
            </div>
            <div className="text-sm text-gray-400">Extension Analysis</div>
          </div>
        </div>
        
        <main className="z-10 relative px-6 py-10 max-w-7xl mx-auto">
          <ReportContent />
        </main>
      </div>
    );
  }

  // For normal dashboard access, this will be wrapped by the layout's AuthProtection
  return <ReportContent />;
}
