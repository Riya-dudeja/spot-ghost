"use client";
import React, { useState } from 'react';

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


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Submit Ghost Job Report
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Help SpotGhost by flagging suspicious or ghost job listings. Fill out the form below to submit a report.
        </p>
      </div>
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
}
