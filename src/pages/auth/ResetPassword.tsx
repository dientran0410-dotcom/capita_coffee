import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Coffee, Lock, Eye, EyeOff, CheckCircle, Loader } from 'lucide-react';
import forgotPasswordService from '../../services/ForgotPassword';

export function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';

  const [formData, setFormData] = useState({
    newPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if no email/resetToken in state
  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const validateForm = (): boolean => {
    setError('');

    if (!formData.newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('[ResetPassword] Resetting password...');

      const result = await forgotPasswordService.resetPassword({
        email,
        resetToken,
        newPassword: formData.newPassword,
        confirmPassword: formData.newPassword,
      });

      console.log('[ResetPassword] ✅ Password reset success:', result.message);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const message = err?.message || 'Không thể đặt lại mật khẩu';
      console.error('[ResetPassword] Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };


  // Reset successful
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#004920]/5 via-white to-[#004920]/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Mật khẩu đặt lại thành công!
              </h2>
              <p className="text-gray-600">
                Mật khẩu của bạn đã được đặt lại. Đăng nhập bằng mật khẩu mới.
              </p>
            </div>

            <div className="p-4 bg-[#004920]/5 rounded-lg border border-[#006A33]">
              <p className="text-sm text-[#002c14]">
                Chuyển hướng đến trang đăng nhập trong{' '}
                <span className="font-semibold">3 giây</span>...
              </p>
            </div>

            <Link
              to="/login"
              className="inline-block text-[#006A33] hover:text-[#00632B] font-medium"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004920]/5 via-white to-[#004920]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <div className="bg-gradient-to-br from-[#004920] to-[#002c14] rounded-3xl p-12 text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#006A33] p-3 rounded-xl">
                <Coffee className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold !text-white">Capital Coffee</h1>
                <p className="text-[#4CAF50]">Supply Chain Management</p>
              </div>
            </div>

            <div className="space-y-6 mt-12">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Đặt lại mật khẩu
                </h3>
                <p className="text-green-100 leading-relaxed">
                  Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn. Đảm bảo sử dụng công sở chữ hoa, chữ thường và số.
                </p>
              </div>

              <div className="bg-[#004920]/50 rounded-lg p-4 border border-[#00632B]">
                <p className="text-sm text-green-100">
                  ⚠️ Giữ bảo mật mật khẩu của bạn và không bao lộ cho ai.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h2>
            <p className="text-gray-600">Nhập mật khẩu mới của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#006A33] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#006A33] to-[#00632B] hover:from-[#005C2B] hover:to-[#004920] text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Đang đặt lại...
                </>
              ) : (
                'Đặt lại mật khẩu'
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Nhớ mật khẩu rồi?{' '}
                <Link to="/login" className="text-[#006A33] hover:text-[#00632B] font-medium">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
