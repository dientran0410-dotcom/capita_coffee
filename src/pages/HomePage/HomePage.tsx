import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import MenuShowcase from './sections/MenuShowcase';
import NewsletterSection from './sections/NewsletterSection';
import { Coffee, MapPin, Share2, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const displayName = user?.username?.trim() || 'Tài khoản';

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      console.log('[HomePage] Logout successful, redirecting to login');
      navigate('/login');
    } catch (error) {
      console.error('[HomePage] Logout error:', error);
      // Still redirect even if logout fails
      navigate('/login');
    }
  };

  return (
    <div className="relative bg-surface font-body text-on-surface">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 shadow-md shadow-emerald-900/10 backdrop-blur-xl dark:bg-zinc-950/90'
            : 'bg-white/70 shadow-sm shadow-emerald-900/5 backdrop-blur-xl dark:bg-zinc-950/70'
        }`}
      >
        <nav
          className={`mx-auto flex max-w-7xl items-center justify-between px-8 transition-all duration-500 ${
            scrolled ? 'py-3' : 'py-4'
          }`}
        >
          <a href="/home" className="group flex cursor-pointer items-center gap-2">
            <Coffee
              className={`text-primary transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${
                scrolled ? 'h-5 w-5' : 'h-6 w-6'
              }`}
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="font-headline text-xl font-extrabold tracking-tighter text-emerald-900 transition-all duration-300 group-hover:text-primary dark:text-emerald-100">
              Capital Coffee
            </span>
          </a>

          <div className="hidden items-center gap-8 font-headline text-sm font-medium tracking-tight md:flex">
            <a href="/home" className="border-b-2 border-emerald-600 pb-1 text-emerald-700 transition-all duration-300 dark:text-emerald-400">
              Trang chủ
            </a>
            <a href="/about" className="group relative text-zinc-600 transition-all duration-300 hover:text-emerald-800 dark:text-zinc-400">
              Giới thiệu
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
            </a>
            <button
              onClick={() => navigate('/menu')}
              className="group relative text-zinc-600 transition-all duration-300 hover:text-emerald-800 dark:text-zinc-400"
            >
              Thực đơn
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
            </button>
            {/* <a href="#" className="group relative text-zinc-600 transition-all duration-300 hover:text-emerald-800 dark:text-zinc-400">
              Vị trí
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
            </a> */}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 font-headline text-sm font-semibold text-emerald-900 transition-all duration-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
                >
                  {displayName}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-emerald-200 bg-white shadow-lg dark:border-emerald-800 dark:bg-zinc-900">
                    <div className="p-3 border-b border-emerald-100 dark:border-emerald-800">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Đã đăng nhập</p>
                      <p className="font-headline font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                        {displayName}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full border-2 border-emerald-600 bg-transparent px-5 py-2.5 font-headline text-sm font-semibold text-emerald-900 transition-all duration-300 hover:scale-105 hover:bg-emerald-50 hover:shadow-md active:scale-95 dark:text-emerald-100 dark:hover:bg-emerald-950/30"
                >
                  Đăng nhập
                </button>
                <Link
                  to="/register"
                  className="primary-gradient rounded-full border-2 border-transparent px-6 py-2.5 font-headline text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-0">
        <HeroSection />
        <FeaturesSection />
        <MenuShowcase />
        <NewsletterSection />
      </main>

      <footer className="mt-20 w-full bg-zinc-50 px-8 py-12 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 border-t border-zinc-200 pt-12 dark:border-zinc-800 md:flex-row">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" fill="currentColor" strokeWidth={0} />
              <span className="font-headline text-lg font-bold text-emerald-900 dark:text-emerald-100">
                Capital Coffee
              </span>
            </div>
            <p className="max-w-xs text-center font-body text-xs text-zinc-500 md:text-left">
              Mang hương vị cà phê thượng hạng đến mọi không gian và thời điểm
              trong ngày của bạn.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 font-['Plus_Jakarta_Sans'] text-xs font-normal tracking-wide">
            <a href="#" className="text-zinc-500 transition-colors hover:text-emerald-600 hover:underline underline-offset-4">
              Chính sách bảo mật
            </a>
            <a href="#" className="text-zinc-500 transition-colors hover:text-emerald-600 hover:underline underline-offset-4">
              Điều khoản sử dụng
            </a>
            <a href="#" className="text-zinc-500 transition-colors hover:text-emerald-600 hover:underline underline-offset-4">
              Liên hệ
            </a>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-all duration-300 hover:rotate-6 hover:scale-110 hover:bg-primary hover:text-white">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-all duration-300 hover:-rotate-6 hover:scale-110 hover:bg-primary hover:text-white">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl text-center">
          <p className="font-body text-[10px] uppercase tracking-widest text-zinc-400">
            © 2024 Capital Coffee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
