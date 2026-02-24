import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import socketService from '../lib/socket';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: {},
  isLoading: false,

  setCurrentConversation: (conversation) => {
    // Leave previous conversation
    const prevConversation = get().currentConversation;
    if (prevConversation) {
      socketService.emit('leave-conversation', prevConversation._id);
    }

    set({ currentConversation: conversation, messages: [] });
    
    if (conversation) {
      get().fetchMessages(conversation._id);
      socketService.emit('join-conversation', conversation._id);
    }
  },

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      const { data } = await axiosInstance.get('/api/conversations');
      
      // Preserve currentConversation reference
      const currentConvId = get().currentConversation?._id;
      const updatedCurrentConv = currentConvId 
        ? data.find(conv => conv._id === currentConvId)
        : null;
      
      set({ 
        conversations: data, 
        isLoading: false,
        currentConversation: updatedCurrentConv || get().currentConversation
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId, page = 1) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/messages/${conversationId}?page=${page}&limit=50`
      );
      set({ messages: data.messages });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    }
  },

  sendMessage: async (conversationId, messageData) => {
    try {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      
      if (messageData.content) {
        formData.append('content', messageData.content);
      }
      
      if (messageData.file) {
        formData.append('file', messageData.file);
        formData.append('messageType', messageData.messageType || 'file');
      }
      
      if (messageData.replyTo) {
        formData.append('replyTo', messageData.replyTo);
      }

      const { data } = await axiosInstance.post('/api/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Add message to local state
      set((state) => ({
        messages: [...state.messages, data],
      }));

      // Emit via socket
      socketService.emit('send-message', {
        conversationId,
        message: data,
      });

      // Update conversation list
      get().fetchConversations();

      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      return null;
    }
  },

  createConversation: async (participantId) => {
    try {
      const { data } = await axiosInstance.post('/api/conversations', {
        participantId,
      });
      
      set((state) => ({
        conversations: [data, ...state.conversations],
      }));

      return data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  },

  clearChat: async (conversationId) => {
    try {
      await axiosInstance.delete(`/api/conversations/${conversationId}/messages`);
      
      set((state) => ({
        messages: state.currentConversation?._id === conversationId ? [] : state.messages,
      }));

      toast.success('Chat cleared');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      toast.error('Failed to clear chat');
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await axiosInstance.delete(`/api/conversations/${conversationId}`);
      
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
        currentConversation: state.currentConversation?._id === conversationId 
          ? null 
          : state.currentConversation,
        messages: state.currentConversation?._id === conversationId 
          ? [] 
          : state.messages,
      }));

      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  },

  markAsRead: async (messageId) => {
    try {
      await axiosInstance.put(`/api/messages/${messageId}/read`);
      
      socketService.emit('message-read', {
        conversationId: get().currentConversation?._id,
        messageId,
      });

      // Update local message status
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, readBy: [...(msg.readBy || []), { user: state.currentConversation?.participants.find(p => p._id !== msg.sender._id)?._id }] }
            : msg
        ),
      }));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  },

  markAsDelivered: async (messageId) => {
    try {
      socketService.emit('message-delivered', {
        conversationId: get().currentConversation?._id,
        messageId,
      });

      // Update local message status
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, deliveredTo: [...(msg.deliveredTo || []), { user: state.currentConversation?.participants.find(p => p._id !== msg.sender._id)?._id }] }
            : msg
        ),
      }));
    } catch (error) {
      console.error('Failed to mark message as delivered:', error);
    }
  },

  updateMessageReadStatus: (messageId, userId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, readBy: [...(msg.readBy || []), { user: userId, readAt: new Date() }] }
          : msg
      ),
    }));
  },

  updateMessageDeliveredStatus: (messageId, userId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, deliveredTo: [...(msg.deliveredTo || []), { user: userId, deliveredAt: new Date() }] }
          : msg
      ),
    }));
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateOnlineUsers: (userId, isOnline) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return { onlineUsers: newOnlineUsers };
    });
  },

  setTyping: (conversationId, userId, username, isTyping) => {
    set((state) => {
      const newTypingUsers = { ...state.typingUsers };
      
      if (isTyping) {
        newTypingUsers[conversationId] = { userId, username };
      } else {
        delete newTypingUsers[conversationId];
      }
      
      return { typingUsers: newTypingUsers };
    });
  },

  emitTyping: (conversationId, isTyping) => {
    socketService.emit('typing', { conversationId, isTyping });
  },

  deleteMessage: async (messageId, deleteType = 'forMe') => {
    try {
      const { data } = await axiosInstance.delete(
        `/api/messages/${messageId}?deleteType=${deleteType}`
      );

      // Remove message from local state or mark as deleted
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));

      // Emit socket event for real-time update
      socketService.emit('message-deleted', {
        conversationId: get().currentConversation?._id,
        messageId,
        deleteType,
      });

      // Update conversation list
      get().fetchConversations();

      toast.success(
        deleteType === 'forEveryone' 
          ? 'Message deleted for everyone' 
          : 'Message deleted for you'
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  },

  removeDeletedMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== messageId),
    }));
  },

  // ───── Reactions ─────
  reactToMessage: async (messageId, emoji) => {
    try {
      const { data } = await axiosInstance.post(`/api/messages/${messageId}/react`, { emoji });

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
        ),
      }));

      socketService.emit('message-reaction', {
        conversationId: get().currentConversation?._id,
        messageId,
        emoji,
        userId: data.reactions?.find(r => r.emoji === emoji)?.user?._id,
        action: 'toggle',
      });

      return data;
    } catch (error) {
      console.error('Failed to react to message:', error);
      toast.error('Failed to add reaction');
    }
  },

  updateMessageReaction: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, reactions } : msg
      ),
    }));
  },

  // ───── Forward ─────
  forwardMessage: async (messageId, conversationIds) => {
    try {
      const { data } = await axiosInstance.post(`/api/messages/${messageId}/forward`, {
        conversationIds,
      });
      toast.success(data.message);
      get().fetchConversations();
      return data;
    } catch (error) {
      console.error('Failed to forward message:', error);
      toast.error('Failed to forward message');
    }
  },

  // ───── Pin ─────
  togglePinMessage: async (messageId) => {
    try {
      const { data } = await axiosInstance.put(`/api/messages/${messageId}/pin`);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, isPinned: data.isPinned, pinnedBy: data.pinnedBy, pinnedAt: data.pinnedAt }
            : msg
        ),
      }));

      socketService.emit('message-pin-toggle', {
        conversationId: get().currentConversation?._id,
        messageId,
        isPinned: data.isPinned,
        pinnedBy: data.pinnedBy,
      });

      toast.success(data.isPinned ? 'Message pinned' : 'Message unpinned');
      return data;
    } catch (error) {
      console.error('Failed to pin message:', error);
      toast.error(error.response?.data?.message || 'Failed to pin message');
    }
  },

  getPinnedMessages: async (conversationId) => {
    try {
      const { data } = await axiosInstance.get(`/api/messages/${conversationId}/pinned`);
      return data;
    } catch (error) {
      console.error('Failed to fetch pinned messages:', error);
      return [];
    }
  },

  // ───── Star ─────
  toggleStarMessage: async (messageId) => {
    try {
      const { data } = await axiosInstance.put(`/api/messages/${messageId}/star`);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                starredBy: data.starred
                  ? [...(msg.starredBy || []), 'me']
                  : (msg.starredBy || []).filter((id) => id !== 'me'),
              }
            : msg
        ),
      }));

      toast.success(data.starred ? 'Message starred' : 'Message unstarred');
      return data;
    } catch (error) {
      console.error('Failed to star message:', error);
      toast.error('Failed to star message');
    }
  },

  getStarredMessages: async (conversationId) => {
    try {
      const { data } = await axiosInstance.get(`/api/messages/${conversationId}/starred`);
      return data;
    } catch (error) {
      console.error('Failed to fetch starred messages:', error);
      return [];
    }
  },
}));
