import { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaUsers, FaTrash } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function ViewUserProfile({ user, onClose, onDeleteChat }) {
  const { user: currentUser } = useAuthStore();
  const { conversations } = useChatStore();
  const [groupsInCommon, setGroupsInCommon] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    findGroupsInCommon();
  }, [user, conversations]);

  const findGroupsInCommon = () => {
    try {
      // Find all group conversations where both users are participants
      const commonGroups = conversations.filter((conv) => {
        if (!conv.isGroup) return false;
        
        const hasCurrentUser = conv.participants.some(p => p._id === currentUser._id);
        const hasOtherUser = conv.participants.some(p => p._id === user._id);
        
        return hasCurrentUser && hasOtherUser;
      });

      setGroupsInCommon(commonGroups);
    } catch (error) {
      console.error('Error finding groups in common:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = () => {
    if (window.confirm(`Are you sure you want to delete this conversation with ${user.fullName}?`)) {
      onDeleteChat();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="sticky top-0 bg-primary-600 dark:bg-primary-700 text-white p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold">Profile Info</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-700 dark:hover:bg-primary-800 rounded-lg transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Profile Picture and Name */}
        <div className="text-center p-6 border-b border-gray-200 dark:border-gray-700">
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary-500 mb-4"
          />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
          <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 mt-3 px-4">{user.bio}</p>
          )}
        </div>

        {/* User Info */}
        <div className="p-6 space-y-3 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">About</h4>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FaUser className="text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Username</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">@{user.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FaEnvelope className="text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{user.status || 'Offline'}</p>
            </div>
          </div>
        </div>

        {/* Groups in Common */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <FaUsers className="text-gray-600 dark:text-gray-400" />
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">
              Groups in Common ({groupsInCommon.length})
            </h4>
          </div>

          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading...</p>
          ) : groupsInCommon.length > 0 ? (
            <div className="space-y-2">
              {groupsInCommon.map((group) => (
                <div
                  key={group._id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <img
                    src={group.groupAvatar || 'https://ui-avatars.com/api/?name=Group&background=random'}
                    alt={group.groupName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{group.groupName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.participants.length} members
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FaUsers className="text-gray-300 dark:text-gray-600 text-4xl mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No groups in common</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6">
          <button
            onClick={handleDeleteChat}
            className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-medium"
          >
            <FaTrash />
            <span>Delete Conversation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
