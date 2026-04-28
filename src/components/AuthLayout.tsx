import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bot, ShieldCheck, Layout as LayoutIcon } from 'lucide-react';

interface AuthLayoutProps {
    children: ReactNode;
    title: ReactNode;
    subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-surface">
            {/* Left Section: Hero & Branding */}
            <section className="hidden md:flex md:col-span-7 relative flex-col justify-between p-8 lg:p-12 bg-surface-container-low">
                {/* Decorative Background */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                    <div className="absolute -right-24 -bottom-24 w-[600px] h-[600px] rounded-full bg-primary-container blur-[150px] opacity-20" />
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDARPQTVufHdO7VOLiku_M7XDkgegOrg3tB9Wd23XCJ_338kJFQBGGrjsnOiK95TVBwYruy7fPWP0pCVwIkUpGPRvDx_gOxTx2deBd2i6gfVM6EACeWTO6NWbaLAUIbSmUVtGLhI-Gyv54ewIxhOrU4voOiHBJ2CVnzPxzkGvFhR3X-79gakkJgioC6iFEOO42TylNMzGiKNCa-qIqyuQFhe_lV-jIQjyXYKVXptg-EdX9BRBapuk2reFBkTZGLmjD_VMUxxdID3DOz"
                        alt="Background Network"
                        className="w-full h-full object-cover mix-blend-overlay opacity-30 grayscale"
                        referrerPolicy="no-referrer"
                    />
                </div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                            <LayoutIcon className="text-white w-6 h-6" />
                        </div>
                        <span className="font-headline font-extrabold text-2xl tracking-tighter text-primary">Cognitive Workspace</span>
                    </motion.div>

                    <div className="overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <h1 className="font-headline text-4xl lg:text-5xl font-bold leading-[1.1] text-on-surface max-w-2xl">
                                {title}
                            </h1>
                        </motion.div>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-base text-on-surface-variant max-w-md font-sans leading-relaxed"
                    >
                        {subtitle}
                    </motion.p>
                </div>

                {/* Agent Cards */}
                <div className="relative z-10 space-y-3 max-w-md mt-8 pb-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-surface-container-lowest/80 backdrop-blur-md p-4 rounded-2xl border border-white/40 flex gap-4 items-start shadow-xl shadow-black/5"
                    >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Bot size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">EXECUTION AGENT</p>
                            <p className="text-sm font-medium text-on-surface">Đang xác thực thông tin định danh công dân...</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 10 }}
                        animate={{ opacity: 0.6, scale: 1, x: 20 }}
                        transition={{ delay: 0.5 }}
                        className="bg-surface-container-low/50 backdrop-blur-sm p-4 rounded-2xl border border-outline-variant/20 flex gap-4 items-start"
                    >
                        <div className="p-2 rounded-lg bg-on-surface-variant/10 text-on-surface-variant">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">CRITIC AGENT</p>
                            <p className="text-sm font-medium text-on-surface-variant">Đợi kết quả đối soát từ cơ sở dữ liệu quốc gia.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Right Section: Content */}
            <section className="col-span-1 md:col-span-5 flex flex-col justify-center items-center p-4 lg:p-8 bg-surface-container-lowest overflow-y-auto">
                <div className="w-full max-w-sm py-2">
                    {children}

                    <footer className="mt-8 pt-4 border-t border-outline-variant/10 flex flex-wrap justify-between items-center gap-4">
                        <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">
                            © {new Date().getFullYear()} Cognitive Workspace
                        </span>
                        <div className="flex gap-4">
                            <a href="#" className="text-[10px] font-bold text-outline uppercase tracking-tighter hover:text-primary transition-colors">Điều khoản</a>
                            <a href="#" className="text-[10px] font-bold text-outline uppercase tracking-tighter hover:text-primary transition-colors">Bảo mật</a>
                        </div>
                    </footer>
                </div>
            </section>
        </div>
    );
}
