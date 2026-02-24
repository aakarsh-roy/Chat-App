import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { FaTimes, FaUser, FaEnvelope, FaEdit, FaCamera, FaMoon, FaSun } from 'react-icons/fa';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function UserProfile({ onClose }) {
  const { user, updateProfile } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('avatar', file);

      const { data } = await axiosInstance.post('/api/auth/upload-avatar', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData({ ...formData, avatar: data.avatar });
      await updateProfile({ avatar: data.avatar });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload picture');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="overlay animate-fadeIn" onClick={onClose}>
      <div className="modal max-w-md w-full mx-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-500">
            <FaTimes />
          </button>
        </div>

        {/* Avatar */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <img
              src={formData.avatar || user?.avatar}
              alt={user?.fullName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900/50"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition shadow-lg disabled:opacity-50"
              title="Change picture"
            >
              {isUploading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <FaCamera size={12} />
              )}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.fullName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="mt-3 btn btn-ghost text-sm gap-1.5">
              <FaEdit size={12} /> Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} className="input resize-none" rows="3" maxLength="200" placeholder="Tell us about yourself..." />
              <p className="text-xs text-gray-400 mt-1 text-right">{formData.bio.length}/200</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Avatar URL</label>
              <input type="url" name="avatar" value={formData.avatar} onChange={handleChange} className="input" placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 btn btn-primary">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 btn btn-ghost">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <FaUser className="text-gray-400" size={14} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">@{user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <FaEnvelope className="text-gray-400" size={14} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
              </div>
            </div>
            {user?.bio && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bio</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{user.bio}</p>
              </div>
            )}

            {/* Theme toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                {isDarkMode ? <FaMoon className="text-gray-400" size={14} /> : <FaSun className="text-gray-400" size={14} />}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Theme</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isDarkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
