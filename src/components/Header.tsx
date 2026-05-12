import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'document' | 'map';
  onTabChange: (tab: 'chat' | 'document' | 'map') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="h-16 px-8 flex justify-between items-center bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 sticky top-0 z-20">
      <div className="flex items-center gap-8">
        <h2 className="text-primary font-bold text-lg tracking-tight font-headline"></h2>
        <nav className="flex gap-6">
          <button 
            onClick={() => onTabChange('chat')}
            className={`transition-all text-sm ${activeTab === 'chat' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary hover:text-primary font-medium pb-[6px]'}`}
          >
            Hội thoại
          </button>
          <button 
            onClick={() => onTabChange('document')}
            className={`transition-all text-sm ${activeTab === 'document' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary hover:text-primary font-medium pb-[6px]'}`}
          >
            Tài liệu
          </button>
          <button 
            onClick={() => onTabChange('map')}
            className={`transition-all text-sm ${activeTab === 'map' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary hover:text-primary font-medium pb-[6px]'}`}
          >
            Bản đồ
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-xs w-64 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
        </div>
        <button className="p-2 text-outline hover:text-primary hover:bg-surface-container-low rounded-full transition-all">
          <Bell size={18} />
        </button>
        <button className="p-2 text-outline hover:text-primary hover:bg-surface-container-low rounded-full transition-all">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};
