import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Coffee, Menu, X } from 'lucide-react';
const navLinks = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Giới thiệu', to: '/about' },
];
export function GuestLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
    return (<div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left – Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="bg-amber-600 p-2 rounded-lg">
                <Coffee className="w-5 h-5 text-white"/>
              </div>
              <div className="leading-tight">
                <p className="font-bold text-gray-900 text-base leading-none">Capital Coffee</p>
                <p className="text-xs text-amber-600 font-medium">Taste the moment</p>
              </div>
            </Link>

            {/* Center – Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (<Link key={link.to} to={link.to} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
                ? 'bg-amber-50 text-amber-700'
                : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'}`}>
                  {link.label}
                </Link>))}
            </nav>

            {/* Right – Login */}
            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden md:inline-flex items-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2 transition-colors">
                Đăng nhập
              </Link>

              {/* Mobile hamburger */}
              <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (<div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 space-y-1 pt-2">
            {navLinks.map((link) => (<Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'}`}>
                {link.label}
              </Link>))}
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold text-center hover:bg-amber-700 transition-colors">
              Đăng nhập
            </Link>
          </div>)}
      </header>

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <Outlet />
    </div>);
}
