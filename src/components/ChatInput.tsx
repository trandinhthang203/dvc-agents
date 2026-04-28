import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Image, Send, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatInputProps {
  onSend: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-8 pointer-events-auto">
      <div className="glass-panel p-2 rounded-2xl border border-outline-variant/10 shadow-2xl">
        <div className="flex items-center gap-2 px-2 pb-2">
          <button className="p-2 text-outline hover:text-primary transition-all rounded-lg hover:bg-surface-container-low cursor-pointer">
            <Paperclip size={18} />
          </button>
          <button className="p-2 text-outline hover:text-primary transition-all rounded-lg hover:bg-surface-container-low cursor-pointer">
            <Image size={18} />
          </button>
          <div className="h-4 w-[1px] bg-outline-variant/30 mx-1" />
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-surface-container-high/50 text-[10px] font-bold text-secondary rounded-full flex items-center gap-1">
              <Zap size={10} className="text-primary" />
              Chế độ: Phản ứng nhanh
            </div>
            <div className="px-3 py-1 bg-surface-container-high/50 text-[10px] font-bold text-secondary rounded-full">
              Dữ liệu: Nội bộ
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 pr-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập yêu cầu điều phối tại đây..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-3 resize-none max-h-48 placeholder:text-outline/40 transition-[height] selection:bg-primary/10"
          />
          <button
            onClick={handleSend}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg shrink-0 active:scale-95 ${message.trim()
                ? 'bg-primary text-on-primary hover:bg-primary-hover shadow-primary/20 cursor-pointer'
                : 'bg-surface-container-high text-outline opacity-50 cursor-not-allowed'
              }`}
            disabled={!message.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <p className="text-center text-[10px] text-outline mt-3 font-medium opacity-40">
        Điều phối Viên AI có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.
      </p>
    </div>
  );
};
