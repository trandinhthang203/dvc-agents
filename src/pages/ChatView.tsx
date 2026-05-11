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
import { User, Sparkles, AlertTriangle } from 'lucide-react';
import { chatService, SSEEvent } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    steps?: AgentStep[];
    /** True while the AI is still writing */
    streaming?: boolean;
    error?: string;
}

// TODO: replace with the session ID returned by your session-creation API
const CHAT_SESSION_ID = '0fdf18ce-bc8a-46c4-b99b-a729df22e0c4';

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Auto-scroll to bottom whenever messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Clean up any in-flight SSE request when the component unmounts
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleSend = (content: string) => {
        if (!content.trim() || isStreaming) return;

        // Cancel any previous stream
        abortRef.current?.abort();

        const userMsgId = Date.now().toString();
        const assistantMsgId = (Date.now() + 1).toString();

        const userMsg: ChatMessage = { id: userMsgId, role: 'user', content };
        const assistantMsg: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            steps: [],
            streaming: true,
        };

        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);

        const controller = chatService.streamMessage(
            {
                idchatsession: CHAT_SESSION_ID,
                msgcontent: content,
                isfromuser: true,
            },
            (event: SSEEvent) => {
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.id !== assistantMsgId) return msg;

                        if (event.type === 'progress') {
                            const existingSteps = msg.steps ?? [];
                            const nodeExists = existingSteps.some(s => s.agentName === event.node);

                            if (nodeExists) {
                                // Reuse the existing step for this node → set to processing
                                return {
                                    ...msg,
                                    steps: existingSteps.map(s =>
                                        s.agentName === event.node
                                            ? { ...s, status: 'processing' as const, content: event.message }
                                            : s
                                    ),
                                };
                            }

                            // First time seeing this node → create one step for it
                            const newStep: AgentStep = {
                                id: event.node,
                                agentName: event.node,
                                title: event.node,
                                content: event.message,
                                status: 'processing',
                                time: new Date().toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                }),
                                type: 'execution',
                            };
                            return { ...msg, steps: [...existingSteps, newStep] };
                        }

                        if (event.type === 'result') {
                            // Find the step for this node, mark it completed and show result message
                            const updatedSteps = (msg.steps ?? []).map(s =>
                                s.agentName === event.node
                                    ? { ...s, status: 'completed' as const, content: event.message }
                                    : s
                            );
                            return { ...msg, steps: updatedSteps };
                        }

                        if (event.type === 'done') {
                            const completedSteps = (msg.steps ?? []).map(s => ({
                                ...s,
                                status: 'completed' as const,
                            }));
                            return { ...msg, streaming: false, steps: completedSteps };
                        }

                        if (event.type === 'error') {
                            return { ...msg, streaming: false, error: event.message };
                        }

                        return msg;
                    })
                );

                if (event.type === 'done' || event.type === 'error') {
                    setIsStreaming(false);
                }
            },
            (err) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMsgId
                            ? { ...msg, streaming: false, error: err.message }
                            : msg
                    )
                );
                setIsStreaming(false);
            },
        );

        abortRef.current = controller;
    };

    return (
        <div className="flex h-screen w-full bg-surface overflow-hidden">
            <Sidebar activeTab="new-chat" />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface">
                <Header />

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Chat column */}
                    <div className="flex-1 flex flex-col relative min-w-0">
                        {/* Scrollable message list */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-12 py-10 space-y-10 no-scrollbar pb-40 scroll-smooth"
                        >
                            {/* Empty state */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40 pt-20">
                                    <Sparkles size={44} className="text-primary" />
                                    <p className="text-sm font-medium text-secondary">
                                        Hãy đặt câu hỏi để bắt đầu trò chuyện...
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className="flex gap-5">
                                    {/* Avatar */}
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/10 ${
                                            msg.role === 'user'
                                                ? 'bg-surface-container-high'
                                                : 'bg-primary shadow-primary/20'
                                        }`}
                                    >
                                        {msg.role === 'user' ? (
                                            <User size={18} className="text-secondary" />
                                        ) : (
                                            <Sparkles size={18} className="text-on-primary" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-8">
                                        <div
                                            className={`${
                                                msg.role === 'user'
                                                    ? 'max-w-2xl bg-surface-container-low p-5'
                                                    : 'max-w-4xl'
                                            } rounded-3xl rounded-tl-none`}
                                        >
                                            {/* Error banner */}
                                            {msg.error && (
                                                <div className="flex items-center gap-2 text-xs font-medium mb-3 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 rounded-xl">
                                                    <AlertTriangle size={14} className="shrink-0" />
                                                    <span>{msg.error}</span>
                                                </div>
                                            )}

                                            {/* Agent stepper – only shown when there are steps */}
                                            {msg.steps && msg.steps.length > 0 && (
                                                <div className="mb-6 max-w-3xl">
                                                    <VerticalAgentStepper steps={msg.steps} />
                                                </div>
                                            )}

                                            {/* Message body */}
                                            <p
                                                className={`leading-relaxed text-sm ${
                                                    msg.role === 'assistant' ? 'font-medium' : ''
                                                }`}
                                            >
                                                {msg.content}
                                                {/* Blinking cursor while streaming */}
                                                {msg.streaming && (
                                                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sticky input bar */}
                        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                            <ChatInput onSend={handleSend} disabled={isStreaming} />
                        </div>
                    </div>

                    <Suggestions />
                </div>
            </main>
        </div>
    );
};
