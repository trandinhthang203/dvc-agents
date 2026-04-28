import { FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    IdCard,
    Lock,
    ArrowRight,
    ShieldCheck,
    User,
    Phone,
    Calendar,
    Users,
    ArrowLeft
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

export function Register() {
    const navigate = useNavigate();

    const handleRegister = (e: FormEvent) => {
        e.preventDefault();
        // Simulate registration
        navigate('/login');
    };

    return (
        <AuthLayout
            title={<>Khởi tạo Danh tính <br /><span className="text-primary-container">Công dân Số</span></>}
            subtitle="Đăng ký tài khoản cá nhân để tiếp cận các dịch vụ hành chính công trực tuyến một cách an toàn và bảo mật."
        >
            <motion.div
                key="register"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 text-primary font-bold text-xs mb-3 hover:translate-x-[-2px] transition-transform"
                >
                    <ArrowLeft size={14} /> Quay lại đăng nhập
                </button>

                <div className="mb-6 relative group">
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-end justify-between mb-4"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-75 animate-pulse" />
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-container-low flex items-center justify-center border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                                <IdCard className="text-primary w-6 h-6 relative z-10" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-1"
                    >
                        <h2 className="font-headline text-2xl font-black tracking-tighter text-on-surface">
                            Đăng ký <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-container to-primary/50">tài khoản.</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-0.5 w-6 bg-primary/30 rounded-full" />
                            <p className="text-on-surface-variant font-bold text-[9px] tracking-[0.2em] uppercase">
                                Khởi tạo danh tính số
                            </p>
                        </div>
                    </motion.div>
                </div>

                <form className="space-y-3" onSubmit={handleRegister}>
                    {/* Họ và tên */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-name">Họ và tên</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                id="reg-name"
                                type="text"
                                placeholder="Nguyễn Văn A"
                                className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* CCCD & SĐT Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-cccd">Số CCCD</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                    <IdCard size={18} />
                                </div>
                                <input
                                    id="reg-cccd"
                                    type="text"
                                    placeholder="12 số"
                                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-phone">Số điện thoại</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                    <Phone size={18} />
                                </div>
                                <input
                                    id="reg-phone"
                                    type="tel"
                                    placeholder="09xxx..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ngày sinh & Giới tính Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-dob">Ngày sinh</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                    <Calendar size={18} />
                                </div>
                                <input
                                    id="reg-dob"
                                    type="date"
                                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-gender">Giới tính</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                    <Users size={18} />
                                </div>
                                <select
                                    id="reg-gender"
                                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm appearance-none"
                                    required
                                >
                                    <option value="">Chọn</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-pass">Mật khẩu</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="reg-pass"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="reg-confirm">Xác nhận mật khẩu</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                    <ShieldCheck size={18} />
                                </div>
                                <input
                                    id="reg-confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-sans outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-1">
                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-headline font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                        >
                            Hoàn thành đăng ký
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>
            </motion.div>
        </AuthLayout>
    );
}
