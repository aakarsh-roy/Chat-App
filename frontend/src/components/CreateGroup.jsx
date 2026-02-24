import { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaCheck, FaSearch } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function CreateGroup({ onClose }) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    const search = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/contacts/search?query=${searchQuery}`);
        setAllUsers(data);
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    };
    search();
  }, [searchQuery]);

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => prev.find((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) { toast.error('Please enter a group name'); return; }
    if (selectedUsers.length < 1) { toast.error('Please select at least 1 member'); return; }

    setIsLoading(true);
    try {
      await axiosInstance.post('/api/conversations/group', {
        groupName: groupName.trim(),
        participants: selectedUsers.map((u) => u._id),
      });
      toast.success('Group created');
      await fetchConversations();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overlay animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden animate-modalIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create New Group</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><FaTimes /></button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex flex-col" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Group name */}
          <div className="px-5 pt-4 pb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Group Name</label>
            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name..." className="input w-full" required />
          </div>

          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <div className="px-5 pb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Selected ({selectedUsers.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((u) => (
                  <span key={u._id} className="inline-flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 pl-1 pr-2 py-0.5 rounded-full text-xs">
                    <img src={u.avatar} alt="" className="w-5 h-5 rounded-full" />
                    {u.fullName}
                    <button type="button" onClick={() => toggleUserSelection(u)} className="hover:text-primary-900 dark:hover:text-primary-100"><FaTimes size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-5 pb-3">
            <div className="relative group">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={13} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users to add..." className="input w-full pl-10" />
            </div>
          </div>

          {/* Users list */}
          <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0" style={{ maxHeight: '250px' }}>
            {allUsers.length === 0 ? (
              <div className="text-center py-8">
                <FaUserPlus className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {allUsers.map((u) => {
                  const isSelected = selectedUsers.find((s) => s._id === u._id);
                  return (
                    <div key={u._id} onClick={() => toggleUserSelection(u)} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                      <img src={u.avatar} alt={u.fullName} className="w-9 h-9 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{u.fullName}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0"><FaCheck className="text-white" size={10} /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 btn btn-ghost">Cancel</button>
            <button type="submit" className="flex-1 btn btn-primary" disabled={isLoading || !groupName.trim() || selectedUsers.length < 1}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</span>
              ) : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
