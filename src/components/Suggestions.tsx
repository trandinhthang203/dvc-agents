import React from 'react';
import { Lightbulb, HelpCircle, ShieldCheck, ExternalLink, Download, FileText, File as PdfFile } from 'lucide-react';

export const Suggestions: React.FC = () => {
  return (
    <aside className="w-80 bg-surface border-l border-outline-variant/10 p-6 flex flex-col gap-8 overflow-y-auto no-scrollbar">
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
          <Lightbulb size={16} className="text-primary" />
          Gợi ý thông minh
        </h3>
        <div className="space-y-2">
          {[
            'Lập bảng so sánh thời gian phản ứng từ các trạm',
            'Kiểm tra dự báo thời tiết tối nay tại khu vực',
            'Danh sách liên lạc khẩn cấp của Ban quản lý sân',
          ].map((text, i) => (
            <button 
              key={i} 
              className="w-full text-left p-3 rounded-xl bg-surface-container-low border border-outline-variant/5 text-xs text-secondary hover:bg-secondary-container hover:text-primary font-medium transition-all duration-200 hover:translate-x-1"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
          <HelpCircle size={16} className="text-primary" />
          Câu hỏi thường gặp
        </h3>
        <div className="space-y-4">
          <div className="group cursor-pointer">
            <p className="text-xs font-bold text-primary group-hover:underline mb-1">Làm thế nào để thay đổi cấp độ ưu tiên?</p>
            <p className="text-[11px] text-secondary line-clamp-2 leading-relaxed">Bạn có thể sử dụng câu lệnh "Nâng mức ưu tiên lên Cao" hoặc chọn trong phần cài đặt...</p>
          </div>
          <div className="group cursor-pointer">
            <p className="text-xs font-bold text-primary group-hover:underline mb-1">Dữ liệu bản đồ được cập nhật bao lâu một lần?</p>
            <p className="text-[11px] text-secondary line-clamp-2 leading-relaxed">Hệ thống cập nhật dữ liệu giao thông thời gian thực mỗi 60 giây từ nguồn điều phối thành phố.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Trình trợ giúp bảo mật</span>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed opacity-80">
          Mọi phản hồi được mã hóa đầu cuối và tuân thủ nghị định bảo vệ dữ liệu cá nhân của chính phủ.
        </p>
      </div>
    </aside>
  );
};
