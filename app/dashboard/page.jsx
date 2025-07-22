"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, FileText, AlertTriangle, CheckCircle, Globe, Briefcase, Shield, XCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';

function DashboardHome() {
  const [inputMethod, setInputMethod] = useState('link'); // 'link', 'linkonly', or 'manual'
  const [jobUrl, setJobUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualData, setManualData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    contactEmail: '',
    applicationUrl: ''
  });

  // On mount, check for analysis result in localStorage (from extension)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('spotghost_analysis_result');
      if (stored) {
        setAnalysisResult(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const supportedSites = [
    { name: 'LinkedIn', domain: 'linkedin.com', icon: '💼' },
    { name: 'Indeed', domain: 'indeed.com', icon: '🔍' },
    { name: 'Glassdoor', domain: 'glassdoor.com', icon: '🏢' },
    { name: 'Monster', domain: 'monster.com', icon: '👹' },
    { name: 'ZipRecruiter', domain: 'ziprecruiter.com', icon: '📋' }
  ];

  const handleUrlAnalysis = async () => {
    if (!jobUrl.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      let method = 'url';
      if (inputMethod === 'linkonly') {
        method = 'linkonly';
      } else if (inputMethod === 'link') {
        // Check if LinkedIn URL
        if (/linkedin\.com\/jobs\/view\//i.test(jobUrl)) {
          method = 'linkedin';
        } else {
          method = 'url'; // fallback for other job boards if needed
        }
      }
      const response = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl, method })
      });

      const result = await response.json();

      if (response.ok) {
        setAnalysisResult(result);
        // Store in localStorage for persistence/extension
        try {
          localStorage.setItem('spotghost_analysis_result', JSON.stringify(result));
        } catch (e) {}
      } else {
        setError(result.error || 'Failed to analyze job listing');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Network error: Please check your connection and try again');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const response = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...manualData, method: 'manual' })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setAnalysisResult(result);
        // Store in localStorage for persistence/extension
        try {
          localStorage.setItem('spotghost_analysis_result', JSON.stringify(result));
        } catch (e) {}
      } else {
        setError(result.error || 'Failed to analyze job listing');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Network error: Please check your connection and try again');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setJobUrl('');
    setManualData({
      jobTitle: '',
      company: '',
      location: '',
      salary: '',
      description: '',
      requirements: '',
      contactEmail: '',
      applicationUrl: ''
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Analyze Job Listing
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Enter a job listing URL or manually input details to analyze for potential red flags and scams
        </p>
      </motion.div>

      {/* Input Method Toggle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-1 flex">
          <button
            onClick={() => setInputMethod('link')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              inputMethod === 'link'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Link2 size={18} />
            <span>Auto-Fill from URL</span>
          </button>
          <button
            onClick={() => setInputMethod('linkonly')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              inputMethod === 'linkonly'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield size={18} />
            <span>Link Check Only</span>
          </button>
          <button
            onClick={() => setInputMethod('manual')}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              inputMethod === 'manual'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={18} />
            <span>Manual Entry</span>
          </button>
        </div>
      </motion.div>

      {/* URL Input Method */}
      {inputMethod === 'link' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Supported Sites */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="mr-2" size={20} />
              Supported Job Sites
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {supportedSites.map((site) => (
                <div key={site.name} className="flex items-center space-x-2 text-gray-300">
                  <span className="text-lg">{site.icon}</span>
                  <div>
                    <div className="font-medium">{site.name}</div>
                    <div className="text-xs text-gray-400">{site.domain}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* URL Input */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Listing URL
            </label>
            <div className="flex space-x-4">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleUrlAnalysis}
                disabled={!jobUrl.trim() || isAnalyzing}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle size={20} />
                )}
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Link Check Only Method */}
      {inputMethod === 'linkonly' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Info Panel */}
          <div className="bg-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
              <Shield className="mr-2" size={20} />
              Quick Link Authenticity Check
            </h3>
            <div className="text-blue-200 space-y-2">
              <p>This mode analyzes only the URL structure and domain for red flags without extracting content.</p>
              <div className="bg-blue-900/30 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-blue-200 mb-2">What we check:</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Domain legitimacy and reputation</li>
                  <li>• Suspicious URL patterns (shortened links, suspicious TLDs)</li>
                  <li>• Known scam domains and blacklisted sites</li>
                  <li>• URL structure analysis for red flags</li>
                  <li>• HTTPS security validation</li>
                </ul>
              </div>
              <div className="bg-green-900/30 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-green-200 mb-2">Advantages:</h4>
                <ul className="text-sm text-green-300 space-y-1">
                  <li>• Instant results (no content scraping delays)</li>
                  <li>• Works with any website (no blocking issues)</li>
                  <li>• Privacy-friendly (doesn't access page content)</li>
                  <li>• Reliable detection of URL-based scams</li>
                </ul>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Listing URL
            </label>
            <div className="flex space-x-4">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://example.com/jobs/suspicious-listing"
                className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleUrlAnalysis}
                disabled={!jobUrl.trim() || isAnalyzing}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Shield size={20} />
                )}
                <span>{isAnalyzing ? 'Checking...' : 'Check Link'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Input Method */}
      {inputMethod === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Briefcase className="mr-2" size={20} />
              Job Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={manualData.jobTitle}
                  onChange={(e) => setManualData({ ...manualData, jobTitle: e.target.value })}
                  placeholder="Senior Software Engineer"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={manualData.company}
                  onChange={(e) => setManualData({ ...manualData, company: e.target.value })}
                  placeholder="Tech Corp Inc."
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={manualData.location}
                  onChange={(e) => setManualData({ ...manualData, location: e.target.value })}
                  placeholder="San Francisco, CA (Remote)"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={manualData.salary}
                  onChange={(e) => setManualData({ ...manualData, salary: e.target.value })}
                  placeholder="$120k - $180k per year"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={manualData.contactEmail}
                  onChange={(e) => setManualData({ ...manualData, contactEmail: e.target.value })}
                  placeholder="hr@company.com"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Application URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Application URL
                </label>
                <input
                  type="url"
                  value={manualData.applicationUrl}
                  onChange={(e) => setManualData({ ...manualData, applicationUrl: e.target.value })}
                  placeholder="https://company.com/apply"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Description *
              </label>
              <textarea
                value={manualData.description}
                onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                placeholder="We are looking for a talented software engineer to join our team..."
                rows={6}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none scrollbar-hide min-h-[120px]"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requirements
              </label>
              <textarea
                value={manualData.requirements}
                onChange={(e) => setManualData({ ...manualData, requirements: e.target.value })}
                placeholder="- 5+ years of experience with React
- Strong knowledge of JavaScript/TypeScript
- Experience with Node.js..."
                rows={5}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none scrollbar-hide min-h-[100px]"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleManualSubmit}
                disabled={!manualData.jobTitle || !manualData.company || !manualData.description || isAnalyzing}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle size={20} />
                )}
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Job Listing'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3">
            <XCircle className="text-red-400" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-300">Analysis Failed</h3>
              <p className="text-red-200">{error}</p>
              <button
                onClick={resetAnalysis}
                className="mt-3 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-2"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}


      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Shield className="mr-3" size={28} />
              Analysis Results
            </h2>
            <button
              onClick={resetAnalysis}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>New Analysis</span>
            </button>
          </div>

          {/* LINKONLY: Classic URL check only */}
          {analysisResult.method === 'linkonly' && analysisResult.job && analysisResult.job.analysis && (
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                <span className="mr-2">🔗</span>
                Link Safety Check
              </h3>
              <div className="text-gray-200 text-lg font-bold mb-2">
                Safety Score: <span className="text-emerald-400">{analysisResult.job.analysis.safetyScore ?? 'N/A'}</span>
              </div>
              <div className="text-gray-300 text-base mb-2">
                <strong>Risk Level:</strong> {analysisResult.job.analysis.riskLevel}
              </div>
              {analysisResult.job.analysis.warnings && analysisResult.job.analysis.warnings.length > 0 && (
                <div className="text-yellow-300 text-sm bg-yellow-900/30 rounded-lg p-4 border border-yellow-600 mb-2">
                  <strong>Red Flags:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    {analysisResult.job.analysis.warnings.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResult.job.analysis.recommendations && (
                <div className="text-green-300 text-sm bg-green-900/30 rounded-lg p-4 border border-green-600 mb-2">
                  <strong>Recommendations:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    {analysisResult.job.analysis.recommendations.summary?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 text-xs text-blue-400 flex items-center">
                <span className="mr-2">🌐</span>
                <span>Link checked using SpotGhost and urlscan.io</span>
              </div>
            </div>
          )}

          {/* LINK: Prompt to use extension */}
          {analysisResult.method === 'link' && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6 text-center">
              <h3 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center justify-center">
                <span className="mr-2">🧩</span>
                Use the SpotGhost Extension
              </h3>
              <div className="text-gray-200 text-base mb-2">
                For a full, accurate job analysis, please use the <span className="font-bold text-yellow-200">SpotGhost browser extension</span> to extract all job details directly from the job board page.
              </div>
              <div className="text-yellow-400 text-xs mt-2">This ensures you get the most reliable and detailed results.</div>
            </div>
          )}

          {/* MANUAL/EXTENSION: Full classic/AI analysis and summary */}
          {analysisResult.job && analysisResult.job.classicAnalysis && (
            <>
              {analysisResult.professionalSummary && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-semibold text-emerald-300 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Summary
                  </h3>
                  <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-base font-mono bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                    {analysisResult.professionalSummary}
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
                  <span className="mr-2">🛡️</span>
                  Classic Analysis
                </h3>
                <div className="text-gray-200 text-lg font-bold mb-2">
                  Safety Score: <span className="text-emerald-400">{analysisResult.job.classicAnalysis.safetyScore ?? 'N/A'}</span>
                </div>
                <div className="text-gray-300 text-base mb-2">
                  <strong>Risk Level:</strong> {analysisResult.job.classicAnalysis.riskLevel}
                </div>
                {analysisResult.job.classicAnalysis.redFlags && analysisResult.job.classicAnalysis.redFlags.length > 0 && (
                  <div className="text-yellow-300 text-sm bg-yellow-900/30 rounded-lg p-4 border border-yellow-600 mb-2">
                    <strong>Red Flags:</strong>
                    <ul className="list-disc ml-6 mt-2">
                      {analysisResult.job.classicAnalysis.redFlags.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.job.classicAnalysis.greenFlags && analysisResult.job.classicAnalysis.greenFlags.length > 0 && (
                  <div className="text-green-300 text-sm bg-green-900/30 rounded-lg p-4 border border-green-600 mb-2">
                    <strong>Positive Signals:</strong>
                    <ul className="list-disc ml-6 mt-2">
                      {analysisResult.job.classicAnalysis.greenFlags.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 text-xs text-green-400 flex items-center">
                  <span className="mr-2">🔍</span>
                  <span>Classic SpotGhost analysis</span>
                </div>
              </div>
              {analysisResult.job.aiAnalysis && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
                    <span className="mr-2">🤖</span>
                    Gemini AI Analysis
                  </h3>
                  <div className="text-gray-200 text-lg font-bold mb-2">
                    Verdict: <span className={
                      analysisResult.job.aiAnalysis.verdict === 'LEGITIMATE' ? 'text-green-400' :
                      analysisResult.job.aiAnalysis.verdict === 'SUSPICIOUS' ? 'text-yellow-400' :
                      analysisResult.job.aiAnalysis.verdict === 'FRAUDULENT' ? 'text-red-400' : 'text-gray-200'
                    }>{analysisResult.job.aiAnalysis.verdict || 'Unknown'}</span>
                    {analysisResult.job.aiAnalysis.confidence && (
                      <span className="ml-4 text-xs text-purple-200">Confidence: {analysisResult.job.aiAnalysis.confidence}</span>
                    )}
                  </div>
                  {analysisResult.job.aiAnalysis.summary && (
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base font-mono bg-gray-900/50 rounded-lg p-4 border border-gray-600 mb-2">
                      {analysisResult.job.aiAnalysis.summary}
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.redFlags && analysisResult.job.aiAnalysis.redFlags.length > 0 && (
                    <div className="text-yellow-300 text-sm bg-yellow-900/30 rounded-lg p-4 border border-yellow-600 mb-2">
                      <strong>AI-Identified Red Flags:</strong>
                      <ul className="list-disc ml-6 mt-2">
                        {analysisResult.job.aiAnalysis.redFlags.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.greenFlags && analysisResult.job.aiAnalysis.greenFlags.length > 0 && (
                    <div className="text-green-300 text-sm bg-green-900/30 rounded-lg p-4 border border-green-600 mb-2">
                      <strong>AI-Identified Positive Signals:</strong>
                      <ul className="list-disc ml-6 mt-2">
                        {analysisResult.job.aiAnalysis.greenFlags.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.companyAnalysis && (
                    <div className="text-purple-200 text-sm bg-purple-900/30 rounded-lg p-4 border border-purple-600 mb-2">
                      <strong>Company Analysis:</strong> {analysisResult.job.aiAnalysis.companyAnalysis}
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.jobDescriptionAnalysis && (
                    <div className="text-purple-200 text-sm bg-purple-900/30 rounded-lg p-4 border border-purple-600 mb-2">
                      <strong>Job Description Analysis:</strong> {analysisResult.job.aiAnalysis.jobDescriptionAnalysis}
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.contactAnalysis && (
                    <div className="text-purple-200 text-sm bg-purple-900/30 rounded-lg p-4 border border-purple-600 mb-2">
                      <strong>Contact Analysis:</strong> {analysisResult.job.aiAnalysis.contactAnalysis}
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.otherNotes && (
                    <div className="text-purple-200 text-sm bg-purple-900/30 rounded-lg p-4 border border-purple-600 mb-2">
                      <strong>Other Notes:</strong> {analysisResult.job.aiAnalysis.otherNotes}
                    </div>
                  )}
                  {analysisResult.job.aiAnalysis.raw && (
                    <GeminiAnalysisSection analysis={analysisResult.job.aiAnalysis.raw} />
                  )}
                  <div className="mt-4 text-xs text-purple-400 flex items-center">
                    <span className="mr-2">⚡</span>
                    <span>Analysis powered by Gemini AI - Real-time fraud detection</span>
                  </div>
                </div>
              )}
            </>
          )}

        </motion.div>
      )}

      {/* Info Banner - only show if no results */}
      {!analysisResult && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3"
        >
          <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
          <div className="text-sm text-amber-200">
            <strong>Privacy Notice:</strong> We analyze job listings to identify potential scams and red flags. 
            No personal information is stored permanently, and all data is processed securely.
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default DashboardHome;


function GeminiAnalysisSection({ analysis }) {
  // Auto-expand by default if analysis is present
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-purple-300 underline text-sm font-semibold mb-2 focus:outline-none"
        aria-expanded={open}
      >
        {open ? 'Hide Full AI Analysis' : 'Show Full AI Analysis'}
      </button>
      {open && (
        <div className="whitespace-pre-wrap bg-gray-950/80 border border-purple-700 rounded-lg p-4 text-sm text-gray-200 mt-2 font-mono overflow-x-auto" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {analysis}
        </div>
      )}
    </div>
  );
}
