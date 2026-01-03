"use client";
import React, { useEffect, useState } from 'react';

export default function MyReportsPage() {
  // Logout handler
  // Toast state
  const [toast, setToast] = useState(null);
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToast('Logout successful!');
        setTimeout(() => {
          setToast(null);
          window.location.href = '/login';
        }, 1200);
      } else {
        setToast('Logout failed.');
        setTimeout(() => setToast(null), 2000);
      }
    } catch {
      setToast('Logout failed.');
      setTimeout(() => setToast(null), 2000);
    }
  };
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  // Delete handler
  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch('/api/my-reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      });
      const data = await res.json();
      if (data.success) {
        // Helper to normalize strings for deduplication
        const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (type === 'job') {
          // Remove and deduplicate jobs (case/whitespace insensitive)
          const filtered = jobs.filter(j => j._id !== id);
          const deduped = Array.from(
            new Map(filtered.map(j => [
              `${norm(j.title)}|${norm(j.company)}|${norm(j.description)}`,
              j
            ])).values()
          );
          setJobs(deduped);
        } else {
          // Remove and deduplicate reports (case/whitespace insensitive)
          const filtered = reports.filter(r => r._id !== id);
          const deduped = Array.from(
            new Map(filtered.map(r => [
              `${norm(r.jobTitle)}|${norm(r.company)}|${norm(r.description)}`,
              r
            ])).values()
          );
          setReports(deduped);
        }
      } else {
        alert('Failed to delete.');
      }
    } catch {
      alert('Failed to delete.');
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openJobIdx, setOpenJobIdx] = useState(null);
  const [openReportIdx, setOpenReportIdx] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'reports'

  const toggleDescription = (type, id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  const truncateText = (text, maxLength = 300) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/my-reports');
        const data = await res.json();
        // Deduplicate jobs by title+company+description
        const jobs = Array.from(
          new Map((data.jobs || []).map(j => [`${j.title}|${j.company}|${j.description}`, j])).values()
        );
        // Deduplicate reports by jobTitle+company+description
        const reports = Array.from(
          new Map((data.reports || []).map(r => [`${r.jobTitle}|${r.company}|${r.description}`, r])).values()
        );
        setJobs(jobs);
        setReports(reports);
      } catch (err) {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Modal component
  const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
          aria-label="Close"
        >×</button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
      <div className="flex justify-end mb-2">
        <button
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 font-semibold"
          onClick={handleLogout}
        >Logout</button>
      </div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">Your Reports</h1>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">See the jobs you’ve analyzed and the reports you’ve submitted.</p>
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-400">{error}</div>
      ) : (
        <div>
          <div className="flex justify-center mb-8 space-x-4">
            <button
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 focus:outline-none ${activeTab === 'jobs' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-gray-800/40 text-gray-400 border border-gray-700 hover:text-white'}`}
              onClick={() => { setActiveTab('jobs'); setOpenJobIdx(null); }}
            >
              Analyzed Jobs
            </button>
            <button
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 focus:outline-none ${activeTab === 'reports' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-gray-800/40 text-gray-400 border border-gray-700 hover:text-white'}`}
              onClick={() => { setActiveTab('reports'); setOpenReportIdx(null); }}
            >
              Submitted Reports
            </button>
          </div>
          {activeTab === 'jobs' ? (
            <div>
              <h2 className="text-2xl font-semibold text-emerald-300 mb-4">Analyzed Jobs</h2>
              {jobs.length === 0 ? (
                <div className="text-gray-400">No jobs analyzed yet.</div>
              ) : (
                <ul className="space-y-4">
                  {jobs.map((job, idx) => (
                    <li key={job._id} className="bg-gray-800/30 border border-gray-700 rounded-xl">
                      <button
                        className="w-full text-left p-4 flex justify-between items-center focus:outline-none"
                        onClick={() => setOpenJobIdx(openJobIdx === idx ? null : idx)}
                      >
                        <span>
                          <span className="font-bold text-white text-lg">{job.title}</span>
                          <span className="text-gray-300 ml-2">{job.company}</span>
                        </span>
                        <span className="text-emerald-300">{openJobIdx === idx ? '−' : '+'}</span>
                      </button>
                      {openJobIdx === idx && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* Basic Info */}
                          <div className="flex items-center gap-4 mb-2">
                            <div className="text-gray-400 text-sm">{job.location}</div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              job.riskLevel === 'Very Low' ? 'bg-green-500/20 text-green-300' :
                              job.riskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-300' :
                              job.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              job.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              Risk: {job.riskLevel}
                            </div>
                            {job.score !== undefined && (
                              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                                Safety Score: {job.score}/100
                              </div>
                            )}
                          </div>
                          
                          {job.sourceUrl && (
                            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline text-sm hover:text-cyan-300 block">
                              🔗 View Original Job Posting
                            </a>
                          )}
                          
                          {/* AI Analysis Summary */}
                          {job.aiSummary ? (
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                              <div className="font-semibold text-purple-300 mb-2 flex items-center">
                                🤖 AI Analysis
                                {job.aiConfidence && (
                                  <span className="ml-2 text-xs bg-purple-500/20 px-2 py-1 rounded-full">
                                    {job.aiConfidence} confidence
                                  </span>
                                )}
                              </div>
                              {job.aiVerdict && (
                                <div className="text-purple-200 font-medium mb-2">
                                  Verdict: {job.aiVerdict}
                                </div>
                              )}
                              <div className="text-purple-100 text-sm">
                                {expandedDescriptions[`ai-${job._id}`] 
                                  ? job.aiSummary 
                                  : truncateText(job.aiSummary, 200)}
                                {job.aiSummary.length > 200 && (
                                  <button 
                                    onClick={() => toggleDescription('ai', job._id)}
                                    className="text-purple-300 ml-2 underline text-xs hover:text-purple-200"
                                  >
                                    {expandedDescriptions[`ai-${job._id}`] ? 'Show Less' : 'Show More'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-3">
                              <div className="text-gray-400 text-sm italic">
                                ⚠️ AI analysis not available for this job. Re-analyze to get AI insights.
                              </div>
                            </div>
                          )}
                          
                          {/* Red Flags */}
                          {job.flags && job.flags.length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                              <div className="font-semibold text-red-300 mb-2 flex items-center">
                                ⚠️ Red Flags Detected:
                              </div>
                              <ul className="list-disc ml-6 text-red-200 text-sm space-y-1">
                                {job.flags.map((flag, fidx) => (
                                  <li key={fidx}>{flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Additional Info */}
                          {(job.salary || job.email) && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {job.salary && (
                                <div>
                                  <span className="text-gray-500">Salary:</span>
                                  <span className="text-gray-300 ml-2">{job.salary}</span>
                                </div>
                              )}
                              {job.email && (
                                <div>
                                  <span className="text-gray-500">Contact:</span>
                                  <span className="text-gray-300 ml-2">{job.email}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <button
                            className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                            onClick={() => handleDelete('job', job._id)}
                          >Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 mb-4">Submitted Reports</h2>
              {reports.length === 0 ? (
                <div className="text-gray-400">No reports submitted yet.</div>
              ) : (
                <ul className="space-y-4">
                  {reports.map((report, idx) => (
                    <li key={report._id} className="bg-gray-800/30 border border-gray-700 rounded-xl">
                      <button
                        className="w-full text-left p-4 flex justify-between items-center focus:outline-none"
                        onClick={() => setOpenReportIdx(openReportIdx === idx ? null : idx)}
                      >
                        <span>
                          <span className="font-bold text-white text-lg">{report.jobTitle}</span>
                          <span className="text-gray-300 ml-2">{report.company}</span>
                        </span>
                        <span className="text-cyan-300">{openReportIdx === idx ? '−' : '+'}</span>
                      </button>
                      {openReportIdx === idx && (
                        <div className="px-4 pb-4">
                          {report.jobLink && (
                            <a href={report.jobLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline text-xs mb-1 block">View Job</a>
                          )}
                          <div className="text-gray-400 text-sm mb-1">
                            {expandedDescriptions[`report-${report._id}`] 
                              ? report.description 
                              : truncateText(report.description, 300)}
                            {report.description && report.description.length > 300 && (
                              <button 
                                onClick={() => toggleDescription('report', report._id)}
                                className="text-cyan-400 ml-2 underline text-xs hover:text-cyan-300"
                              >
                                {expandedDescriptions[`report-${report._id}`] ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                          </div>
                          <div className="text-gray-400 text-xs mb-1">Submitted: {new Date(report.createdAt).toLocaleString()}</div>
                          {report.contactEmail && (
                            <div className="text-gray-400 text-xs mb-1">Contact: {report.contactEmail}</div>
                          )}
                          <button
                            className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                            onClick={() => handleDelete('report', report._id)}
                          >Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* No modals needed for FAQ accordion style */}
    </div>
  );
}
