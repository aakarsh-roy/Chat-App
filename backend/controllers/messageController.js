import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import fs from 'fs';
import path from 'path';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType, replyTo } = req.body;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    let messageData = {
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      messageType: messageType || 'text',
    };

    // Handle file upload
    if (req.file) {
      messageData.fileUrl = `/uploads/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.messageType = messageType || 'file';
    }

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    const message = await Message.create(messageData);
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar')
      .populate('replyTo');

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = message.createdAt;
    await conversation.save();

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username fullName avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out messages deleted by current user or deleted for everyone
    const filteredMessages = messages.filter(msg => {
      if (msg.deletedForEveryone) return false;
      if (msg.deletedBy && msg.deletedBy.some(userId => userId.toString() === req.user._id.toString())) {
        return false;
      }
      return true;
    });

    const count = await Message.countDocuments({ 
      conversation: conversationId,
      deletedForEveryone: false,
      deletedBy: { $nin: [req.user._id] }
    });

    res.json({
      messages: filteredMessages.reverse(),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already marked as read
    const alreadyRead = message.readBy.some(
      (read) => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId?deleteType=forMe|forEveryone
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const { deleteType } = req.query; // 'forMe' or 'forEveryone'
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized' });
    }

    if (deleteType === 'forEveryone') {
      // Only sender can delete for everyone
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only sender can delete message for everyone' });
      }

      // Check if message is not too old (e.g., within 48 hours)
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const maxAge = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
      
      if (messageAge > maxAge) {
        return res.status(403).json({ message: 'Cannot delete message older than 48 hours for everyone' });
      }

      // Mark as deleted for everyone
      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      message.content = ''; // Clear content for privacy

      // Delete file if exists
      if (message.fileUrl) {
        const filePath = path.join(process.cwd(), message.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        message.fileUrl = '';
        message.fileName = '';
        message.fileSize = 0;
      }

      await message.save();
      res.json({ message: 'Message deleted for everyone', deletedMessage: message });
    } else {
      // Delete for me only
      if (!message.deletedBy.includes(req.user._id)) {
        message.deletedBy.push(req.user._id);
        await message.save();
      }
      res.json({ message: 'Message deleted for you', deletedMessage: message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    React to a message
// @route   POST /api/messages/:messageId/react
// @access  Private
export const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify user is in conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if user already reacted with same emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction (toggle off)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction by this user, then add new one
      message.reactions = message.reactions.filter(
        (r) => r.user.toString() !== req.user._id.toString()
      );
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar')
      .populate('reactions.user', 'username fullName avatar')
      .populate('replyTo');

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forward a message to another conversation
// @route   POST /api/messages/:messageId/forward
// @access  Private
export const forwardMessage = async (req, res) => {
  try {
    const { conversationIds } = req.body;
    const originalMessage = await Message.findById(req.params.messageId);

    if (!originalMessage) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    if (!conversationIds || !conversationIds.length) {
      return res.status(400).json({ message: 'Please select at least one conversation' });
    }

    const forwardedMessages = [];

    for (const convId of conversationIds) {
      const conversation = await Conversation.findOne({
        _id: convId,
        participants: req.user._id,
      });

      if (!conversation) continue;

      const newMessage = await Message.create({
        conversation: convId,
        sender: req.user._id,
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        fileUrl: originalMessage.fileUrl,
        fileName: originalMessage.fileName,
        fileSize: originalMessage.fileSize,
        isForwarded: true,
        forwardedFrom: originalMessage._id,
      });

      const populated = await Message.findById(newMessage._id)
        .populate('sender', 'username fullName avatar');

      conversation.lastMessage = newMessage._id;
      conversation.lastMessageTime = newMessage.createdAt;
      await conversation.save();

      forwardedMessages.push(populated);
    }

    res.status(201).json({
      message: `Message forwarded to ${forwardedMessages.length} conversation(s)`,
      forwardedMessages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pin/unpin a message
// @route   PUT /api/messages/:messageId/pin
// @access  Private
export const togglePinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (message.isPinned) {
      message.isPinned = false;
      message.pinnedBy = undefined;
      message.pinnedAt = undefined;
      conversation.pinnedMessages = conversation.pinnedMessages.filter(
        (id) => id.toString() !== message._id.toString()
      );
    } else {
      // Limit pinned messages to 25
      if (conversation.pinnedMessages.length >= 25) {
        return res.status(400).json({ message: 'Maximum 25 pinned messages allowed' });
      }
      message.isPinned = true;
      message.pinnedBy = req.user._id;
      message.pinnedAt = new Date();
      conversation.pinnedMessages.push(message._id);
    }

    await Promise.all([message.save(), conversation.save()]);

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar')
      .populate('pinnedBy', 'username fullName');

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Star/unstar a message
// @route   PUT /api/messages/:messageId/star
// @access  Private
export const toggleStarMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const isStarred = message.starredBy.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (isStarred) {
      message.starredBy = message.starredBy.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      message.starredBy.push(req.user._id);
    }

    await message.save();
    res.json({ starred: !isStarred, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get starred messages for a conversation
// @route   GET /api/messages/:conversationId/starred
// @access  Private
export const getStarredMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      starredBy: req.user._id,
      deletedForEveryone: false,
      deletedBy: { $nin: [req.user._id] },
    })
      .populate('sender', 'username fullName avatar')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pinned messages for a conversation
// @route   GET /api/messages/:conversationId/pinned
// @access  Private
export const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      isPinned: true,
      deletedForEveryone: false,
    })
      .populate('sender', 'username fullName avatar')
      .populate('pinnedBy', 'username fullName')
      .sort({ pinnedAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
