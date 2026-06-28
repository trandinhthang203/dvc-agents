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
import { DynamicForm, DynamicFormPayload } from '../components/DynamicForm';
import { MapPanel, MapPayload } from '../components/MapPanel';
import { User, Sparkles, AlertTriangle } from 'lucide-react';
import { ChatMessageCreate, chatService, SSEEvent, SSEDynamicFormEvent, sessionService, ChatSession, formService, DynamicFormSubmitRequest } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams, useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    steps?: AgentStep[];
    /** True while the AI is still writing */
    streaming?: boolean;
    error?: string;
    /** Set when the backend yields a dynamic_form payload */
    formPayload?: DynamicFormPayload;
    /** True while the form submission SSE stream is running */
    formSubmitting?: boolean;
    /** True once the form has been accepted by the backend */
    formSubmitted?: boolean;
    /** Set when the location node returns origin + destination for map rendering */
    mapPayload?: MapPayload;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'document' | 'map'>('chat');
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);

    const handleLinkClick = (url: string) => {
        setDocumentUrl(url);
        setActiveTab('document');
    };

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    const fetchSessions = async (silent = false) => {
        if (!silent) setIsLoadingSessions(true);
        try {
            const data = await sessionService.getSessions();
            const sessionsList = data || [];
            setSessions(sessionsList);

            // Background enrichment: fetch first message for recent sessions
            // to display in the sidebar title
            (async () => {
                const enriched = await Promise.all(
                    sessionsList.slice(0, 15).map(async (s) => {
                        try {
                            const history = await sessionService.getSessionDetails(s.idchatsession);
                            if (history && history.length > 0) {
                                return { ...s, first_message: history[0].msgcontent };
                            }
                        } catch (e) {
                            // skip if failed
                        }
                        return s;
                    })
                );

                setSessions(prev => prev.map(s => {
                    const found = enriched.find(e => e.idchatsession === s.idchatsession);
                    return found || s;
                }));
            })();
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            if (!silent) setIsLoadingSessions(false);
        }
    };

    const handleNewSession = async () => {
        // If current session is already empty, don't create another one
        if (messages.length === 0 && currentSessionId) return;

        setMessages([]); // Clear messages for new session
        setCurrentSessionId(null);
        try {
            const session = await sessionService.createSession();
            const sid = session.idchatsession || session.id || session.session_id;
            if (sid) {
                navigate(`/chat/${sid}`);
            }
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    const handleSelectSession = async (id: string) => {
        navigate(`/chat/${id}`);
    };

    const loadSessionMessages = async (id: string) => {
        setMessages([]); // Clear current messages while loading
        try {
            const history = await sessionService.getSessionDetails(id);
            const mappedMessages: ChatMessage[] = history.map(msg => ({
                id: msg.idchatmessage || Math.random().toString(),
                role: msg.isfromuser ? 'user' : 'assistant',
                content: msg.msgcontent || '',
                steps: [], // Past steps are usually not re-rendered as active steps
                streaming: false
            }));
            setMessages(mappedMessages);
        } catch (err) {
            console.error('Failed to fetch session details:', err);
        }
    };

    // Watch URL sessionId changes
    useEffect(() => {
        if (sessionId) {
            setCurrentSessionId(sessionId);
            loadSessionMessages(sessionId);
            setActiveTab('chat');
        } else {
            // If no sessionId in URL, either load the latest or create new
            handleNewSession();
        }
    }, [sessionId]);

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await sessionService.deleteSession(id);
            setSessions(prev => prev.filter(s => s.idchatsession !== id));
            if (currentSessionId === id) {
                navigate('/chat');
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchSessions();
    }, []);

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

        if (!currentSessionId) {
            console.error("No active session!");
            return;
        }

        const controller = chatService.streamMessage(
            {
                idchatsession: currentSessionId,
                msgcontent: content,
                isfromuser: true,
            },
            (event: SSEEvent) => {
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.id !== assistantMsgId) return msg;

                        if (event.type === 'progress') {
                            // ── Dynamic form embedded in a progress event ──────────────
                            if (event.data?.kind === 'dynamic_form') {
                                const fp = event.data as DynamicFormPayload;
                                return {
                                    ...msg,
                                    streaming: false,
                                    content: '',
                                    formPayload: fp,
                                    formSubmitting: false,
                                    formSubmitted: false,
                                };
                            }

                            // ── Regular stepper step ───────────────────────────────────
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
                                id: event.node ?? 'unknown',
                                agentName: event.node ?? 'unknown',
                                title: event.node ?? 'unknown',
                                content: event.message ?? '',
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

                            // ── Location node → extract map payload ───────────
                            if (event.node === 'location' && event.data?.location) {
                                const loc = event.data.location;
                                const mapPayload: MapPayload = {
                                    origin: loc.origin ?? loc.start_address ?? '',
                                    destination: loc.destination ?? loc.end_address ?? '',
                                };
                                return { ...msg, steps: updatedSteps, mapPayload };
                            }

                            return { ...msg, steps: updatedSteps };
                        }

                        if (event.type === 'dynamic_form') {
                            // Backend wants us to replace the streaming message with a form
                            const formEvt = event as SSEDynamicFormEvent;
                            const formPayload: DynamicFormPayload = {
                                kind: 'dynamic_form',
                                request_id: formEvt.request_id,
                                title: formEvt.title,
                                description: formEvt.description,
                                submit_label: formEvt.submit_label,
                                pdf_path: formEvt.pdf_path,
                                fields: formEvt.fields,
                            };
                            return {
                                ...msg,
                                streaming: false,
                                content: '',
                                formPayload,
                                formSubmitting: false,
                                formSubmitted: false,
                            };
                        }

                        if (event.type === 'done') {
                            const completedSteps = (msg.steps ?? []).map(s => ({
                                ...s,
                                status: 'completed' as const,
                            }));
                            fetchSessions(true); // Silent refresh to update sidebar title/time
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
            () => {
                // Ensure streaming flag is cleared and steps completed when connection gracefully closes
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.id === assistantMsgId) {
                            return {
                                ...msg,
                                streaming: false,
                                steps: (msg.steps ?? []).map(s => ({
                                    ...s,
                                    status: s.status === 'processing' ? 'completed' : s.status,
                                })),
                            };
                        }
                        return msg;
                    })
                );
                setIsStreaming(false);
                fetchSessions(true);
            }
        );

        abortRef.current = controller;
    };

    // ─── Dynamic form submission ────────────────────────────────────────────────
    const handleFormSubmit = (
        msgId: string,
        requestId: string,
        values: Record<string, string | boolean>,
    ) => {
        if (!currentSessionId) return;

        // Mark this message's form as submitting
        setMessages(prev =>
            prev.map(msg =>
                msg.id === msgId ? { ...msg, formSubmitting: true } : msg
            )
        );

        // Append a new assistant reply that will stream the form result
        const replyMsgId = (Date.now() + 2).toString();
        const replyMsg: ChatMessage = {
            id: replyMsgId,
            role: 'assistant',
            content: '',
            steps: [],
            streaming: true,
        };
        setMessages(prev => [...prev, replyMsg]);
        setIsStreaming(true);

        abortRef.current?.abort();

        const submitPayload: DynamicFormSubmitRequest = {
            request_id: requestId,
            idchatsession: currentSessionId,
            values,
        };

        const controller = formService.submitForm(
            submitPayload,
            (event: SSEEvent) => {
                // Mark form as submitted on the first event received
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === msgId
                            ? { ...msg, formSubmitting: false, formSubmitted: true }
                            : msg
                    )
                );

                // Route the reply stream events exactly like handleSend
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.id !== replyMsgId) return msg;

                        if (event.type === 'progress') {
                            // ── Dynamic form embedded in a progress event ──────────────
                            if (event.data?.kind === 'dynamic_form') {
                                const fp = event.data as DynamicFormPayload;
                                // Mark the original form as submitted, replace reply with new form
                                setMessages(prev =>
                                    prev.map(m =>
                                        m.id === msgId
                                            ? { ...m, formSubmitting: false, formSubmitted: true }
                                            : m
                                    )
                                );
                                return {
                                    ...msg,
                                    streaming: false,
                                    content: '',
                                    formPayload: fp,
                                    formSubmitting: false,
                                    formSubmitted: false,
                                };
                            }

                            // ── Regular stepper step ───────────────────────────────────
                            const existingSteps = msg.steps ?? [];
                            const nodeExists = existingSteps.some(s => s.agentName === event.node);
                            if (nodeExists) {
                                return {
                                    ...msg,
                                    steps: existingSteps.map(s =>
                                        s.agentName === event.node
                                            ? { ...s, status: 'processing' as const, content: event.message }
                                            : s
                                    ),
                                };
                            }
                            const newStep: AgentStep = {
                                id: event.node ?? 'unknown',
                                agentName: event.node ?? 'unknown',
                                title: event.node ?? 'unknown',
                                content: event.message ?? '',
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
                            fetchSessions(true);
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
                    prev.map(msg => {
                        if (msg.id === msgId)
                            return { ...msg, formSubmitting: false, formSubmitted: false };
                        if (msg.id === replyMsgId)
                            return { ...msg, streaming: false, error: err.message };
                        return msg;
                    })
                );
                setIsStreaming(false);
            },
            () => {
                // Handle graceful close
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.id === replyMsgId) {
                            return {
                                ...msg,
                                streaming: false,
                                steps: (msg.steps ?? []).map(s => ({
                                    ...s,
                                    status: s.status === 'processing' ? 'completed' : s.status,
                                })),
                            };
                        }
                        // If form was submitting and connection closed without error, assume it succeeded
                        if (msg.id === msgId && msg.formSubmitting) {
                            return { ...msg, formSubmitting: false, formSubmitted: true };
                        }
                        return msg;
                    })
                );
                setIsStreaming(false);
                fetchSessions(true);
            }
        );

        abortRef.current = controller;
    };

    return (
        <div className="flex h-screen w-full bg-surface overflow-hidden">
            <Sidebar
                sessions={sessions}
                isLoading={isLoadingSessions}
                activeSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
            />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface">
                <Header activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Chat column */}
                    <div className={`flex-1 flex-col relative min-w-0 ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
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
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/10 ${msg.role === 'user'
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
                                            className={`${msg.role === 'user'
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
                                                    <VerticalAgentStepper steps={msg.steps} onLinkClick={handleLinkClick} />
                                                </div>
                                            )}

                                            {/* Inline map – rendered after location node completes */}
                                            {msg.mapPayload && !msg.streaming && (
                                                <div className="mb-4 max-w-3xl">
                                                    <MapPanel payload={msg.mapPayload} />
                                                </div>
                                            )}

                                            {/* Dynamic form – rendered instead of text */}
                                            {msg.formPayload ? (
                                                <DynamicForm
                                                    payload={msg.formPayload}
                                                    onSubmit={(reqId, values) =>
                                                        handleFormSubmit(msg.id, reqId, values)
                                                    }
                                                    submitting={msg.formSubmitting}
                                                    submitted={msg.formSubmitted}
                                                />
                                            ) : (
                                                <div
                                                    className={`leading-relaxed text-sm ${msg.role === 'assistant' ? 'font-medium' : ''
                                                        }`}
                                                >
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            a: ({ node, href, ...props }) => (
                                                                <a
                                                                    {...props}
                                                                    href={href}
                                                                    onClick={(e) => {
                                                                        if (href) {
                                                                            e.preventDefault();
                                                                            handleLinkClick(href);
                                                                        }
                                                                    }}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline font-medium cursor-pointer"
                                                                />
                                                            ),
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                            code: ({ node, inline, className, children, ...props }: any) => (
                                                                inline
                                                                    ? <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-[13px] font-mono text-on-surface" {...props}>{children}</code>
                                                                    : <code className="block bg-surface-container-high p-3 rounded-xl text-[13px] font-mono text-on-surface overflow-x-auto mb-2" {...props}>{children}</code>
                                                            )
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                    {/* Blinking cursor while streaming */}
                                                    {msg.streaming && (
                                                        <span className="inline-block w-1.5 h-4 bg-primary ml-1 align-middle animate-pulse" />
                                                    )}
                                                </div>
                                            )}
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

                    <div className={`${activeTab === 'chat' ? 'block shrink-0' : 'hidden'}`}>
                        <Suggestions />
                    </div>

                    {/* Document View */}
                    <div className={`flex-1 flex-col w-full h-full p-4 bg-surface-container-lowest ${activeTab === 'document' ? 'flex' : 'hidden'}`}>
                        {documentUrl ? (
                            <iframe
                                src={documentUrl}
                                className="w-full h-full border-0 rounded-2xl shadow-sm"
                                title="Tài liệu"
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-secondary opacity-50">
                                <p>Chưa có tài liệu nào được chọn</p>
                            </div>
                        )}
                    </div>

                    {/* Map View */}
                    <div className={`flex-1 flex-col w-full h-full p-4 bg-surface-container-lowest ${activeTab === 'map' ? 'flex' : 'hidden'}`}>
                        <div className="flex-1 flex items-center justify-center text-secondary opacity-50">
                            <p>Tính năng Bản đồ đang được phát triển</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
