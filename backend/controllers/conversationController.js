import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Get all conversations for user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username fullName avatar status')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).populate('participants', 'username fullName avatar status');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new conversation
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const { participantId, isGroup, groupName, participants } = req.body;

    let conversationData;

    if (isGroup) {
      // Create group conversation
      conversationData = {
        participants: [req.user._id, ...participants],
        isGroup: true,
        groupName,
        groupAdmin: req.user._id,
      };
    } else {
      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [req.user._id, participantId] },
      }).populate('participants', 'username fullName avatar status');

      if (existingConversation) {
        return res.json(existingConversation);
      }

      // Create one-on-one conversation
      conversationData = {
        participants: [req.user._id, participantId],
        isGroup: false,
      };
    }

    const conversation = await Conversation.create(conversationData);
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status');

    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Delete all messages in conversation
    await Message.deleteMany({ conversation: conversation._id });

    // Delete conversation
    await conversation.deleteOne();

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
