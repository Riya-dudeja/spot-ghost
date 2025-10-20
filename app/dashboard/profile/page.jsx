"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Shield, Save, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success'); // 'success' or 'error'
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    joinedAt: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /(?=.*[a-z])/.test(password), label: 'Lowercase letter' },
      { test: /(?=.*[A-Z])/.test(password), label: 'Uppercase letter' },
      { test: /(?=.*\d)/.test(password), label: 'Number' },
      { test: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password), label: 'Special character' }
    ];
    
    const passedCount = checks.filter(check => check.test).length;
    return { checks, strength: passedCount, maxStrength: checks.length };
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success) {
          setProfileData({
            name: data.user.name || data.user.email?.split('@')[0] || '',
            email: data.user.email || '',
            joinedAt: data.user.createdAt || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          showMessage(data.error || 'Failed to fetch profile', 'error');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        showMessage('Failed to load profile data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      // Validate required fields
      if (!profileData.name || !profileData.email) {
        showMessage('Name and email are required', 'error');
        setIsSaving(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        showMessage('Please enter a valid email address', 'error');
        setIsSaving(false);
        return;
      }

      // Validate passwords if changing
      if (profileData.newPassword || profileData.confirmPassword) {
        if (!profileData.currentPassword) {
          showMessage('Current password is required to change password', 'error');
          setIsSaving(false);
          return;
        }
        
        if (profileData.newPassword !== profileData.confirmPassword) {
          showMessage('New passwords do not match', 'error');
          setIsSaving(false);
          return;
        }
        
        // Enhanced password validation
        if (profileData.newPassword.length < 8) {
          showMessage('Password must be at least 8 characters long', 'error');
          setIsSaving(false);
          return;
        }

        if (!/(?=.*[a-z])/.test(profileData.newPassword)) {
          showMessage('Password must contain at least one lowercase letter', 'error');
          setIsSaving(false);
          return;
        }

        if (!/(?=.*[A-Z])/.test(profileData.newPassword)) {
          showMessage('Password must contain at least one uppercase letter', 'error');
          setIsSaving(false);
          return;
        }

        if (!/(?=.*\d)/.test(profileData.newPassword)) {
          showMessage('Password must contain at least one number', 'error');
          setIsSaving(false);
          return;
        }

        if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(profileData.newPassword)) {
          showMessage('Password must contain at least one special character', 'error');
          setIsSaving(false);
          return;
        }
      }

      // Make API call to update profile
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Profile updated successfully! Redirecting to dashboard...', 'success');
        
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Redirect back to dashboard after successful update
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000); // Wait 2 seconds to show success message
      } else {
        showMessage(data.error || 'Failed to update profile', 'error');
      }
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back</span>
          </button>
        </div>
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Edit Profile
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.div>

      {/* Message Toast */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-2xl mx-auto p-4 rounded-lg border flex items-center space-x-3 ${
            messageType === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {messageType === 'success' ? (
            <CheckCircle size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0" />
          )}
          <span>{message}</span>
        </motion.div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Profile Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 shadow-lg border border-slate-600/50 rounded-xl p-6 mb-8 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center mr-4">
              <User size={20} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Profile Information</h3>
              <p className="text-slate-400 text-sm">Update your personal details</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            {/* Join Date (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Member Since
              </label>
              <div className="w-full bg-slate-800/30 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-400 flex items-center">
                <Calendar size={16} className="mr-2" />
                {profileData.joinedAt ? new Date(profileData.joinedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Loading...'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 shadow-lg border border-slate-600/50 rounded-xl p-6 mb-8 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center mr-4">
              <Shield size={20} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Change Password</h3>
              <p className="text-slate-400 text-sm">Update your account password</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={profileData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{ WebkitTextSecurity: showCurrentPassword ? 'none' : 'disc' }}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={profileData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-strong-password-auto-fill-button]:hidden [&::-webkit-caps-lock-indicator]:hidden"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {profileData.newPassword && (
                <div className="mt-3">
                  {(() => {
                    const { checks, strength, maxStrength } = checkPasswordStrength(profileData.newPassword);
                    const strengthPercentage = (strength / maxStrength) * 100;
                    const strengthColor = 
                      strengthPercentage < 50 ? 'bg-red-500' :
                      strengthPercentage < 80 ? 'bg-yellow-500' : 'bg-green-500';
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Password Strength</span>
                          <span className={`font-medium ${
                            strengthPercentage < 50 ? 'text-red-400' :
                            strengthPercentage < 80 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {strength}/{maxStrength} requirements met
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: `${strengthPercentage}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {checks.map((check, idx) => (
                            <div key={idx} className={`flex items-center space-x-1 ${
                              check.test ? 'text-green-400' : 'text-slate-500'
                            }`}>
                              <span>{check.test ? '✓' : '○'}</span>
                              <span>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={profileData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-strong-password-auto-fill-button]:hidden [&::-webkit-caps-lock-indicator]:hidden"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-slate-700/20 border border-slate-600/40 rounded-lg p-4">
              <h5 className="text-slate-300 text-sm font-medium mb-2">Password Requirements:</h5>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>• At least 8 characters long</li>
                <li>• At least one lowercase letter (a-z)</li>
                <li>• At least one uppercase letter (A-Z)</li>
                <li>• At least one number (0-9)</li>
                <li>• At least one special character (!@#$%^&*()_+-=[]{}|;:,.&lt;&gt;?)</li>
                <li className="text-slate-500 mt-2">• Leave fields empty if you don't want to change password</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium rounded-lg transition-all duration-300 flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save size={20} />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
