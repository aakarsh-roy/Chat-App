import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { FaPaperPlane, FaPaperclip, FaSmile, FaEllipsisV, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import ViewUserProfile from './ViewUserProfile';
import toast from 'react-hot-toast';

export default function ChatWindow() {
  const { currentConversation, messages, sendMessage, emitTyping, typingUsers, markAsRead, deleteConversation, clearChat } = useChatStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const otherUser = currentConversation?.participants?.find((p) => p._id !== user._id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a conversation to start chatting
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    scrollToBottom();
    
    // Mark messages as read
    messages.forEach((msg) => {
      if (msg.sender._id !== user._id) {
        const isRead = msg.readBy?.some((r) => r.user === user._id);
        if (!isRead) {
          markAsRead(msg._id);
        }
      }
    });
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    await sendMessage(currentConversation._id, {
      content: messageInput,
      messageType: 'text',
    });

    setMessageInput('');
    setShowEmojiPicker(false);
    
    // Stop typing indicator
    if (isTyping) {
      emitTyping(currentConversation._id, false);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Typing indicator logic
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(currentConversation._id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(currentConversation._id, false);
    }, 2000);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const messageType = file.type.startsWith('image/') ? 'image' : 'file';
    const conversationId = currentConversation._id;

    // Clear the input immediately to allow selecting the same file again
    e.target.value = '';

    await sendMessage(conversationId, {
      file,
      messageType,
      content: '',
    });
  };

  const formatMessageTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const getMessageStatus = (message) => {
    if (message.sender._id !== user._id) return null;
    
    const isRead = message.readBy && message.readBy.length > 0;
    const isDelivered = message.deliveredTo && message.deliveredTo.length > 0;
    
    if (isRead) {
      return <FaCheckDouble className="inline text-blue-500 ml-1" size={12} title="Read" />;
    } else if (isDelivered) {
      return <FaCheckDouble className="inline text-gray-400 ml-1" size={12} title="Delivered" />;
    } else {
      return <FaCheck className="inline text-gray-400 ml-1" size={12} title="Sent" />;
    }
  };

  const conversationName = currentConversation?.isGroup
    ? currentConversation.groupName
    : otherUser?.fullName || 'Unknown';

  const conversationAvatar = currentConversation?.isGroup
    ? currentConversation.groupAvatar
    : otherUser?.avatar;

  const typingUser = typingUsers[currentConversation?._id];

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
      try {
        await clearChat(currentConversation._id);
        setShowDropdown(false);
        toast.success('Chat cleared successfully');
      } catch (error) {
        toast.error('Failed to clear chat');
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(currentConversation._id);
        setShowDropdown(false);
        toast.success('Conversation deleted successfully');
      } catch (error) {
        toast.error('Failed to delete conversation');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
        <div 
          className={`flex items-center space-x-3 flex-1 ${!currentConversation.isGroup ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -m-2 p-2 rounded-lg transition' : ''}`}
          onClick={() => !currentConversation.isGroup && setShowUserProfile(true)}
        >
          <img
            src={conversationAvatar || 'https://ui-avatars.com/api/?name=User'}
            alt={conversationName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{conversationName}</h2>
            {typingUser ? (
              <p className="text-sm text-primary-600 dark:text-primary-400">typing...</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentConversation.isGroup 
                  ? `${currentConversation.participants.length} members`
                  : otherUser?.status === 'online' ? 'Online' : 'Offline'
                }
              </p>
            )}
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FaEllipsisV className="text-gray-600 dark:text-gray-300" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fadeIn">
              <button
                onClick={handleClearChat}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 text-gray-700 dark:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Chat</span>
              </button>
              <button
                onClick={handleDeleteConversation}
                className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center space-x-2 text-red-600 dark:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Delete Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => {
          const isSent = message.sender._id === user._id;
          
          return (
            <div
              key={message._id}
              className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`flex items-end space-x-2 max-w-xs md:max-w-md ${isSent ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isSent && (
                  <img
                    src={message.sender.avatar}
                    alt={message.sender.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className={`message-bubble ${isSent ? 'message-sent' : 'message-received'}`}>
                    {message.messageType === 'text' && <p>{message.content}</p>}
                    
                    {message.messageType === 'image' && (
                      <div>
                        <img
                          src={message.fileUrl}
                          alt="Shared image"
                          className="rounded-lg max-w-full mb-1"
                        />
                        {message.content && <p className="mt-2">{message.content}</p>}
                      </div>
                    )}
                    
                    {message.messageType === 'file' && (
                      <div className="flex items-center space-x-2">
                        <FaPaperclip />
                        <div>
                          <p className="font-medium">{message.fileName}</p>
                          <p className="text-xs opacity-75">
                            {(message.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 flex items-center ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isSent && getMessageStatus(message)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FaSmile className="text-gray-600 dark:text-gray-300 text-xl" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FaPaperclip className="text-gray-600 dark:text-gray-300 text-xl" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 input"
          />

          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="btn btn-primary p-3 rounded-full"
          >
            <FaPaperPlane />
          </button>
        </form>

        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* View User Profile Modal */}
      {showUserProfile && otherUser && (
        <ViewUserProfile
          user={otherUser}
          onClose={() => setShowUserProfile(false)}
          onDeleteChat={handleDeleteConversation}
        />
      )}
    </div>
  );
}
