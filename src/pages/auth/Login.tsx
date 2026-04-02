import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    // Load remembered email on mount
    useEffect(() => {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    }, []);

    const normalizeRole = (role) => String(role || '').toUpperCase().replace(/^ROLE_/, '');
    const redirectMap = {
      ADMIN: '/admin',
      MANAGER: '/manager',
      CUSTOMER: '/home',
      STAFF: '/staff',
      SUPPLIER: '/supplier',
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        // Clear old tokens before login to prevent authorization header from being attached to login request
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_user');
        sessionStorage.clear();

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const user = await login(email, password);
        console.debug('[Login] Raw user data returned from AuthContext:', user);
        console.debug('[Login] User role field:', user?.role);
        console.debug('[Login] Raw user object structure:', JSON.stringify(user, null, 2));

        const role = normalizeRole(user?.role) || 'CUSTOMER';
        console.debug('[Login] Normalized role:', role);
        console.debug('[Login] Redirect map entry:', redirectMap[role]);
        console.debug('[Login] All redirect options:', redirectMap);
        console.debug('[Login] Final redirect path:', redirectMap[role] || '/');

        const redirectPath = redirectMap[role] || '/';
        console.debug('[Login] About to navigate to:', redirectPath);
        navigate(redirectPath);
      } catch (err) {
        console.error(err);

        // Check for blocked/banned account error
        const errorMessage = err.message || '';
        let displayMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

        if (errorMessage.toLowerCase().includes('blocked') ||
            errorMessage.toLowerCase().includes('banned') ||
            errorMessage.toLowerCase().includes('disabled') ||
            errorMessage.toLowerCase().includes('status code 500')) {
          displayMessage = 'Tài khoản đã bị chặn. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
        } else if (errorMessage.toLowerCase().includes('invalid credentials') ||
                   errorMessage.toLowerCase().includes('wrong password') ||
                   errorMessage.toLowerCase().includes('incorrect')) {
          displayMessage = 'Email hoặc mật khẩu không chính xác.';
        } else if (errorMessage.toLowerCase().includes('not found')) {
          displayMessage = 'Tài khoản không tồn tại.';
        } else if (errorMessage) {
          displayMessage = errorMessage;
        }

        alert(displayMessage);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
        {/* Heritage Background with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBToseildKweI8Bg3ov4m13K1lbo86PAV05pcVpmPQn4w5fqaTwSdAThqcZW4Qb8PAjh3hO1XcJ-lr-a0MFbTGR-1W91iOA9veqPl_LfJiB_coIntbHnQXqp1j-Z3e-0gGiu1z5tu8u1ylgu9jCLEdc91UfaB1E0nu3tgTZdNFnlCbZZBNxU5wY0p0AyTWwb_NuFfjgA7hjAdMu0AvfCehBjwS957D3cnlRL3fcckz2L-CljTzRNpohwvlFvrSsiDyWvWw8yk0uLLB2"
            alt="Premium close up of coffee beans and leaves"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#004920]/85 to-[#002c14]/95"></div>
        </div>

        {/* Central Sign-up Card */}
        <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest shadow-2xl rounded-xl overflow-hidden">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 z-20 p-1"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-2xl">
              close
            </span>
          </button>

          <div className="p-8 md:p-12">
            {/* Brand Anchor */}
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center space-x-2 mb-6">
                <span className="material-symbols-outlined text-primary text-4xl">coffee</span>
                <span
                  className="font-headline font-bold text-2xl tracking-[0.2em]"
                  style={{
                    background: 'linear-gradient(to right, rgb(0, 106, 51), rgb(0, 92, 43))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  CAPITAL COFFEE
                </span>
              </div>
              <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2 tracking-tight whitespace-nowrap">
                Chào mừng trở lại
              </h1>
              <p className="text-on-surface-variant font-medium">
                Trải nghiệm nghệ thuật cà phê di sản.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary transition-all text-sm font-medium text-gray-600"
                    placeholder="name@heritage.coffee"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary transition-all text-sm font-medium text-gray-600"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary bg-white focus:ring-primary border-outline-variant rounded"
                  />
                  <label htmlFor="remember" className="text-xs text-on-surface-variant font-medium">
                    Ghi nhớ tôi
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-bold hover:underline"
                  style={{
                    background: 'linear-gradient(to right, rgb(0, 106, 51), rgb(0, 92, 43))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Primary Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-primary to-[#005c2b] text-on-primary font-headline font-bold text-sm tracking-widest uppercase rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
              </button>
            </form>



            {/* Footer Link */}
            <div className="mt-10 text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                Chưa có tài khoản?{' '}
                <Link
                  to="/register"
                  className="text-primary font-bold ml-1 hover:underline decoration-2 underline-offset-4"
                >
                  Tạo tài khoản
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Subtle Brand Accent Decoration */}
        <div className="absolute bottom-12 right-12 z-0 hidden lg:block opacity-20 pointer-events-none">
          <span className="material-symbols-outlined text-[12rem] text-on-primary">eco</span>
        </div>

        {/* Simple Footer for Transactional Page */}
        <footer className="absolute bottom-0 w-full py-6 z-10">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-label text-[10px] tracking-widest uppercase text-white/60">
              © 2026 CAPITAL COFFEE. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => navigate('/heritage')}
                className="font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white transition-colors"
              >
                Heritage
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
}
