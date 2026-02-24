import { useState } from 'react';
import { FaTimes, FaSearch, FaUser, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

export default function SearchUsers({ onClose, onCreateGroupClick }) {
  const [view, setView] = useState('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createConversation, setCurrentConversation } = useChatStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/api/auth/search?query=${searchQuery}`);
      setSearchResults(data);
    } catch { toast.error('Search failed'); }
    finally { setIsLoading(false); }
  };

  const handleStartChat = async (userId) => {
    const conversation = await createConversation(userId);
    if (conversation) { setCurrentConversation(conversation); onClose(); }
  };

  const handleCreateGroupClick = () => { onClose(); onCreateGroupClick(); };

  if (view === 'menu') {
    return (
      <div className="overlay animate-fadeIn" onClick={onClose}>
        <div className="modal max-w-md w-full mx-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">New Chat</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-500"><FaTimes /></button>
          </div>
          <div className="space-y-3">
            <button onClick={() => setView('search')} className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition group">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900/60 transition"><FaUser className="text-primary-600 dark:text-primary-400 text-lg" /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-900 dark:text-gray-100">New User</h3><p className="text-sm text-gray-500 dark:text-gray-400">Start a one-on-one chat</p></div>
            </button>
            <button onClick={handleCreateGroupClick} className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition group">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition"><FaUsers className="text-green-600 dark:text-green-400 text-lg" /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Create Group</h3><p className="text-sm text-gray-500 dark:text-gray-400">Chat with multiple people</p></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay animate-fadeIn" onClick={onClose}>
      <div className="modal max-w-md w-full mx-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-500"><FaArrowLeft size={14} /></button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1">Find Users</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-500"><FaTimes /></button>
        </div>
        <form onSubmit={handleSearch} className="mb-5">
          <div className="relative group">
            <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" size={13} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, username, or email..." className="input pl-10" autoFocus />
          </div>
          <button type="submit" disabled={isLoading} className="w-full btn btn-primary mt-3">
            {isLoading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Searching...</span> : 'Search'}
          </button>
        </form>
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="text-center py-10">
              <FaSearch className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{searchQuery ? 'No users found' : 'Enter a name to search'}</p>
            </div>
          ) : (
            searchResults.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt={u.fullName} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-600" />
                  <div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.fullName}</h3><p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p></div>
                </div>
                <button onClick={() => handleStartChat(u._id)} className="btn btn-primary text-xs px-3 py-1.5">Chat</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
