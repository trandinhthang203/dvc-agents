import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Calendar, Users, MapPin, Image as ImageIcon,
  Loader2, Save, AlertCircle, CheckCircle2,
  Shield, Info, Lock
} from 'lucide-react';
import { userService, UserProfile, sessionService, ChatSession } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullname: '',
    citizenid: '',
    phonenumber: '',
    dateofbirth: '',
    gender: 'Other',
    address: '',
    province: '',
    district: '',
    ward: '',
    avatarurl: ''
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'document' | 'map'>('chat');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const user = await userService.getCurrentUser();
        setFormData(user);
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();

    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const data = await sessionService.getSessions();
        setSessions(data || []);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const handleSelectSession = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleNewSession = async () => {
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

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await sessionService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.idchatsession !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const keyMap: { [key: string]: string } = {
      'prof-name': 'fullname',
      'prof-cccd': 'citizenid',
      'prof-phone': 'phonenumber',
      'prof-email': 'email',
      'prof-dob': 'dateofbirth',
      'prof-gender': 'gender',
      'prof-address': 'address'
    };

    setFormData(prev => ({
      ...prev,
      [keyMap[id] || id]: value
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await userService.updateProfile(formData);
      setFormData(updatedUser);
      setSuccess('Cập nhật thông tin thành công.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra trong quá trình cập nhật.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      <Sidebar
        sessions={sessions}
        isLoading={isLoadingSessions}
        activeSessionId={null}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-surface-container-lowest">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <div className="max-w-6xl mx-auto px-8 py-10">
            {/* Title & Description */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">
                Hồ sơ cá nhân
              </h1>
              <p className="text-on-surface-variant text-sm">
                Quản lý thông tin tài khoản và cấu hình bảo mật cá nhân của bạn trong hệ thống Nexus Administrative Intelligence.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-medium">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                    <CheckCircle2 size={20} /> {success}
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column */}
                  <div className="w-full lg:w-80 shrink-0 space-y-6">
                    <div className="bg-surface border border-outline-variant/20 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-4 border-surface shadow-sm">
                          {formData.avatarurl ? (
                            <img src={formData.avatarurl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={40} className="text-secondary" />
                          )}
                        </div>
                        <label htmlFor="prof-avatar" className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover cursor-pointer rounded-full flex items-center justify-center text-white border-2 border-surface shadow-sm transition-colors">
                          <ImageIcon size={14} />
                          <input 
                            id="prof-avatar" 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={() => {}} // Placeholder for real avatar upload
                            disabled={isSaving}
                          />
                        </label>
                      </div>
                      
                      <h2 className="font-bold text-on-surface">{formData.fullname || 'Chưa cập nhật'}</h2>
                      <p className="text-primary font-bold text-[11px] mt-1.5 uppercase tracking-wide">CHUYÊN VIÊN CẤP CAO</p>
                      
                      <div className="w-full h-px bg-outline-variant/10 my-5" />
                      
                      <div className="w-full space-y-3 text-[13px]">
                        <div className="flex items-center gap-3 text-on-surface-variant px-2">
                          <Lock size={16} className="text-outline" />
                          <span>ID: NEX-8829-01</span>
                        </div>
                        <div className="flex items-center gap-3 text-on-surface-variant px-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span>Đã xác thực danh tính</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-primary mb-2.5 font-bold text-sm">
                        <Info size={18} />
                        Lưu ý bảo mật
                      </div>
                      <p className="text-[13px] text-on-surface-variant leading-relaxed">
                        Mọi thay đổi đối với Số CCCD và Email chính phải được phê duyệt bởi quản trị viên hệ thống để đảm bảo tính toàn vẹn của dữ liệu hành chính.
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex-1 space-y-6">
                    {/* Thông tin cá nhân */}
                    <div className="bg-surface border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-on-surface font-bold">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <User size={20} />
                        </div>
                        Thông tin cá nhân
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Họ và tên */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-name">Họ và tên</label>
                          <input
                            id="prof-name"
                            type="text"
                            value={formData.fullname || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans outline-none text-[13px] disabled:opacity-50"
                            disabled={isSaving}
                          />
                        </div>

                        {/* CCCD */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-cccd">Số CCCD (Chỉ đọc)</label>
                          <div className="relative">
                            <input
                              id="prof-cccd"
                              type="text"
                              value={formData.citizenid || ''}
                              className="w-full pl-4 pr-10 py-2.5 bg-surface-container-low/50 text-on-surface-variant border border-outline-variant/10 rounded-xl font-sans outline-none text-[13px] cursor-not-allowed opacity-80"
                              disabled
                            />
                            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline" />
                          </div>
                        </div>

                        {/* Điện thoại */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-phone">Số điện thoại</label>
                          <input
                            id="prof-phone"
                            type="tel"
                            value={formData.phonenumber || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans outline-none text-[13px] disabled:opacity-50"
                            disabled={isSaving}
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-email">Email</label>
                          <input
                            id="prof-email"
                            type="email"
                            value={(formData as any).email || 'quan.nm@nexus.gov.vn'} 
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans outline-none text-[13px] disabled:opacity-50"
                            disabled={isSaving}
                          />
                        </div>

                        {/* Ngày sinh */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-dob">Ngày sinh</label>
                          <input
                            id="prof-dob"
                            type="date"
                            value={formData.dateofbirth || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans outline-none text-[13px] disabled:opacity-50"
                            disabled={isSaving}
                          />
                        </div>

                        {/* Giới tính */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-gender">Giới tính</label>
                          <select
                            id="prof-gender"
                            value={formData.gender || 'Other'}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans outline-none text-[13px] disabled:opacity-50 appearance-none"
                            disabled={isSaving}
                          >
                            <option value="Male">Nam</option>
                            <option value="Female">Nữ</option>
                            <option value="Other">Khác</option>
                          </select>
                        </div>

                        {/* Địa chỉ */}
                        <div className="col-span-1 md:col-span-2 space-y-1.5 mt-2">
                          <label className="block text-xs font-semibold text-on-surface-variant ml-1" htmlFor="prof-address">Địa chỉ thường trú</label>
                          <input
                            id="prof-address"
                            type="text"
                            value={formData.address || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans outline-none text-[13px] disabled:opacity-50"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bảo mật tài khoản */}
                    <div className="bg-surface border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-on-surface font-bold">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                          <Shield size={20} />
                        </div>
                        Bảo mật tài khoản
                      </div>
                      
                      <div className="space-y-4">
                        {/* Password */}
                        <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl">
                          <div>
                            <div className="font-bold text-sm text-on-surface mb-0.5">Thay đổi mật khẩu</div>
                            <div className="text-[11px] text-on-surface-variant">Lần cập nhật cuối: 3 tháng trước</div>
                          </div>
                          <button type="button" className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 rounded-lg text-[13px] font-bold text-on-surface transition-colors">
                            Cập nhật
                          </button>
                        </div>

                        {/* 2FA */}
                        <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl">
                          <div>
                            <div className="font-bold text-sm text-on-surface mb-0.5">Xác thực 2 lớp (2FA)</div>
                            <div className="text-[11px] text-orange-500 font-medium">Chưa kích hoạt</div>
                          </div>
                          <div className="w-12 h-6 bg-surface-container-high rounded-full relative cursor-pointer opacity-70">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-outline rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 pb-12 flex justify-end gap-3 border-t border-outline-variant/10 mt-8">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-transparent hover:bg-surface-container-high text-on-surface-variant rounded-xl font-bold text-[13px] transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
