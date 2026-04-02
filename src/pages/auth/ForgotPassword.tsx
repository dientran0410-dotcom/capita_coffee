import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coffee, Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import forgotPasswordService from '../../services/ForgotPassword';

export function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('[ForgotPassword] Sending OTP to email...');
      await forgotPasswordService.forgotPassword({ email });

      console.log('[ForgotPassword] OTP sent successfully');
      setSuccess(true);

      // Redirect to OTP verification after 2 seconds
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 2000);
    } catch (err: any) {
      const message = err?.message || 'Failed to send OTP. Please try again.';
      console.error('[ForgotPassword] Error:', message);
      setError(message);
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

      {/* Central Card */}
      <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest shadow-2xl rounded-xl overflow-hidden">
        <div className="p-8 md:p-12">
          {/* Back to Login Link */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-primary hover:text-opacity-80 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </button>

          {!success ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-on-surface mb-2">Quên mật khẩu</h2>
                <p className="text-on-surface-variant">
                  Nhập email để nhận mã OTP xác nhận
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block font-label text-sm font-bold text-on-surface ml-1">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="john@capitalcoffee.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary transition-all text-base font-medium text-on-surface placeholder:text-on-surface-variant"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-[#005c2b] text-on-primary font-headline font-bold text-sm tracking-widest uppercase rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang gửi OTP...
                    </>
                  ) : (
                    'Gửi mã OTP'
                  )}
                </button>

                {/* Info Box */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-900">
                    💡 <strong>Tip:</strong> Nếu không tìm thấy email, hãy kiểm tra thư mục Spam hoặc Junk của bạn.
                  </p>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">
                  OTP đã được gửi!
                </h2>
                <p className="text-on-surface-variant mb-4">
                  Vui lòng kiểm tra email của bạn để nhận mã OTP 6 chữ số.
                </p>
                <p className="text-sm text-on-surface-variant">
                  OTP sẽ hết hạn sau 10 phút.
                </p>
              </div>

              <div className="pt-4 border-t border-surface-container-high">
                <p className="text-sm text-on-surface-variant mb-4">
                  Chuyển hướng đến xác nhận OTP trong{' '}
                  <span className="font-semibold text-primary">2 giây</span>...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Brand Accent Decoration */}
      <div className="absolute bottom-12 right-12 z-0 hidden lg:block opacity-20 pointer-events-none">
        <Coffee className="w-48 h-48 text-on-primary" />
      </div>

      {/* Simple Footer for Transactional Page */}
      <footer className="absolute bottom-0 w-full py-6 z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-label text-[10px] tracking-widest uppercase text-white/60">
            © 2024 CAPITAL COFFEE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/heritage"
              className="font-label text-[10px] tracking-widest uppercase text-white/60 hover:text-white transition-colors"
            >
              Heritage
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

