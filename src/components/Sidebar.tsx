import React from 'react';
import {
  PlusCircle,
  Settings,
  Search,
  MessageSquare,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab }) => {
  const chatHistory = [
    { id: '1', title: 'Điều phối xe cứu hỏa SVĐ', time: '10 phút trước' },
    { id: '2', title: 'Lập kế hoạch an ninh Quận 1', time: '2 giờ trước' },
    { id: '3', title: 'Phân bổ nhân sự trực Tết', time: 'Hôm qua' },
    { id: '4', title: 'Kiểm tra pccc chung cư Landmark', time: '2 ngày trước' },
  ];

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
        <button className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95">
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
        <div className="space-y-1">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className={`w-full flex flex-col items-start gap-1 p-3 rounded-xl transition-all duration-200 group relative ${chat.id === '1'
                ? 'bg-surface-container-high border-outline-variant/10 shadow-sm'
                : 'hover:bg-surface-container-high/60'
                }`}
            >
              <div className="flex items-center gap-2 w-full">
                <MessageSquare size={14} className={chat.id === '1' ? 'text-primary' : 'text-outline'} />
                <span className={`text-xs truncate font-medium flex-1 text-left ${chat.id === '1' ? 'text-primary' : 'text-on-surface/80'}`}>
                  {chat.title}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-50 px-5">
                <Clock size={10} />
                <span className="text-[9px]">{chat.time}</span>
              </div>
              {chat.id === '1' && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-surface-container-high rounded-lg transition-all">
          <Settings size={18} />
          <span className="text-sm font-medium">Cài đặt tài khoản</span>
        </a>

        <div className="p-3 bg-surface-container-highest/30 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
          <div className="w-9 h-9 rounded-full bg-white overflow-hidden border border-outline-variant/10">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-xs truncate">Admin Nguyễn Văn A</p>
            <p className="text-[10px] text-secondary font-medium tracking-wide">Hệ thống Điều phối</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
