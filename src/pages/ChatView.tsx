/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Suggestions } from '../components/Suggestions';
import { ChatInput } from '../components/ChatInput';
import { VerticalAgentStepper, AgentStep } from '../components/VerticalAgentStepper';
import {
    User,
    Sparkles,
    Map as MapIcon,
    FileText,
    Download,
    ExternalLink,
    File as FileIcon,
    FileType
} from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    steps?: AgentStep[];
}

export const ChatView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'user',
            content: 'Hãy giúp tôi lập kế hoạch điều phối xe cứu hỏa cho sự kiện tại SVĐ Quốc gia tối nay.'
        },
        {
            id: '2',
            role: 'assistant',
            content: 'Tôi đang phân tích yêu cầu điều phối của bạn. Dưới đây là lộ trình tư duy (Reasoning Trace) mà tôi đang thực hiện:',
            steps: [
                {
                    id: 's1',
                    agentName: 'Agent Điều Phối',
                    title: 'Xác định vị trí & Quy mô',
                    status: 'completed',
                    time: '10:42:01',
                    content: 'Đã truy xuất tọa độ SVĐ Quốc gia Mỹ Đình. Quy mô dự kiến: 40,000 người. Cần tối thiểu 3 xe chữa cháy thường trực.',
                    type: 'execution'
                },
                {
                    id: 's2',
                    agentName: 'Agent Phân Tích Rủi Ro',
                    title: 'Kiểm tra mật độ giao thông',
                    status: 'processing',
                    time: '10:42:15',
                    content: 'Đang tính toán thời gian phản ứng từ các trạm gần nhất (Cầu Giấy, Nam Từ Liêm) dựa trên dữ liệu giao thông thực tế lúc 19:00.',
                    type: 'critic'
                },
                {
                    id: 's3',
                    agentName: 'Agent Hành Chính',
                    title: 'Dự thảo lệnh điều phối',
                    status: 'pending',
                    content: 'Chờ kết quả phân tích giao thông để tối ưu lộ trình di chuyển của các đơn vị.',
                    type: 'execution'
                }
            ]
        }
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (content: string) => {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content
        };
        setMessages(prev => [...prev, userMsg]);

        // Simulate AI response for demo
        setTimeout(() => {
            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Yêu cầu của bạn đã được ghi nhận. Hệ thống đang trích xuất dữ liệu liên quan...',
            };
            setMessages(prev => [...prev, assistantMsg]);
        }, 1000);
    };

    return (
        <div className="flex h-screen w-full bg-surface overflow-hidden">
            <Sidebar activeTab="new-chat" />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface">
                <Header />

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Chat Container: Grouping messages and input together */}
                    <div className="flex-1 flex flex-col relative min-w-0">
                        {/* Main Chat Scrollable Content */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-12 py-10 space-y-10 no-scrollbar pb-40 scroll-smooth"
                        >
                            {messages.map((msg) => (
                                <div key={msg.id} className="flex gap-5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/10 ${msg.role === 'user' ? 'bg-surface-container-high' : 'bg-primary shadow-primary/20'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <User size={18} className="text-secondary" />
                                        ) : (
                                            <Sparkles size={18} className="text-on-primary" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-8">
                                        <div className={`${msg.role === 'user' ? 'max-w-2xl bg-surface-container-low p-5' : 'max-w-4xl'} rounded-3xl rounded-tl-none`}>
                                            <p className={`leading-relaxed text-sm ${msg.role === 'assistant' ? 'font-medium' : ''}`}>
                                                {msg.content}
                                            </p>

                                            {msg.steps && (
                                                <div className="mt-8 max-w-3xl">
                                                    <VerticalAgentStepper steps={msg.steps} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Show Attachments only for the first assistant message in this demo */}
                                        {msg.id === '2' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                                                {/* Map Preview */}
                                                <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                            <MapIcon size={12} className="text-primary" />
                                                            Bản đồ điều phối
                                                        </h5>
                                                        <ExternalLink size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                                    </div>
                                                    <div className="h-40 bg-surface-container-high rounded-2xl overflow-hidden relative border border-outline-variant/10">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600"
                                                            alt="Map"
                                                            className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                                                                <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Documents List */}
                                                <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                            <FileText size={12} className="text-primary" />
                                                            Tài liệu liên quan
                                                        </h5>
                                                        <Download size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer group/item">
                                                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                                                <FileType size={16} />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-on-surface truncate flex-1">Quy-dinh-PCCC-2024.pdf</span>
                                                            <Download size={12} className="text-outline group-hover/item:text-primary transition-colors" />
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer group/item">
                                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                                <FileIcon size={16} />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-on-surface truncate flex-1">Ke-hoach-Su-kien.docx</span>
                                                            <Download size={12} className="text-outline group-hover/item:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input area positioned at bottom - now scoped to this chat column */}
                        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                            <ChatInput onSend={handleSend} />
                        </div>
                    </div>

                    <Suggestions />
                </div>
            </main>
        </div>
    );
};
