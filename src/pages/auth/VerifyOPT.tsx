import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Coffee, Mail, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import forgotPasswordService from '../../services/ForgotPassword';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../components/ui/input-otp';

export function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOTPChange = (value: string) => {
    setOtp(value);
    setError('');
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    setLoading(true);

    try {
      console.log('[VerifyOTP] Verifying OTP...');
      const response = await forgotPasswordService.verifyOTP({ email, otp });

      console.log('[VerifyOTP] OTP verified successfully');
      setSuccess(true);

      // Redirect to reset password after 1.5 seconds
      setTimeout(() => {
        navigate('/reset-password', { state: { email, resetToken: response.resetToken || response.token } });
      }, 1500);
    } catch (err: any) {
      const message = err?.message || 'OTP không hợp lệ. Vui lòng thử lại.';
      console.error('[VerifyOTP] Error:', message);
      setError(message);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendLoading(true);

    try {
      console.log('[VerifyOTP] Resending OTP...');
      await forgotPasswordService.forgotPassword({ email });
      
      console.log('[VerifyOTP] OTP resent successfully');
      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      const message = err?.message || 'Không thể gửi lại OTP. Vui lòng thử lại.';
      console.error('[VerifyOTP] Resend error:', message);
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

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
                OTP xác nhận thành công!
              </h2>
              <p className="text-gray-600">
                Bạn được chuyển hướng để đặt lại mật khẩu...
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Loader className="w-6 h-6 animate-spin text-[#006A33] mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004920]/5 via-white to-[#004920]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Info */}
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

            <div className="mt-12 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">Xác nhận OTP</h3>
                <p className="text-green-100 leading-relaxed">
                  Chúng tôi vừa gửi một mã OTP 6 chữ số tới email của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư mục spam.
                </p>
              </div>

              <div className="bg-[#004920]/50 rounded-lg p-4 border border-[#00632B]">
                <p className="text-sm text-green-100">
                  ⏰ OTP sẽ hết hạn sau 10 phút vì lý do bảo mật.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          {/* Back Link */}
          <Link
            to="/forgot-password"
            className="flex items-center gap-2 text-[#006A33] hover:text-[#00632B] font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Xác nhận OTP</h2>
            <p className="text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {email}
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Nhập mã OTP (6 chữ số)
              </label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={handleOTPChange} disabled={loading}>
                  <InputOTPGroup className="flex justify-center gap-2">
                    <InputOTPSlot index={0} className="h-12 w-12 border-2 border-[#006A33] rounded-lg flex items-center justify-center text-lg font-semibold bg-white text-black focus:border-[#006A33] focus:ring-2 focus:ring-[#006A33]/30" />
                    <InputOTPSlot index={1} className="h-12 w-12 border-2 border-[#006A33] rounded-lg flex items-center justify-center text-lg font-semibold bg-white text-black focus:border-[#006A33] focus:ring-2 focus:ring-[#006A33]/30" />
                    <InputOTPSlot index={2} className="h-12 w-12 border-2 border-[#006A33] rounded-lg flex items-center justify-center text-lg font-semibold bg-white text-black focus:border-[#006A33] focus:ring-2 focus:ring-[#006A33]/30" />
                    <InputOTPSlot index={3} className="h-12 w-12 border-2 border-[#006A33] rounded-lg flex items-center justify-center text-lg font-semibold bg-white text-black focus:border-[#006A33] focus:ring-2 focus:ring-[#006A33]/30" />
                    <InputOTPSlot index={4} className="h-12 w-12 border-2 border-[#006A33] rounded-lg flex items-center justify-center text-lg font-semibold bg-white text-black focus:border-[#006A33] focus:ring-2 focus:ring-[#006A33]/30" />
                    <InputOTPSlot index={5} className="h-12 w-12 border-2 border-[#006A33] rounded-lg flex items-center justify-center text-lg font-semibold bg-white text-black focus:border-[#006A33] focus:ring-2 focus:ring-[#006A33]/30" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-[#006A33] to-[#00632B] hover:from-[#005C2B] hover:to-[#004920] text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                'Xác nhận OTP'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">
                Không nhận được OTP?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || resendCooldown > 0 || loading}
                className="text-[#006A33] hover:text-[#00632B] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader className="w-3 h-3 animate-spin" />
                    Đang gửi...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Gửi lại sau ${resendCooldown}s`
                ) : (
                  'Gửi lại OTP'
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-[#004920]/5 rounded-lg border border-[#006A33]">
              <p className="text-xs text-[#002c14]">
                💡 <strong>Mẹo:</strong> Nếu không tìm thấy email, hãy kiểm tra thư mục Spam hoặc Junk của bạn.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
