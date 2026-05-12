import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface AgentStep {
  id: string;
  agentName: string;
  title: string;
  content: string;
  status: 'completed' | 'processing' | 'pending' | 'error';
  time?: string;
  type: 'execution' | 'critic';
}

interface VerticalAgentStepperProps {
  steps: AgentStep[];
  onLinkClick?: (url: string) => void;
}

export const VerticalAgentStepper: React.FC<VerticalAgentStepperProps> = ({ steps, onLinkClick }) => {
  return (
    <div className="space-y-0 ml-4">
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-8 pb-8 last:pb-0">
          {/* Vertical Line Connector */}
          {index < steps.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-outline-variant/20">
              <motion.div 
                className="absolute inset-0 bg-primary origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: step.status === 'completed' ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Icon/Indicator */}
          <div className="relative z-10">
            <motion.div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                step.status === 'completed'
                  ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20'
                  : step.status === 'processing'
                  ? 'bg-surface-container-lowest border-primary text-primary'
                  : 'bg-surface-container-low border-outline-variant text-outline'
              }`}
              initial={false}
              animate={{
                scale: step.status === 'processing' ? 1.1 : 1,
              }}
            >
              {step.status === 'completed' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check size={14} strokeWidth={3} />
                </motion.div>
              ) : step.status === 'processing' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : step.status === 'error' ? (
                <AlertCircle size={14} className="text-error" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </motion.div>
          </div>

          {/* Content Card */}
          <motion.div 
            className={`flex-1 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 shadow-sm transition-all duration-300 ${
              step.status === 'processing' ? 'ring-2 ring-primary/5 border-primary/20' : ''
            } ${step.status === 'pending' ? 'opacity-50 grayscale' : 'opacity-100'}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: step.status === 'pending' ? 0.5 : 1, x: 0 }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step.type === 'execution' ? 'text-primary' : 'text-tertiary'}`}>
                  {step.agentName}
                </span>
                <AnimatePresence mode="wait">
                  {step.status === 'processing' && (
                    <motion.span 
                      key="proc"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full flex items-center gap-1"
                    >
                      <Loader2 size={8} className="animate-spin" />
                      Đang xử lý
                    </motion.span>
                  )}
                  {step.status === 'completed' && (
                    <motion.span 
                      key="comp"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] font-bold rounded-full"
                    >
                      Hoàn thành
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {step.time && <span className="text-[10px] text-outline font-medium">{step.time}</span>}
            </div>
            <div className="text-xs text-secondary leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, href, ...props }) => (
                    <a 
                      {...props} 
                      href={href}
                      onClick={(e) => {
                        if (onLinkClick && href) {
                          e.preventDefault();
                          onLinkClick(href);
                        }
                      }}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline font-medium cursor-pointer" 
                    />
                  ),
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  code: ({ node, inline, className, children, ...props }: any) => (
                    inline 
                      ? <code className="bg-surface-container-high px-1 py-0.5 rounded text-[11px] font-mono text-on-surface" {...props}>{children}</code>
                      : <code className="block bg-surface-container-high p-2 rounded-lg text-[11px] font-mono text-on-surface overflow-x-auto mb-2" {...props}>{children}</code>
                  )
                }}
              >
                {step.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
};
