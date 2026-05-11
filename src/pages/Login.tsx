import React, { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    IdCard,
    Lock,
    Eye,
    EyeOff,
    ArrowRight
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { authService } from '../services/api';
import { AlertCircle, Loader2 } from 'lucide-react';

export function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        citizenid: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id === 'login-cccd' ? 'citizenid' : 'password']: value
        }));
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = await authService.login(formData);
            localStorage.setItem('access_token', data.access_token);
            navigate('/chat');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Số CCCD hoặc mật khẩu không chính xác.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={<>Hệ thống Đa tác tử <br /><span className="text-primary-container">Hỗ trợ Thủ tục</span></>}
            subtitle="Nền tảng quản trị thông minh sử dụng trí tuệ nhân tạo để tối ưu hóa mọi quy trình hành chính công, mang lại trải nghiệm chính xác và minh bạch."
        >
            <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mb-8 relative group">
                    {/* Decorative background glow for the header area */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-end justify-between mb-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-75 animate-pulse" />
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-container-low flex items-center justify-center border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                                <Lock className="text-primary w-6 h-6 relative z-10" />
                            </div>
                        </div>
                        <div className="px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Secure</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-1"
                    >
                        <h2 className="font-headline text-3xl font-black tracking-tighter text-on-surface">
                            Chào mừng <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-container to-primary/50">trở lại.</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-0.5 w-6 bg-primary/30 rounded-full" />
                            <p className="text-on-surface-variant font-bold text-[9px] tracking-[0.2em] uppercase">
                                Xác thực đa tầng
                            </p>
                        </div>
                    </motion.div>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium"
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="login-cccd">Số CCCD</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                <IdCard size={20} />
                            </div>
                            <input
                                id="login-cccd"
                                type="text"
                                placeholder="Nhập 12 số CCCD"
                                value={formData.citizenid}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none disabled:opacity-50"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="block text-sm font-semibold text-on-surface-variant" htmlFor="login-password">Mật khẩu</label>
                            <a href="#" className="text-xs font-bold text-primary hover:underline">Quên mật khẩu?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-12 pr-12 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none disabled:opacity-50"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 space-y-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-headline font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-80"
                        >
                            {isLoading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    Đăng nhập
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-4 py-1">
                            <div className="h-px flex-1 bg-outline-variant/30" />
                            <span className="text-[10px] text-outline font-bold uppercase tracking-widest">hoặc</span>
                            <div className="h-px flex-1 bg-outline-variant/30" />
                        </div>

                        <button
                            type="button"
                            className="w-full py-3.5 bg-surface-container-low hover:bg-outline-variant/20 text-on-surface rounded-xl font-headline font-bold flex items-center justify-center gap-3 transition-all border border-transparent hover:border-outline-variant/30"
                        >
                            <img
                                src="https://th.bing.com/th?q=%e1%ba%a2nh+B%c3%aca+Vneid&w=120&h=120&c=1&rs=1&qlt=70&r=0&o=7&cb=1&dpr=1.3&pid=InlineBlock&rm=3&mkt=en-WW&cc=VN&setlang=en&adlt=moderate&t=1&mw=247"
                                alt="VNeID"
                                className="w-5 h-5 rounded-sm"
                                referrerPolicy="no-referrer"
                            />
                            Đăng nhập bằng VNeID
                        </button>
                    </div>
                </form>

                <p className="mt-4 text-center text-on-surface-variant text-sm">
                    Chưa có tài khoản?
                    <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-primary font-bold hover:underline ml-1"
                    >
                        Đăng ký mới
                    </button>
                </p>
            </motion.div>
        </AuthLayout>
    );
}
