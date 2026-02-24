import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import {
  FaPaperPlane, FaPaperclip, FaSmile, FaEllipsisV, FaCheck, FaCheckDouble,
  FaMicrophone, FaTrash, FaEllipsisH, FaShare, FaThumbtack, FaStar,
  FaRegStar, FaReply, FaTimes, FaArrowDown, FaDownload, FaSearchPlus,
} from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import ViewUserProfile from './ViewUserProfile';
import VoiceRecorder from './VoiceRecorder';
import toast from 'react-hot-toast';

// Quick-react emojis
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// ---------- Sub-components ----------

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10" onClick={onClose}>
        <FaTimes size={24} />
      </button>
      <a href={src} download className="absolute top-4 right-14 text-white/80 hover:text-white p-2 z-10" onClick={(e) => e.stopPropagation()}>
        <FaDownload size={20} />
      </a>
      <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function ForwardDialog({ conversations, onForward, onClose }) {
  const [selected, setSelected] = useState([]);
  const { user } = useAuthStore();

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  return (
    <div className="overlay animate-fadeIn" onClick={onClose}>
      <div className="modal max-w-sm w-full mx-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Forward Message</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><FaTimes /></button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {conversations.map((conv) => {
            const other = conv.participants?.find((p) => p._id !== user._id);
            const name = conv.isGroup ? conv.groupName : other?.fullName || 'Unknown';
            const avatar = conv.isGroup ? conv.groupAvatar : other?.avatar;
            return (
              <label key={conv._id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${selected.includes(conv._id) ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                <input type="checkbox" checked={selected.includes(conv._id)} onChange={() => toggle(conv._id)} className="accent-primary-600 w-4 h-4" />
                <img src={avatar || 'https://ui-avatars.com/api/?name=User'} alt={name} className="w-9 h-9 rounded-full object-cover" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</span>
              </label>
            );
          })}
        </div>
        <button
          disabled={selected.length === 0}
          onClick={() => { onForward(selected); onClose(); }}
          className="btn btn-primary w-full mt-4"
        >
          Forward to {selected.length || ''} chat{selected.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

function DateDivider({ date }) {
  const d = new Date(date);
  let label = format(d, 'MMM d, yyyy');
  if (isToday(d)) label = 'Today';
  else if (isYesterday(d)) label = 'Yesterday';
  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-3 py-1 text-xs font-medium bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 rounded-full backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

function ReactionBadges({ reactions, userId, onReact }) {
  if (!reactions || reactions.length === 0) return null;
  // Group reactions by emoji
  const groups = {};
  reactions.forEach((r) => {
    if (!groups[r.emoji]) groups[r.emoji] = [];
    groups[r.emoji].push(r.user);
  });
  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {Object.entries(groups).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition hover:scale-110 ${
            users.includes(userId)
              ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-300 dark:border-primary-600'
              : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}
          title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
        >
          <span>{emoji}</span>
          {users.length > 1 && <span className="text-gray-500 dark:text-gray-400">{users.length}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Main component ----------

export default function ChatWindow() {
  const {
    currentConversation, messages, conversations, sendMessage, emitTyping, typingUsers,
    markAsRead, deleteConversation, clearChat, deleteMessage,
    reactToMessage, forwardMessage, togglePinMessage, toggleStarMessage, getPinnedMessages,
  } = useChatStore();
  const { user } = useAuthStore();

  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [forwardMsgId, setForwardMsgId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [quickReactMsgId, setQuickReactMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const messageMenuRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const otherUser = currentConversation?.participants?.find((p) => p._id !== user._id);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (messageMenuRef.current && !messageMenuRef.current.contains(event.target)) {
        setMessageMenuId(null);
        setQuickReactMsgId(null);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No conversation placeholder
  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 rounded-3xl flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Select a conversation</h3>
          <p className="text-gray-500 dark:text-gray-400">Choose a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  // Mark as read + scroll
  useEffect(() => {
    scrollToBottom();
    messages.forEach((msg) => {
      if (msg.sender._id !== user._id && !msg.readBy?.some((r) => r.user === user._id)) {
        markAsRead(msg._id);
      }
    });
  }, [messages]);

  // Load pinned messages
  useEffect(() => {
    if (currentConversation?._id) {
      getPinnedMessages(currentConversation._id).then(setPinnedMessages).catch(() => {});
    }
  }, [currentConversation?._id]);

  // Scroll tracking for "scroll to bottom" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // --- Handlers ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const payload = { content: messageInput, messageType: 'text' };
    if (replyTo) payload.replyTo = replyTo._id;

    await sendMessage(currentConversation._id, payload);
    setMessageInput('');
    setShowEmojiPicker(false);
    setReplyTo(null);

    if (isTyping) {
      emitTyping(currentConversation._id, false);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(currentConversation._id, true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(currentConversation._id, false);
    }, 2000);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const messageType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';
    e.target.value = '';
    await sendMessage(currentConversation._id, { file, messageType, content: '' });
  };

  const handleVoiceSend = async (audioFile) => {
    await sendMessage(currentConversation._id, { file: audioFile, messageType: 'audio', content: '' });
    setShowVoiceRecorder(false);
  };

  const handleDeleteMessage = async (messageId, deleteType) => {
    const msg = deleteType === 'forEveryone' ? 'Delete this message for everyone?' : 'Delete this message for you?';
    if (window.confirm(msg)) {
      await deleteMessage(messageId, deleteType);
      setMessageMenuId(null);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    await reactToMessage(messageId, emoji);
    setQuickReactMsgId(null);
    setMessageMenuId(null);
  };

  const handleForward = async (conversationIds) => {
    if (forwardMsgId) {
      await forwardMessage(forwardMsgId, conversationIds);
      toast.success('Message forwarded');
      setForwardMsgId(null);
    }
  };

  const handlePin = async (messageId) => {
    await togglePinMessage(messageId);
    const updated = await getPinnedMessages(currentConversation._id);
    setPinnedMessages(updated);
    setMessageMenuId(null);
  };

  const handleStar = async (messageId) => {
    await toggleStarMessage(messageId);
    setMessageMenuId(null);
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear all messages in this chat?')) {
      try { await clearChat(currentConversation._id); setShowDropdown(false); toast.success('Chat cleared'); } catch { toast.error('Failed to clear chat'); }
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm('Delete this conversation?')) {
      try { await deleteConversation(currentConversation._id); setShowDropdown(false); toast.success('Conversation deleted'); } catch { toast.error('Failed to delete conversation'); }
    }
  };

  // --- Helpers ---
  const formatMessageTime = (date) => format(new Date(date), 'HH:mm');

  const getMessageStatus = (message) => {
    if (message.sender._id !== user._id) return null;
    const isRead = message.readBy?.length > 0;
    const isDelivered = message.deliveredTo?.length > 0;
    if (isRead) return <FaCheckDouble className="inline text-blue-500 ml-1" size={11} />;
    if (isDelivered) return <FaCheckDouble className="inline text-gray-400 ml-1" size={11} />;
    return <FaCheck className="inline text-gray-400 ml-1" size={11} />;
  };

  const shouldShowDateDivider = (msg, idx) => {
    if (idx === 0) return true;
    const prev = new Date(messages[idx - 1].createdAt).toDateString();
    const curr = new Date(msg.createdAt).toDateString();
    return prev !== curr;
  };

  const conversationName = currentConversation?.isGroup ? currentConversation.groupName : otherUser?.fullName || 'Unknown';
  const conversationAvatar = currentConversation?.isGroup ? currentConversation.groupAvatar : otherUser?.avatar;
  const typingUser = typingUsers[currentConversation?._id];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full">
      {/* ===== Header ===== */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div
          className={`flex items-center gap-3 flex-1 min-w-0 ${!currentConversation.isGroup ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -m-2 p-2 rounded-xl transition' : ''}`}
          onClick={() => !currentConversation.isGroup && setShowUserProfile(true)}
        >
          <div className="relative">
            <img src={conversationAvatar || 'https://ui-avatars.com/api/?name=User'} alt={conversationName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700" />
            {!currentConversation.isGroup && otherUser?.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{conversationName}</h2>
            {typingUser ? (
              <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1">
                typing<span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentConversation.isGroup ? `${currentConversation.participants.length} members` : otherUser?.status === 'online' ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Pinned toggle */}
          {pinnedMessages.length > 0 && (
            <button onClick={() => setShowPinnedPanel(!showPinnedPanel)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative" title="Pinned messages">
              <FaThumbtack className="text-gray-600 dark:text-gray-300" size={14} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pinnedMessages.length}</span>
            </button>
          )}

          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <FaEllipsisV className="text-gray-600 dark:text-gray-300" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scaleIn origin-top-right">
                <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <FaTrash size={12} /><span>Clear Chat</span>
                </button>
                <button onClick={handleDeleteConversation} className="w-full px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <FaTimes size={12} /><span>Delete Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Pinned Messages Panel ===== */}
      {showPinnedPanel && pinnedMessages.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50 px-4 py-2 flex-shrink-0 animate-slideInRight">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-1"><FaThumbtack size={10} /> Pinned Messages</span>
            <button onClick={() => setShowPinnedPanel(false)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800"><FaTimes size={12} /></button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pinnedMessages.map((msg) => (
              <div key={msg._id} className="text-xs text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2.5 py-1.5 truncate">
                <span className="font-medium">{msg.sender?.fullName}:</span> {msg.content || 'Media'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Messages Area ===== */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0 chat-bg relative">
        {messages.map((message, idx) => {
          const isSent = message.sender._id === user._id;
          const isStarred = message.starredBy?.includes(user._id);
          const isPinned = message.isPinned;

          return (
            <div key={message._id}>
              {shouldShowDateDivider(message, idx) && <DateDivider date={message.createdAt} />}
              <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1 animate-fadeIn`}>
                <div className={`flex items-end gap-2 max-w-xs md:max-w-md lg:max-w-lg ${isSent ? 'flex-row-reverse' : ''} group`}>
                  {!isSent && (
                    <img src={message.sender.avatar} alt={message.sender.username} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-600 flex-shrink-0 mb-4" />
                  )}
                  <div className="relative flex-1 min-w-0">
                    {/* Quick react + menu trigger */}
                    <div className={`absolute ${isSent ? '-left-8' : '-right-8'} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 z-10`}>
                      <button onClick={() => setQuickReactMsgId(quickReactMsgId === message._id ? null : message._id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-400 text-xs" title="React">
                        <FaSmile />
                      </button>
                      <button onClick={() => setMessageMenuId(messageMenuId === message._id ? null : message._id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-400 text-xs" title="More">
                        <FaEllipsisH />
                      </button>
                    </div>

                    {/* Quick reaction picker */}
                    {quickReactMsgId === message._id && (
                      <div ref={messageMenuRef} className={`absolute ${isSent ? 'right-0' : 'left-0'} -top-10 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-2 py-1 z-50 animate-scaleIn`}>
                        {QUICK_REACTIONS.map((emoji) => (
                          <button key={emoji} onClick={() => handleReaction(message._id, emoji)} className="text-lg hover:scale-125 transition-transform px-0.5">{emoji}</button>
                        ))}
                      </div>
                    )}

                    {/* Message context menu */}
                    {messageMenuId === message._id && !quickReactMsgId && (
                      <div ref={messageMenuRef} className={`absolute ${isSent ? 'right-0' : 'left-0'} top-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[170px] animate-scaleIn`}>
                        <button onClick={() => { setReplyTo(message); setMessageMenuId(null); }} className="w-full px-3.5 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FaReply size={11} /><span>Reply</span>
                        </button>
                        <button onClick={() => { setForwardMsgId(message._id); setMessageMenuId(null); }} className="w-full px-3.5 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FaShare size={11} /><span>Forward</span>
                        </button>
                        <button onClick={() => handlePin(message._id)} className="w-full px-3.5 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FaThumbtack size={11} /><span>{isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button onClick={() => handleStar(message._id)} className="w-full px-3.5 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          {isStarred ? <FaStar size={11} className="text-yellow-500" /> : <FaRegStar size={11} />}<span>{isStarred ? 'Unstar' : 'Star'}</span>
                        </button>
                        <hr className="my-1 border-gray-100 dark:border-gray-700" />
                        <button onClick={() => handleDeleteMessage(message._id, 'forMe')} className="w-full px-3.5 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FaTrash size={11} /><span>Delete for me</span>
                        </button>
                        {isSent && (
                          <button onClick={() => handleDeleteMessage(message._id, 'forEveryone')} className="w-full px-3.5 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <FaTrash size={11} /><span>Delete for everyone</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* The message bubble */}
                    <div className={`message-bubble ${isSent ? 'message-sent' : 'message-received'} ${isPinned ? 'ring-1 ring-yellow-400/50' : ''}`}>
                      {/* Forwarded label */}
                      {message.isForwarded && (
                        <p className="text-[10px] italic text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><FaShare size={8} /> Forwarded</p>
                      )}

                      {/* Reply preview */}
                      {message.replyTo && (
                        <div className="text-xs bg-black/5 dark:bg-white/5 border-l-2 border-primary-400 rounded px-2 py-1 mb-1.5 truncate">
                          <span className="font-medium">{message.replyTo.sender?.fullName}</span>
                          <p className="truncate opacity-75">{message.replyTo.content || 'Media'}</p>
                        </div>
                      )}

                      {/* Star indicator */}
                      {isStarred && <FaStar className="absolute top-1.5 right-1.5 text-yellow-400" size={10} />}

                      {/* Content */}
                      {message.messageType === 'text' && <p className="break-words whitespace-pre-wrap">{message.content}</p>}

                      {message.messageType === 'image' && (
                        <div>
                          <img
                            src={message.fileUrl}
                            alt="Shared image"
                            className="rounded-lg max-w-full mb-1 cursor-pointer hover:opacity-90 transition"
                            onClick={() => setLightboxSrc(message.fileUrl)}
                          />
                          {message.content && <p className="mt-1">{message.content}</p>}
                        </div>
                      )}

                      {message.messageType === 'audio' && message.fileUrl && (
                        <audio src={message.fileUrl} controls className="max-w-[240px]" />
                      )}

                      {message.messageType === 'file' && (
                        <a href={message.fileUrl} download className="flex items-center gap-2 hover:underline">
                          <FaPaperclip />
                          <div>
                            <p className="font-medium text-sm">{message.fileName}</p>
                            <p className="text-xs opacity-75">{(message.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        </a>
                      )}
                    </div>

                    {/* Reactions */}
                    <ReactionBadges reactions={message.reactions} userId={user._id} onReact={(emoji) => handleReaction(message._id, emoji)} />

                    {/* Time + Status */}
                    <p className={`text-[10px] text-gray-500 mt-0.5 flex items-center gap-0.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
                      {isPinned && <FaThumbtack size={8} className="text-yellow-500 mr-0.5" />}
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isSent && getMessageStatus(message)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button onClick={scrollToBottom} className="sticky bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition animate-bounce-in z-20">
            <FaArrowDown className="text-gray-600 dark:text-gray-300" size={14} />
          </button>
        )}
      </div>

      {/* ===== Reply Preview ===== */}
      {replyTo && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-3 flex-shrink-0 animate-slideInRight">
          <div className="w-1 h-10 bg-primary-500 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">{replyTo.sender?.fullName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{replyTo.content || 'Media'}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><FaTimes className="text-gray-500" /></button>
        </div>
      )}

      {/* ===== Input Area ===== */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0 relative">
        {showVoiceRecorder ? (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoiceRecorder(false)} />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition" title="Emoji">
                <FaSmile className="text-gray-500 dark:text-gray-400 text-lg" />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition" title="Attach file">
                <FaPaperclip className="text-gray-500 dark:text-gray-400 text-lg" />
              </button>
              <button type="button" onClick={() => setShowVoiceRecorder(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition" title="Voice message">
                <FaMicrophone className="text-gray-500 dark:text-gray-400 text-lg" />
              </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,audio/*" />

            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 input !rounded-xl"
            />

            <button type="submit" disabled={!messageInput.trim()} className="btn btn-primary p-3 rounded-xl disabled:opacity-40">
              <FaPaperPlane />
            </button>
          </form>
        )}

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50 animate-scaleIn">
            <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" />
          </div>
        )}
      </div>

      {/* ===== Modals ===== */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Preview" onClose={() => setLightboxSrc(null)} />}

      {forwardMsgId && (
        <ForwardDialog
          conversations={conversations}
          onForward={handleForward}
          onClose={() => setForwardMsgId(null)}
        />
      )}

      {showUserProfile && otherUser && (
        <ViewUserProfile user={otherUser} onClose={() => setShowUserProfile(false)} onDeleteChat={handleDeleteConversation} />
      )}
    </div>
  );
}
