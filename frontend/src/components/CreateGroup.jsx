import { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaCheck } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function CreateGroup({ onClose }) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    searchUsers();
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      const { data } = await axiosInstance.get(`/api/contacts/search?query=${searchQuery}`);
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 1) {
      toast.error('Please select at least 1 member');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await axiosInstance.post('/api/conversations/group', {
        groupName: groupName.trim(),
        participants: selectedUsers.map((u) => u._id),
      });

      toast.success('Group created successfully');
      await fetchConversations();
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-700 rounded-lg transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCreateGroup} className="flex flex-col h-[calc(90vh-80px)]">
          {/* Group Name */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="input w-full"
              required
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="p-4 border-b">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Members ({selectedUsers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full"
                  >
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm">{user.fullName}</span>
                    <button
                      type="button"
                      onClick={() => toggleUserSelection(user)}
                      className="hover:text-primary-900"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div className="p-4 border-b">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users to add..."
              className="input w-full"
            />
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-4">
            {allUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FaUserPlus className="mx-auto text-4xl mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allUsers.map((user) => {
                  const isSelected = selectedUsers.find((u) => u._id === user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user)}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={isLoading || !groupName.trim() || selectedUsers.length < 1}
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
