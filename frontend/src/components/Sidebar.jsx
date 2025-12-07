import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { FaSearch, FaUserPlus, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar({ onProfileClick, onSearchClick }) {
  const { conversations, currentConversation, setCurrentConversation, onlineUsers } = useChatStore();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants.find((p) => p._id !== user._id);
    const name = conv.isGroup ? conv.groupName : otherUser?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationName = (conversation) => {
    if (conversation.isGroup) {
      return conversation.groupName;
    }
    const otherUser = conversation.participants.find((p) => p._id !== user._id);
    return otherUser?.fullName || 'Unknown';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroup) {
      return conversation.groupAvatar || 'https://ui-avatars.com/api/?name=Group&background=random';
    }
    const otherUser = conversation.participants.find((p) => p._id !== user._id);
    return otherUser?.avatar || 'https://ui-avatars.com/api/?name=User&background=random';
  };

  const isUserOnline = (conversation) => {
    if (conversation.isGroup) return false;
    const otherUser = conversation.participants.find((p) => p._id !== user._id);
    return onlineUsers.has(otherUser?._id);
  };

  const getLastMessageTime = (conversation) => {
    if (!conversation.lastMessageTime) return '';
    return formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-primary-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">ChatApp</h1>
          <div className="flex space-x-2">
            <button
              onClick={onProfileClick}
              className="p-2 hover:bg-primary-700 rounded-lg transition"
              title="Profile"
            >
              <FaUser />
            </button>
            <button
              onClick={logout}
              className="p-2 hover:bg-primary-700 rounded-lg transition"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* New Chat Button */}
        <button
          onClick={onSearchClick}
          className="mt-3 w-full flex items-center justify-center space-x-2 bg-white text-primary-600 py-2 rounded-lg hover:bg-primary-50 transition font-medium"
        >
          <FaUserPlus />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Click "New Chat" to start</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation._id}
              onClick={() => setCurrentConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                currentConversation?._id === conversation._id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={getConversationAvatar(conversation)}
                    alt={getConversationName(conversation)}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isUserOnline(conversation) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {getConversationName(conversation)}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {getLastMessageTime(conversation)}
                    </span>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.lastMessage.content || 'Media message'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
