"use client";
import React, { useEffect, useState } from 'react';

export default function MyReportsPage() {
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openJobIdx, setOpenJobIdx] = useState(null);
  const [openReportIdx, setOpenReportIdx] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'reports'

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/my-reports');
        const data = await res.json();
        setJobs(data.jobs || []);
        setReports(data.reports || []);
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
                        <div className="px-4 pb-4">
                          <div className="text-gray-400 text-sm mb-1">{job.location}</div>
                          <div className="text-gray-400 text-sm mb-1">Risk Level: <span className="font-semibold">{job.riskLevel}</span></div>
                          {job.sourceUrl && (
                            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline text-xs mb-1 block">View Job</a>
                          )}
                          <div className="text-gray-400 text-sm mb-1">{job.description}</div>
                          {job.flags && job.flags.length > 0 && (
                            <div className="mt-2">
                              <div className="font-semibold text-yellow-300 mb-1">Red Flags:</div>
                              <ul className="list-disc ml-6 text-yellow-200 text-sm">
                                {job.flags.map((flag, fidx) => (
                                  <li key={fidx}>{flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}
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
                          <div className="text-gray-400 text-sm mb-1">{report.description}</div>
                          <div className="text-gray-400 text-xs mb-1">Submitted: {new Date(report.createdAt).toLocaleString()}</div>
                          {report.contactEmail && (
                            <div className="text-gray-400 text-xs mb-1">Contact: {report.contactEmail}</div>
                          )}
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
