import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { FaSearch, FaUserPlus, FaSignOutAlt, FaUser, FaMoon, FaSun } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar({ onProfileClick, onSearchClick }) {
  const { conversations, currentConversation, setCurrentConversation, onlineUsers } = useChatStore();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants.find((p) => p._id !== user._id);
    const name = conv.isGroup ? conv.groupName : otherUser?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationName = (conversation) => {
    if (conversation.isGroup) return conversation.groupName;
    const otherUser = conversation.participants.find((p) => p._id !== user._id);
    return otherUser?.fullName || 'Unknown';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroup) return conversation.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.groupName || 'G')}&background=0ea5e9&color=fff`;
    const otherUser = conversation.participants.find((p) => p._id !== user._id);
    return otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.fullName || 'U')}&background=0ea5e9&color=fff`;
  };

  const isUserOnline = (conversation) => {
    if (conversation.isGroup) return false;
    const otherUser = conversation.participants.find((p) => p._id !== user._id);
    return onlineUsers.has(otherUser?._id);
  };

  const getLastMessageTime = (conversation) => {
    if (!conversation.lastMessageTime) return '';
    return formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: false });
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return '';
    const msg = conversation.lastMessage;
    if (msg.messageType === 'image') return '📷 Photo';
    if (msg.messageType === 'audio') return '🎵 Audio';
    if (msg.messageType === 'file') return '📎 File';
    return msg.content || '';
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">ChatApp</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleDarkMode} className="p-2 hover:bg-white/10 rounded-lg transition" title="Toggle theme">
              {isDarkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
            <button onClick={onProfileClick} className="p-2 hover:bg-white/10 rounded-lg transition" title="Profile">
              <FaUser size={14} />
            </button>
            <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg transition" title="Logout">
              <FaSignOutAlt size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={13} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* New Chat */}
        <button
          onClick={onSearchClick}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white py-2 rounded-xl transition text-sm font-medium backdrop-blur-sm"
        >
          <FaUserPlus size={13} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Click &ldquo;New Chat&rdquo; to start</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isActive = currentConversation?._id === conversation._id;
            return (
              <div
                key={conversation._id}
                onClick={() => setCurrentConversation(conversation)}
                className={`px-3 py-3 cursor-pointer transition-all border-l-3 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-l-primary-500'
                    : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getConversationAvatar(conversation)}
                      alt={getConversationName(conversation)}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                    />
                    {isUserOnline(conversation) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold truncate text-sm ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}`}>
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                        {getLastMessageTime(conversation)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {getLastMessagePreview(conversation) || (conversation.isGroup ? `${conversation.participants.length} members` : 'Start a conversation')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer - Current user info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={user?.avatar || 'https://ui-avatars.com/api/?name=Me'} alt="You" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user?.fullName}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
