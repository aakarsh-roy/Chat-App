import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { FaTimes, FaUser, FaEnvelope, FaEdit, FaCamera } from 'react-icons/fa';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function UserProfile({ onClose }) {
  const { user, updateProfile } = useAuthStore();
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
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
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="relative inline-block">
            <img
              src={formData.avatar || user?.avatar}
              alt={user?.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary-500"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition shadow-lg"
              title="Change profile picture"
            >
              <FaCamera className="text-sm" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          {isUploading && (
            <p className="text-sm text-primary-600 mt-2">Uploading...</p>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary text-sm mt-3"
            >
              <FaEdit className="inline mr-2" />
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input"
                rows="3"
                maxLength="200"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="input"
                placeholder="https://..."
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="flex-1 btn btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FaUser className="text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium">{user?.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FaEnvelope className="text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            {user?.bio && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Bio</p>
                <p className="text-gray-900">{user.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
