'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, FileText, AlertTriangle, CheckCircle, Globe, Briefcase, Shield, XCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';

export default function DashboardHome() {
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
      const response = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl, method: inputMethod === 'linkonly' ? 'linkonly' : 'url' })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setAnalysisResult(result);
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

          {/* Analysis Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Safety Score Card */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Shield className="mr-3" size={24} />
                  Safety Analysis
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Safety Score */}
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-xl font-bold ${
                    analysisResult.job.analysis.safetyScore >= 70 ? 'bg-green-500/20 text-green-300' :
                    analysisResult.job.analysis.safetyScore >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {analysisResult.job.analysis.safetyScore}
                  </div>
                  <p className="text-gray-300 mt-2 text-sm">Safety Score</p>
                </div>
                
                {/* Risk Level */}
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                    analysisResult.job.analysis.riskLevel === 'Very Low' || analysisResult.job.analysis.riskLevel === 'Low' ? 'bg-green-500/20 text-green-300' :
                    analysisResult.job.analysis.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {analysisResult.job.analysis.riskLevel.toUpperCase()}
                  </div>
                  <p className="text-gray-300 mt-2 text-sm">Risk Level</p>
                </div>
              </div>
              
              {/* Risk Breakdown */}
              {analysisResult.job.analysis.breakdown && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Risk Breakdown:</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Website Risk:</span>
                      <span className={`${analysisResult.job.analysis.breakdown.websiteRisk > 20 ? 'text-red-300' : 'text-green-300'}`}>
                        {analysisResult.job.analysis.breakdown.websiteRisk}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email Risk:</span>
                      <span className={`${analysisResult.job.analysis.breakdown.emailRisk > 20 ? 'text-red-300' : 'text-green-300'}`}>
                        {analysisResult.job.analysis.breakdown.emailRisk}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Content Risk:</span>
                      <span className={`${analysisResult.job.analysis.breakdown.contentRisk > 20 ? 'text-red-300' : 'text-green-300'}`}>
                        {analysisResult.job.analysis.breakdown.contentRisk}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Structure Risk:</span>
                      <span className={`${analysisResult.job.analysis.breakdown.structureRisk > 20 ? 'text-red-300' : 'text-green-300'}`}>
                        {analysisResult.job.analysis.breakdown.structureRisk}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Compensation Risk:</span>
                      <span className={`${analysisResult.job.analysis.breakdown.compensationRisk > 20 ? 'text-red-300' : 'text-green-300'}`}>
                        {analysisResult.job.analysis.breakdown.compensationRisk}/100
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Briefcase className="mr-2" size={20} />
                Job Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Title:</span> 
                  <span className="text-white ml-2">{analysisResult.job.title || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Company:</span> 
                  <span className="text-white ml-2">{analysisResult.job.company || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Location:</span> 
                  <span className="text-white ml-2">{analysisResult.job.location || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Salary:</span> 
                  <span className="text-white ml-2">{analysisResult.job.salary || 'Not provided'}</span>
                </div>
                {analysisResult.job.contactEmail && (
                  <div>
                    <span className="text-gray-400">Contact:</span> 
                    <span className="text-white ml-2">{analysisResult.job.contactEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Description Length:</span> 
                  <span className="text-white ml-2">{analysisResult.job.description?.length || 0} characters</span>
                </div>
                <div>
                  <span className="text-gray-400">Red Flags Detected:</span> 
                  <span className={`ml-2 font-semibold ${
                    analysisResult.job.analysis.warnings.length === 0 ? 'text-green-300' :
                    analysisResult.job.analysis.warnings.length <= 2 ? 'text-yellow-300' :
                    'text-red-300'
                  }`}>
                    {analysisResult.job.analysis.warnings.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Status */}
          {analysisResult.job.analysis.aiAnalysis && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 font-medium">AI-Powered Analysis</span>
                </div>
                <span className="text-green-200 text-sm">
                  Confidence: {analysisResult.job.analysis.confidenceScore}%
                </span>
              </div>
            </div>
          )}

          {/* Critical Red Flags */}
          {analysisResult.job.analysis.redFlags && analysisResult.job.analysis.redFlags.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-red-300 mb-4 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Critical Red Flags ({analysisResult.job.analysis.redFlags.length})
              </h3>
              <ul className="space-y-2">
                {analysisResult.job.analysis.redFlags.map((flag, index) => (
                  <li key={index} className="flex items-start space-x-2 text-red-200">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {analysisResult.job.analysis.warnings.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-orange-300 mb-4 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Warnings Detected ({analysisResult.job.analysis.warnings.length})
              </h3>
              <ul className="space-y-2">
                {analysisResult.job.analysis.warnings.map((flag, index) => (
                  <li key={index} className="flex items-start space-x-2 text-orange-200">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-orange-400" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legitimacy Indicators */}
          {analysisResult.job.analysis.legitimacyIndicators && analysisResult.job.analysis.legitimacyIndicators.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
                <CheckCircle className="mr-2" size={20} />
                Positive Indicators ({analysisResult.job.analysis.legitimacyIndicators.length})
              </h3>
              <ul className="space-y-2">
                {analysisResult.job.analysis.legitimacyIndicators.map((indicator, index) => (
                  <li key={index} className="flex items-start space-x-2 text-green-200">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-400" />
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Reasoning */}
          {analysisResult.job.analysis.reasoning && analysisResult.job.analysis.aiAnalysis && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                <Info className="mr-2" size={20} />
                AI Analysis Reasoning
              </h3>
              <p className="text-blue-200 leading-relaxed">{analysisResult.job.analysis.reasoning}</p>
            </div>
          )}

          {/* Scam Type Detection */}
          {analysisResult.job.analysis.scamType && analysisResult.job.analysis.scamType !== 'none' && (
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-red-300 mb-4 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Scam Type Detected
              </h3>
              <div className="bg-red-700/20 rounded-lg p-4">
                <p className="text-red-200 font-medium capitalize">
                  {analysisResult.job.analysis.scamType.replace('-', ' ')}
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisResult.job.analysis.recommendations && (
            <div className="space-y-4">
              {/* Summary Recommendations */}
              {analysisResult.job.analysis.recommendations.summary && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                    <Info className="mr-2" size={20} />
                    Key Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.job.analysis.recommendations.summary.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2 text-blue-200">
                        <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {analysisResult.job.analysis.recommendations.actionItems && analysisResult.job.analysis.recommendations.actionItems.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-yellow-300 mb-4">Action Items</h3>
                  <ul className="space-y-2">
                    {analysisResult.job.analysis.recommendations.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2 text-yellow-200">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification Steps */}
              {analysisResult.job.analysis.recommendations.verificationSteps && analysisResult.job.analysis.recommendations.verificationSteps.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-purple-300 mb-4">Verification Checklist</h3>
                  <ul className="space-y-2">
                    {analysisResult.job.analysis.recommendations.verificationSteps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-2 text-purple-200">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
