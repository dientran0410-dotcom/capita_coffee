import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Coffee,
  Eye,
  EyeOff,
  Lock,
  Loader,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react';
import { getPublicFranchises } from '../../services/franchiseService';
import { registerCustomer, sendRegisterSuccessNotification } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorMessage';

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  franchiseId: string;
  confirmPassword?: string;
};

type Franchise = {
  id: string;
  name: string;
};

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    franchiseId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  const [error, setError] = useState('');
  const [franchiseError, setFranchiseError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadFranchises = async () => {
      setLoadingFranchises(true);
      setFranchiseError('');

      try {
        const response = await getPublicFranchises();
        const payload = response?.data ?? response;

        const rawList =
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.content)
                ? payload.content
                : Array.isArray(payload?.franchises)
                  ? payload.franchises
                  : [];

        const franchiseList: Franchise[] = rawList
          .map((item: Record<string, any>) => {
            const id =
              item?.franchiseId ??
              item?.id ??
              item?.franchiseCode ??
              item?.code ??
              '';
            const name =
              item?.franchiseName ??
              item?.name ??
              item?.franchiseCode ??
              item?.code ??
              'Cửa hàng';

            return id ? { id: String(id), name: String(name) } : null;
          })
          .filter((x): x is Franchise => Boolean(x));

        if (mounted) {
          setFranchises(franchiseList);

          if (franchiseList.length > 0) {
            setForm((prev) => ({
              ...prev,
              franchiseId: franchiseList.some((f) => f.id === prev.franchiseId)
                ? prev.franchiseId
                : franchiseList[0].id,
            }));
          }
        }
      } catch (err) {
        console.error('[Register] loadFranchises', err);
        if (mounted) {
          setFranchiseError('Không thể tải danh sách cửa hàng. Vui lòng thử lại.');
        }
      } finally {
        if (mounted) {
          setLoadingFranchises(false);
        }
      }
    };

    void loadFranchises();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange =
    (field: keyof RegisterForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleFranchiseChange = (franchiseId: string) => {
    setForm((prev) => ({ ...prev, franchiseId }));
  };



  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password || !form.phone) {
      setError('Vui lòng điển đủ thông tin bắt buộc.');
      return;
    }

    if (!confirmPassword) {
      setError('Vui lòng xác nhận mật khẩu.');
      return;
    }

    if (form.password !== confirmPassword) {
      setError('Mật khẩu không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (!form.franchiseId) {
      setError('Vui lòng chọn một cửa hàng liên kết.');
      return;
    }

    // Validate phone format (Vietnamese phone)
    const phoneRegex = /^0\d{9,10}$/; // Vietnamese format: 0 followed by 9-10 digits
    if (!phoneRegex.test(form.phone.trim())) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại theo định dạng 0xxxxxxxxx');
      return;
    }

    setLoading(true);
    try {
      // All public registrations are CUSTOMER accounts
      // Admin only can set other roles via user management
      await registerCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        address: form.address.trim(),
        phone: form.phone.trim(),
        role: 'CUSTOMER',
        franchiseId: form.franchiseId, // Submit selected franchise
      });

      // Send register success notification email
      await sendRegisterSuccessNotification(form.email.trim(), form.name.trim());

      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the hoan tat dang ky luc nay. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Heritage Background with Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80"
          alt="Premium coffee heritage imagery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,73,32,0.85)] to-[rgba(0,44,20,0.95)]"></div>
      </div>

      {/* Central Sign-up Card */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl rounded-xl overflow-visible">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="absolute top-4 right-4 z-50 p-1"
          aria-label="Close"
          >
          <span className="material-symbols-outlined text-gray-500 text-2xl hover:text-gray-800 transition-colors">
            close
          </span> 
        </button>

        <div className="p-8 md:p-12">{/* Brand Anchor */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center space-x-2 mb-6">
              <Coffee className="text-[#006a33] w-9 h-9" />
              <span className="font-bold text-2xl tracking-[0.2em] text-[#006a33]">CAPITAL COFFEE</span>
            </div>
            <h1 className="font-extrabold text-3xl text-gray-900 mb-2 tracking-tight">
              Tham gia Capital Coffee
            </h1>
            <p className="text-gray-600 font-medium">Trải nghiệm nghệ thuật cà phê di sản.</p>
          </div>

          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Full Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="name">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#006a33] transition-all text-sm font-medium text-black"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="name@heritage.coffee"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#006a33] transition-all text-sm font-medium text-black"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#006a33] transition-all text-sm font-medium text-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && form.password.length < 6 && (
                  <p className="text-xs text-red-600 ml-1">Mật khẩu phải có ít nhất 6 ký tự</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-10 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 transition-all text-sm font-medium text-black ${
                      confirmPassword && form.password !== confirmPassword
                        ? 'focus:ring-red-500'
                        : 'focus:ring-[#006a33]'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && form.password !== confirmPassword && (
                  <p className="text-xs text-red-600 ml-1">Mật khẩu không khớp</p>
                )}
              </div>

              {/* Address Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="address">
                  Địa chỉ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={handleChange('address')}
                    placeholder="Ví dụ: 74 Pasteur, Q.1, TP. HCM"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#006a33] transition-all text-sm font-medium text-black"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder="Ví dụ: 0986123456"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#006a33] transition-all text-sm font-medium text-black"
                    required
                  />
                </div>
              </div>

              {/* Franchise Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-black ml-1" htmlFor="franchiseId">
                  Cửa hàng liên kết
                </label>
                {franchiseError && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                    {franchiseError}
                  </div>
                )}
                {loadingFranchises ? (
                  <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-full">
                    <Loader className="w-4 h-4 animate-spin text-gray-500 mr-2" />
                    <span className="text-sm text-gray-500">Đang tải danh sách cửa hàng...</span>
                  </div>
                ) : franchises.length > 0 ? (
                  <select
                    id="franchiseId"
                    value={form.franchiseId}
                    onChange={(event) => handleFranchiseChange(event.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#006a33] transition-all text-sm font-medium text-black"
                  >
                    <option value="" disabled>
                      -- Chọn cửa hàng --
                    </option>
                    {franchises.map((franchise) => (
                      <option key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                    Không có cửa hàng nào khả dụng.
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-3 px-1">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="w-4 h-4 text-[#006a33] bg-gray-50 focus:ring-[#006a33] border-gray-400 rounded"
                    required
                  />
                </div>
                <label className="text-xs text-gray-600 leading-tight" htmlFor="terms">
                  Tôi đồng ý với{' '}
                  <a href="#" className="text-[#006a33] font-bold hover:underline">
                    Điều khoản Dịch vụ
                  </a>{' '}
                  và{' '}
                  <a href="#" className="text-[#006a33] font-bold hover:underline">
                    Chính sách Bảo mật
                  </a>.
                </label>
              </div>

              {/* Primary Action */}
              <button
                type="submit"
                disabled={loading || !form.password || !confirmPassword || form.password !== confirmPassword}
                className="w-full py-4 bg-gradient-to-r from-[#006a33] to-[#005c2b] text-white font-bold text-sm tracking-widest uppercase rounded-full shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  'Đăng ký ngay'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
                <p className="text-gray-600 mb-2">
                  Vui lòng kiểm tra email để xác nhận tài khoản.
                </p>
                <p className="text-sm text-gray-500">
                  Nếu không thấy email, kiểm tra thư mục Spam hoặc yêu cầu gửi lại trên trang đăng nhập.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#006a33] hover:text-[#005c2b] font-bold"
                >
                  Tiếp tục đăng nhập
                </button>
              </div>
            </div>
          )}



          {/* Footer Link */}
          {!success && (
            <div className="mt-10 text-center">
              <p className="text-gray-600 text-sm font-medium">
                Đã có tài khoản?{' '}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                  className="text-[#006a33] font-bold ml-1 hover:underline decoration-2 underline-offset-4"
                >
                  Đăng nhập
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Brand Accent Decoration */}
      <div className="absolute bottom-12 right-12 z-0 hidden lg:block opacity-20 pointer-events-none">
        <Coffee className="w-48 h-48 text-white" />
      </div>
    </main>
  );
}
