"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, FileText, AlertTriangle, CheckCircle, Globe, Briefcase, Shield, XCircle, RefreshCw } from 'lucide-react';

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
         method = 'link';
      }
      const response = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl, method })
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
      console.log('📥 Manual analysis response received:', result);
      console.log('📊 Has aiAnalysis:', !!result?.job?.aiAnalysis);
      console.log('📊 aiAnalysis verdict:', result?.job?.aiAnalysis?.verdict);
      console.log('📊 aiAnalysis summary:', result?.job?.aiAnalysis?.summary);
      
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

      {/* URL Input Method (for both link and linkonly) */}
      {(inputMethod === 'link' || inputMethod === 'linkonly') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="mr-2" size={20} />
              Job Listing URL
            </h3>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/123456789/"
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="flex justify-end">
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
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                placeholder="- 5+ years of experience with React\n- Strong knowledge of JavaScript/TypeScript\n- Experience with Node.js..."
                rows={5}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none scrollbar-hide min-h-[100px]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
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
            <div className="bg-slate-900/80 shadow-lg border border-slate-600/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center mr-4">
                  <Globe size={20} className="text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Link Safety Check</h3>
                  <p className="text-slate-400 text-sm">URL reputation analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-1">Safety Score</h4>
                  <div className="text-2xl font-bold text-slate-200">
                    {analysisResult.job.analysis.safetyScore ?? 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-1">Risk Assessment</h4>
                  <div className="text-lg font-semibold text-white">
                    {analysisResult.job.analysis.riskLevel}
                  </div>
                </div>
              </div>

              {analysisResult.job.analysis.warnings && analysisResult.job.analysis.warnings.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5 mb-4">
                  <h5 className="text-red-300 font-medium mb-3 flex items-center">
                    <AlertTriangle size={16} className="mr-2" />
                    Security Warnings
                  </h5>
                  <ul className="space-y-2">
                    {analysisResult.job.analysis.warnings.map((item, idx) => (
                      <li key={idx} className="text-red-200 text-sm flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.job.analysis.recommendations && (
                <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-5 mb-4">
                  <h5 className="text-slate-300 font-medium mb-3 flex items-center">
                    <CheckCircle size={16} className="mr-2" />
                    Recommendations
                  </h5>
                  <ul className="space-y-2">
                    {analysisResult.job.analysis.recommendations.summary?.map((item, idx) => (
                      <li key={idx} className="text-slate-200 text-sm flex items-start">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-slate-600/20 pt-4">
                <div className="flex items-center text-slate-400 text-xs">
                  <Shield size={14} className="mr-2" />
                  <span>Link verified using SpotGhost and urlscan.io</span>
                </div>
              </div>
            </div>
          )}

          {/* LINK: Prompt to use extension */}
          {analysisResult.method === 'link' && (
            <div className="bg-slate-900/80 shadow-lg border border-slate-600/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield size={24} className="text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Use SpotGhost Browser Extension
                  </h3>
                  <p className="text-slate-300 text-base leading-relaxed mb-4">
                    For comprehensive job analysis, install the <span className="font-semibold text-white">SpotGhost browser extension</span> to extract complete job details directly from job board pages.
                  </p>
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">
                      The extension provides more accurate analysis by accessing full job posting data that may not be available through URL parsing alone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL/EXTENSION: Full classic/AI analysis and summary */}
          {analysisResult.job && analysisResult.job.classicAnalysis && (
            <>
              {/* Classic Analysis Section */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 shadow-lg border border-emerald-600/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">SpotGhost Classic Analysis</h3>
                    <p className="text-emerald-300 text-sm">Rule-based detection system</p>
                  </div>
                </div>

                {/* Safety Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <h4 className="text-emerald-300 text-sm font-medium mb-1">Safety Score</h4>
                    <div className="text-2xl font-bold text-emerald-400">
                      {analysisResult.job.classicAnalysis.safetyScore ?? 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-4">
                    <h4 className="text-slate-300 text-sm font-medium mb-1">Risk Assessment</h4>
                    <div className="text-lg font-semibold text-white">
                      {analysisResult.job.classicAnalysis.riskLevel}
                    </div>
                  </div>
                </div>

                {/* Flags Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Red Flags */}
                  {analysisResult.job.classicAnalysis.redFlags && analysisResult.job.classicAnalysis.redFlags.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5">
                      <h5 className="text-red-300 font-medium mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Detected Issues
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.job.classicAnalysis.redFlags.map((item, idx) => (
                          <li key={idx} className="text-red-200 text-sm flex items-start">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Green Flags */}
                  {analysisResult.job.classicAnalysis.greenFlags && analysisResult.job.classicAnalysis.greenFlags.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5">
                      <h5 className="text-emerald-300 font-medium mb-3 flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Quality Indicators
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.job.classicAnalysis.greenFlags.map((item, idx) => (
                          <li key={idx} className="text-emerald-200 text-sm flex items-start">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-emerald-600/20 pt-4">
                  <div className="flex items-center text-emerald-300 text-xs">
                    <Shield size={14} className="mr-2" />
                    <span>Powered by SpotGhost rule-based detection algorithms</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section (Advisory) */}
              {analysisResult.job.aiAnalysis && (
                <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-lg border border-slate-600/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-sm">
                  {/* Header with modern styling */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center mr-4">
                        <CheckCircle size={20} className="text-slate-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">AI Analysis</h3>
                        <p className="text-slate-400 text-sm">Advisory • Powered by Gemini</p>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-300 text-sm">
                        <strong>Advisory Notice:</strong> This AI analysis provides supplementary insights and may not be 100% accurate. 
                        Always use your own judgment and verify job details independently.
                      </p>
                    </div>
                  </div>

                  {/* Verdict Badge */}
                  <div className="mb-6">
                    <div className="inline-flex items-center space-x-3">
                      <span className="text-slate-300 font-medium">Verdict:</span>
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        analysisResult.job.aiAnalysis.verdict === 'LEGITIMATE' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        analysisResult.job.aiAnalysis.verdict === 'SUSPICIOUS' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        analysisResult.job.aiAnalysis.verdict === 'FRAUDULENT' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 
                          'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        {analysisResult.job.aiAnalysis.verdict || 'Unknown'}
                      </div>
                      {analysisResult.job.aiAnalysis.confidence && (
                        <span className="text-slate-400 text-sm">
                          Confidence: <span className="font-medium">{analysisResult.job.aiAnalysis.confidence}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Analysis Summary */}
                  {analysisResult.job.aiAnalysis.summary && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                        <FileText size={18} className="text-slate-400 mr-3" />
                        Analysis Summary
                      </h4>
                      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {analysisResult.job.aiAnalysis.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Red Flags */}
                    {analysisResult.job.aiAnalysis.redFlags && analysisResult.job.aiAnalysis.redFlags.length > 0 && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5">
                        <h5 className="text-red-300 font-medium mb-3 flex items-center">
                          <AlertTriangle size={16} className="mr-2" />
                          Risk Factors
                        </h5>
                        <ul className="space-y-2">
                          {analysisResult.job.aiAnalysis.redFlags.map((item, idx) => (
                            <li key={idx} className="text-red-200 text-sm flex items-start">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Green Flags */}
                    {analysisResult.job.aiAnalysis.greenFlags && analysisResult.job.aiAnalysis.greenFlags.length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5">
                        <h5 className="text-emerald-300 font-medium mb-3 flex items-center">
                          <CheckCircle size={16} className="mr-2" />
                          Positive Signals
                        </h5>
                        <ul className="space-y-2">
                          {analysisResult.job.aiAnalysis.greenFlags.map((item, idx) => (
                            <li key={idx} className="text-emerald-200 text-sm flex items-start">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Detailed Analysis Sections */}
                  <div className="space-y-4">
                    {analysisResult.job.aiAnalysis.companyAnalysis && (
                      <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                        <h5 className="text-slate-300 font-medium mb-2 flex items-center">
                          <Briefcase size={14} className="mr-2" />
                          Company Research
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{analysisResult.job.aiAnalysis.companyAnalysis}</p>
                      </div>
                    )}

                    {analysisResult.job.aiAnalysis.jobDescriptionAnalysis && (
                      <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                        <h5 className="text-slate-300 font-medium mb-2 flex items-center">
                          <FileText size={14} className="mr-2" />
                          Job Description Assessment
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{analysisResult.job.aiAnalysis.jobDescriptionAnalysis}</p>
                      </div>
                    )}

                    {analysisResult.job.aiAnalysis.contactAnalysis && (
                      <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                        <h5 className="text-slate-300 font-medium mb-2 flex items-center">
                          <Globe size={14} className="mr-2" />
                          Contact Information Review
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{analysisResult.job.aiAnalysis.contactAnalysis}</p>
                      </div>
                    )}

                    {analysisResult.job.aiAnalysis.domainAnalysis && (
                      <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                        <h5 className="text-slate-300 font-medium mb-2 flex items-center">
                          <Globe size={14} className="mr-2" />
                          Website & Domain Analysis
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{analysisResult.job.aiAnalysis.domainAnalysis}</p>
                      </div>
                    )}

                    {analysisResult.job.aiAnalysis.otherNotes && (
                      <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
                        <h5 className="text-slate-300 font-medium mb-2 flex items-center">
                          <FileText size={14} className="mr-2" />
                          Additional Notes
                        </h5>
                        <p className="text-slate-200 text-sm leading-relaxed">{analysisResult.job.aiAnalysis.otherNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {analysisResult.job.aiAnalysis.recommendations && analysisResult.job.aiAnalysis.recommendations.length > 0 && (
                    <div className="mt-6 bg-slate-700/20 border border-slate-600/40 rounded-lg p-5">
                      <h5 className="text-slate-300 font-medium mb-3 flex items-center">
                        <Briefcase size={16} className="mr-2" />
                        Recommendations
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.job.aiAnalysis.recommendations.map((item, idx) => (
                          <li key={idx} className="text-slate-200 text-sm flex items-start">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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