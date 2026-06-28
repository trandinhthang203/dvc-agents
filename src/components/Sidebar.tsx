import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Settings,
  Search,
  MessageSquare,
  Clock,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { sessionService, ChatSession, userService, UserProfile } from '../services/api';

interface SidebarProps {
  sessions: ChatSession[];
  isLoading: boolean;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  isLoading, 
  activeSessionId, 
  onSelectSession, 
  onNewSession,
  onDeleteSession
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await userService.getCurrentUser();
        setUserProfile(user);
      } catch (err) {
        console.error("Failed to load user profile in sidebar", err);
      }
    };
    fetchUser();
  }, []);

  const formatSessionTime = (dateStr?: string) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      // If it's today, show only time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      // Otherwise show date
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      });
    } catch (e) {
      return 'Vừa xong';
    }
  };

  return (
    <aside className="w-64 h-screen bg-surface-container-low flex flex-col border-r border-outline-variant/10 font-headline">
      <div className="p-6 pb-2 space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-6 h-6 border-2 border-on-primary rounded-full border-t-transparent" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface leading-tight tracking-tight">DVC AGENTS</h1>
            <p className="text-[10px] uppercase tracking-widest text-secondary font-extrabold opacity-70">Hành chính công</p>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onNewSession}
          className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95"
        >
          <PlusCircle size={18} />
          Trò chuyện mới
        </button>

        {/* Search Chats */}
        <div className="relative group px-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-highest/50 border-none rounded-xl text-[11px] focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-widest mb-2 opacity-60">Lịch sử trò chuyện</div>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((chat) => {
              const chatId = chat.idchatsession;
              if (!chatId) return null;

              const isActive = chatId === activeSessionId;
              const displayTitle = chat.first_message || chat.title || chat.name || chat.content || `Cuộc trò chuyện ${chatId.slice(0, 8)}`;

              return (
                <button
                  key={chatId}
                  onClick={() => onSelectSession(chatId)}
                  className={`w-full flex flex-col items-start gap-1 p-3 rounded-xl transition-all duration-200 group relative ${isActive
                    ? 'bg-surface-container-high border-outline-variant/10 shadow-sm'
                    : 'hover:bg-surface-container-high/60'
                    }`}
                >
                  <div className="flex items-center gap-2 w-full pr-6">
                    <MessageSquare size={14} className={isActive ? 'text-primary' : 'text-outline'} />
                    <span className={`text-xs truncate font-medium flex-1 text-left ${isActive ? 'text-primary' : 'text-on-surface/80'}`}>
                      {displayTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-50 px-5">
                    <Clock size={10} />
                    <span className="text-[9px]">{formatSessionTime(chat.createddate)}</span>
                  </div>
                  {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full" />}
                  
                  {/* Delete Button */}
                  <div 
                    onClick={(e) => onDeleteSession(e, chatId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-outline hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-surface-container-high rounded-lg transition-all">
          <Settings size={18} />
          <span className="text-sm font-medium">Cài đặt tài khoản</span>
        </Link>

        <Link to="/profile" className="p-3 bg-surface-container-highest/30 rounded-2xl flex items-center gap-3 border border-outline-variant/10 hover:border-primary/30 transition-all group">
          <div className="w-9 h-9 rounded-full bg-white overflow-hidden border border-outline-variant/10 shrink-0">
            {userProfile?.avatarurl ? (
              <img
                src={userProfile.avatarurl}
                alt={userProfile.fullname || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
                {(userProfile?.fullname || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-xs truncate group-hover:text-primary transition-colors">{userProfile?.fullname || 'Đang tải...'}</p>
            <p className="text-[10px] text-secondary font-medium tracking-wide">Hệ thống Điều phối</p>
          </div>
        </Link>
      </div>
    </aside>
  );
};
