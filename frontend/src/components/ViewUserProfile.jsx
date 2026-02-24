import { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaUsers, FaTrash } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

export default function ViewUserProfile({ user, onClose, onDeleteChat }) {
  const { user: currentUser } = useAuthStore();
  const { conversations } = useChatStore();
  const [groupsInCommon, setGroupsInCommon] = useState([]);

  useEffect(() => {
    const commonGroups = conversations.filter((conv) => {
      if (!conv.isGroup) return false;
      return conv.participants.some((p) => p._id === currentUser._id) && conv.participants.some((p) => p._id === user._id);
    });
    setGroupsInCommon(commonGroups);
  }, [user, conversations, currentUser._id]);

  const handleDeleteChat = () => {
    if (window.confirm(`Delete conversation with ${user.fullName}?`)) { onDeleteChat(); onClose(); }
  };

  return (
    <div className="overlay animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-modalIn" onClick={(e) => e.stopPropagation()}>
        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-700 dark:to-primary-900 rounded-t-3xl pt-12 pb-16 px-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"><FaTimes /></button>
        </div>
        {/* Avatar overlapping */}
        <div className="-mt-12 text-center px-6">
          <img src={user.avatar} alt={user.fullName} className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-3">{user.fullName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.status || 'Offline'}</span>
          </div>
          {user.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-xs mx-auto">{user.bio}</p>}
        </div>

        {/* Info cards */}
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <FaEnvelope className="text-gray-400" size={14} />
            <div><p className="text-xs text-gray-500 dark:text-gray-400">Email</p><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p></div>
          </div>
        </div>

        {/* Groups in common */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <FaUsers className="text-gray-400" size={14} />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Groups in Common ({groupsInCommon.length})</h4>
          </div>
          {groupsInCommon.length > 0 ? (
            <div className="space-y-1.5">
              {groupsInCommon.map((g) => (
                <div key={g._id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <img src={g.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.groupName)}&background=0ea5e9&color=fff`} alt={g.groupName} className="w-9 h-9 rounded-full object-cover" />
                  <div className="min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{g.groupName}</p><p className="text-xs text-gray-500">{g.participants.length} members</p></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No groups in common</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={handleDeleteChat} className="w-full btn btn-danger gap-2"><FaTrash size={12} /> Delete Conversation</button>
        </div>
      </div>
    </div>
  );
}
