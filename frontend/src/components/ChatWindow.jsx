import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { FaPaperPlane, FaPaperclip, FaSmile, FaEllipsisV } from 'react-icons/fa';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

export default function ChatWindow() {
  const { currentConversation, messages, sendMessage, emitTyping, typingUsers, markAsRead } = useChatStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const otherUser = currentConversation?.participants?.find((p) => p._id !== user._id);

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

    await sendMessage(currentConversation._id, {
      file,
      messageType,
      content: '',
    });

    e.target.value = '';
  };

  const formatMessageTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const conversationName = currentConversation?.isGroup
    ? currentConversation.groupName
    : otherUser?.fullName || 'Unknown';

  const conversationAvatar = currentConversation?.isGroup
    ? currentConversation.groupAvatar
    : otherUser?.avatar;

  const typingUser = typingUsers[currentConversation?._id];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={conversationAvatar || 'https://ui-avatars.com/api/?name=User'}
            alt={conversationName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold text-gray-900">{conversationName}</h2>
            {typingUser ? (
              <p className="text-sm text-primary-600">typing...</p>
            ) : (
              <p className="text-sm text-gray-500">
                {otherUser?.status === 'online' ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <FaEllipsisV className="text-gray-600" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <p className={`text-xs text-gray-500 mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FaSmile className="text-gray-600 text-xl" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FaPaperclip className="text-gray-600 text-xl" />
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
    </div>
  );
}
