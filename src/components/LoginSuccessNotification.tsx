import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export function LoginSuccessNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if we just logged in (by checking if there's a login success flag in session)
    const loginSuccess = sessionStorage.getItem('login_success');
    if (loginSuccess) {
      setShow(true);
      sessionStorage.removeItem('login_success');
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 flex items-start gap-3 max-w-sm">
        <div className="flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Chúc mừng!</h3>
          <p className="text-sm text-gray-600 mt-1">Bạn đã đăng nhập thành công</p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
