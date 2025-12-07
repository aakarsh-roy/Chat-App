import User from '../models/User.js';

// @desc    Search users
// @route   GET /api/contacts/search
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user._id }, // Exclude current user
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('username fullName email avatar status')
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user contacts
// @route   GET /api/contacts
// @access  Private
export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'contacts',
      'username fullName email avatar status lastSeen'
    );

    res.json(user.contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add contact
// @route   POST /api/contacts
// @access  Private
export const addContact = async (req, res) => {
  try {
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    if (contactId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as contact' });
    }

    const contact = await User.findById(contactId);

    if (!contact) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id);

    // Check if already a contact
    if (user.contacts.includes(contactId)) {
      return res.status(400).json({ message: 'User is already a contact' });
    }

    user.contacts.push(contactId);
    await user.save();

    const populatedUser = await User.findById(user._id).populate(
      'contacts',
      'username fullName email avatar status lastSeen'
    );

    res.json(populatedUser.contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove contact
// @route   DELETE /api/contacts/:contactId
// @access  Private
export const removeContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user.contacts.includes(contactId)) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    user.contacts = user.contacts.filter(
      (contact) => contact.toString() !== contactId
    );
    await user.save();

    res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
