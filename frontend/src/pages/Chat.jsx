import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import socketService from '../lib/socket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import UserProfile from '../components/UserProfile';
import SearchUsers from '../components/SearchUsers';
import CreateGroup from '../components/CreateGroup';
import { FaBars } from 'react-icons/fa';

export default function Chat() {
  const { 
    currentConversation, 
    fetchConversations, 
    addMessage, 
    updateOnlineUsers, 
    setTyping,
    updateMessageReadStatus,
    updateMessageDeliveredStatus,
    markAsDelivered,
    removeDeletedMessage,
    updateMessageReaction,
  } = useChatStore();
  const { user } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchConversations();

    const socket = socketService.getSocket();
    if (!socket) return;

    // Incoming messages
    socket.on('receive-message', (message) => {
      addMessage(message);
      fetchConversations();
      if (message.sender._id !== user._id) markAsDelivered(message._id);
    });

    // Online/offline status
    socket.on('user-online', ({ userId }) => updateOnlineUsers(userId, true));
    socket.on('user-offline', ({ userId }) => updateOnlineUsers(userId, false));

    // Typing
    socket.on('user-typing', ({ userId, username, isTyping }) => {
      if (currentConversation) setTyping(currentConversation._id, userId, username, isTyping);
    });

    // Read / delivered
    socket.on('message-read-update', ({ messageId, userId }) => updateMessageReadStatus(messageId, userId));
    socket.on('message-delivered-update', ({ messageId, userId }) => updateMessageDeliveredStatus(messageId, userId));

    // Deletion
    socket.on('message-deleted', ({ messageId, deleteType }) => {
      if (deleteType === 'forEveryone') { removeDeletedMessage(messageId); fetchConversations(); }
    });

    // Reactions
    socket.on('message-reaction-update', ({ messageId, reactions }) => {
      updateMessageReaction(messageId, reactions);
    });

    // Pin updates
    socket.on('message-pin-update', ({ messageId, isPinned }) => {
      // Update the message in the store
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) => m._id === messageId ? { ...m, isPinned } : m),
      }));
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('user-typing');
      socket.off('message-read-update');
      socket.off('message-delivered-update');
      socket.off('message-deleted');
      socket.off('message-reaction-update');
      socket.off('message-pin-update');
    };
  }, [currentConversation]);

  // Close sidebar when a conversation is selected (mobile)
  useEffect(() => {
    if (currentConversation) setSidebarOpen(false);
  }, [currentConversation]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          onProfileClick={() => setShowProfile(true)}
          onSearchClick={() => setShowSearch(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header bar */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <FaBars className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="font-semibold text-gray-800 dark:text-gray-100">ChatApp</h1>
        </div>

        {currentConversation ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center animate-fadeIn">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 rounded-3xl flex items-center justify-center">
                <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Welcome to ChatApp</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Select a conversation from the sidebar or start a new chat</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} onCreateGroupClick={() => setShowCreateGroup(true)} />}
      {showCreateGroup && <CreateGroup onClose={() => setShowCreateGroup(false)} />}
    </div>
  );
}
