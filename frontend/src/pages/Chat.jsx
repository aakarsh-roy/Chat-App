import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import socketService from '../lib/socket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import UserProfile from '../components/UserProfile';
import SearchUsers from '../components/SearchUsers';

export default function Chat() {
  const { currentConversation, fetchConversations, addMessage, updateOnlineUsers, setTyping } = useChatStore();
  const { user } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    // Fetch conversations on mount
    fetchConversations();

    // Set up socket listeners
    const socket = socketService.getSocket();

    if (socket) {
      // Handle incoming messages
      socket.on('receive-message', (message) => {
        addMessage(message);
        fetchConversations(); // Update conversation list
      });

      // Handle user online status
      socket.on('user-online', ({ userId }) => {
        updateOnlineUsers(userId, true);
      });

      socket.on('user-offline', ({ userId }) => {
        updateOnlineUsers(userId, false);
      });

      // Handle typing indicator
      socket.on('user-typing', ({ userId, username, isTyping }) => {
        if (currentConversation) {
          setTyping(currentConversation._id, userId, username, isTyping);
        }
      });

      // Handle message read status
      socket.on('message-read-update', ({ messageId, userId }) => {
        // Update message read status in UI
        console.log(`Message ${messageId} read by ${userId}`);
      });
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
        socket.off('user-online');
        socket.off('user-offline');
        socket.off('user-typing');
        socket.off('message-read-update');
      }
    };
  }, [currentConversation]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        onProfileClick={() => setShowProfile(true)}
        onSearchClick={() => setShowSearch(true)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                Welcome to ChatApp
              </h3>
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {/* Search Users Modal */}
      {showSearch && (
        <SearchUsers onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}
