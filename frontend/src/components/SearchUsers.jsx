import { useState } from 'react';
import { FaTimes, FaSearch, FaUser } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function SearchUsers({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createConversation, setCurrentConversation } = useChatStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/api/auth/search?query=${searchQuery}`);
      setSearchResults(data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (userId) => {
    const conversation = await createConversation(userId);
    if (conversation) {
      setCurrentConversation(conversation);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Find Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="input pl-10"
            />
          </div>
          <button type="submit" className="w-full btn btn-primary mt-3">
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'No users found' : 'Enter a name to search'}
            </p>
          ) : (
            searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartChat(user._id)}
                  className="btn btn-primary text-sm"
                >
                  Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
