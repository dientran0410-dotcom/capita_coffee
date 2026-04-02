import { Coffee, Star, Leaf, Heart, MapPin, Users, Award, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AboutPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const displayName = user?.username?.trim() || 'Tài khoản';

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative bg-surface font-body text-on-surface">
      {/* Fixed Navigation Header */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-md shadow-emerald-900/10'
            : 'bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm shadow-emerald-900/5'
        }`}
      >
        <nav className={`flex justify-between items-center px-8 max-w-7xl mx-auto transition-all duration-500 ${
          scrolled ? 'py-3' : 'py-4'
        }`}>
          {/* Logo */}
          <a href="/home" className="flex items-center gap-2 group cursor-pointer">
            <Coffee
              className={`w-6 h-6 text-primary transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${
                scrolled ? 'w-5 h-5' : 'w-6 h-6'
              }`}
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="text-xl font-extrabold tracking-tighter text-emerald-900 dark:text-emerald-100 font-headline transition-all duration-300 group-hover:text-primary">
              Capital Coffee
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center font-headline text-sm font-medium tracking-tight">
            <a href="/home" className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-800 transition-all duration-300 relative group">
              Trang chủ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/about" className="text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 pb-1 transition-all duration-300">
              Giới thiệu
            </a>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-800 transition-all duration-300 relative group"
            >
              Thực đơn
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
            </button>
            {/* <a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-800 transition-all duration-300 relative group">
              Vị trí
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
            </a> */}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 font-headline text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                {displayName}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 rounded-full font-headline text-sm font-semibold text-emerald-900 dark:text-emerald-100 bg-transparent border-2 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="primary-gradient text-white px-6 py-2.5 rounded-full font-headline text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all duration-300 border-2 border-transparent"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-0">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 opacity-60">
            <img
              alt="Heritage Coffee Plantation"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2061&auto=format&fit=crop"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent"></div>

          <div className="relative z-10 container mx-auto px-8 py-24">
            <div className="max-w-4xl space-y-8">
              <span className="inline-block py-1 px-4 rounded-full bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-[0.2em]">
                Established 1994
              </span>

              <h1 className="text-6xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter">
                Hành Trình Di Sản Của <span className="text-primary-fixed">Capital Coffee</span>
              </h1>

              <p className="text-zinc-300 text-xl md:text-2xl max-w-2xl font-light leading-relaxed">
                Từ những đồi chè Tây Nguyên đến mỗi tách cà phê bạn thưởng thức, chúng tôi kể một câu chuyện về tâm huyết và sự tinh tế.
              </p>
            </div>
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="py-24 px-8 bg-surface">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-surface-container shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <img
                  alt="Roasting Process"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2787&auto=format&fit=crop"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary-container rounded-xl flex items-center justify-center p-8 hidden md:flex">
                <p className="text-on-primary-container font-headline font-bold text-center leading-tight">THE MODERN CULTIVATOR</p>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-extrabold text-emerald-900 tracking-tight leading-tight">
                Tầm Nhìn & Sứ Mệnh
              </h2>

              <div className="space-y-6 text-on-surface-variant text-lg leading-relaxed font-body">
                <p>
                  Tại Capital Coffee, chúng tôi không chỉ sản xuất cà phê; chúng tôi nuôi dưỡng những trải nghiệm. Được định hình bởi triết lý "The Modern Cultivator", chúng tôi kết hợp những giá trị canh tác truyền thống với quy trình chế biến công nghệ cao.
                </p>
                <p>
                  Sứ mệnh của chúng tôi là đưa hạt cà phê Robusta Việt Nam lên một tầm cao mới, chứng minh rằng sự tận tâm và kỹ thuật tinh xảo có thể biến những nguyên liệu mộc mạc nhất thành những tác phẩm nghệ thuật vị giác.
                </p>
              </div>

              <div className="pt-4">
                <button className="bg-primary text-on-primary px-8 py-4 rounded-full font-headline font-bold text-sm tracking-widest uppercase shadow-xl hover:bg-primary-dim transition-all active:scale-95">
                  Khám Phá Câu Chuyện
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-24 px-8 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black text-emerald-900 uppercase tracking-tighter">Giá Trị Cốt Lõi</h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Value Card 1 */}
              <div className="bg-surface-container-lowest p-10 rounded-xl space-y-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-primary-container/30 rounded-full flex items-center justify-center text-primary">
                  <Star className="w-8 h-8" fill="currentColor" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Chất Lượng Thượng Hạng</h3>
                <p className="text-on-surface-variant font-body leading-relaxed">
                  Quy trình tuyển chọn khắt khe từng hạt cà phê chín mọng, đảm bảo hương vị đồng nhất và đẳng cấp trong từng mẻ rang.
                </p>
              </div>

              {/* Value Card 2 */}
              <div className="bg-surface-container-lowest p-10 rounded-xl space-y-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-primary-container/30 rounded-full flex items-center justify-center text-primary">
                  <Leaf className="w-8 h-8" fill="currentColor" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Canh Tác Bền Vững</h3>
                <p className="text-on-surface-variant font-body leading-relaxed">
                  Đồng hành cùng nông dân Tây Nguyên trong việc áp dụng phương pháp canh tác hữu cơ, bảo vệ hệ sinh thái và môi trường.
                </p>
              </div>

              {/* Value Card 3 */}
              <div className="bg-surface-container-lowest p-10 rounded-xl space-y-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-primary-container/30 rounded-full flex items-center justify-center text-primary">
                  <Heart className="w-8 h-8" fill="currentColor" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Tôn Vinh Bản Sắc</h3>
                <p className="text-on-surface-variant font-body leading-relaxed">
                  Giữ gìn tinh hoa văn hóa thưởng thức cà phê Việt, đồng thời không ngừng đổi mới để hòa nhập vào dòng chảy toàn cầu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Heritage Section (Đắk Lắk Focus) */}
        <section className="py-24 px-8 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2 space-y-10 order-2 md:order-1">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-emerald-900 leading-tight">Di Sản Từ Vùng Đất Đỏ Đắk Lắk</h2>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <MapPin className="w-5 h-5" />
                  <span className="tracking-widest uppercase text-sm">Central Highlands, Vietnam</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-l-4 border-primary-container pl-8">
                <div className="space-y-2">
                  <div className="text-4xl font-black text-emerald-900">800m+</div>
                  <div className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Độ Cao Lý Tưởng</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-black text-emerald-900">100%</div>
                  <div className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Hạt Robusta Đặc Sản</div>
                </div>
              </div>

              <p className="text-on-surface-variant text-lg leading-relaxed font-body italic">
                "Tại Đắk Lắk, chúng tôi tìm thấy linh hồn của Capital Coffee. Những gốc cà phê lâu năm vươn mình trên đất đỏ bazan không chỉ cho hạt, mà cho cả hơi thở của vùng cao nguyên đầy nắng gió."
              </p>
            </div>

            <div className="md:w-1/2 order-1 md:order-2">
              <div className="relative">
                {/* Bento Grid Like Composition */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <img
                      alt="Coffee Beans"
                      className="w-full h-64 object-cover rounded-xl shadow-lg"
                      src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=2070&auto=format&fit=crop"
                    />
                    <div className="bg-zinc-100 p-6 rounded-xl">
                      <h4 className="font-bold text-emerald-900 mb-2">Thổ Nhưỡng</h4>
                      <p className="text-xs text-on-surface-variant">Đất đỏ bazan màu mỡ tạo nên vị đậm đặc trưng.</p>
                    </div>
                  </div>
                  <div className="pt-12">
                    <img
                      alt="Highland view"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                      src="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 px-8 bg-emerald-900">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-3">
                <Users className="w-12 h-12 mx-auto text-primary-fixed" />
                <div className="text-5xl font-black text-white">30+</div>
                <div className="text-zinc-300 text-sm uppercase tracking-widest">Năm Kinh Nghiệm</div>
              </div>

              <div className="space-y-3">
                <Award className="w-12 h-12 mx-auto text-primary-fixed" />
                <div className="text-5xl font-black text-white">50+</div>
                <div className="text-zinc-300 text-sm uppercase tracking-widest">Giải Thưởng</div>
              </div>

              <div className="space-y-3">
                <Coffee className="w-12 h-12 mx-auto text-primary-fixed" fill="currentColor" />
                <div className="text-5xl font-black text-white">100K+</div>
                <div className="text-zinc-300 text-sm uppercase tracking-widest">Khách Hàng</div>
              </div>

              <div className="space-y-3">
                <TrendingUp className="w-12 h-12 mx-auto text-primary-fixed" />
                <div className="text-5xl font-black text-white">15+</div>
                <div className="text-zinc-300 text-sm uppercase tracking-widest">Cửa Hàng</div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 px-8">
          <div className="max-w-5xl mx-auto bg-emerald-900 rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
            {/* Abstract Texture background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
            </div>

            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Bắt Đầu Hành Trình Của Bạn</h2>
              <p className="text-on-primary text-xl max-w-2xl mx-auto font-light">
                Hãy để Capital Coffee mang hương vị di sản đến không gian của bạn. Trải nghiệm ngay bộ sưu tập cà phê đặc sản mới nhất.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <button className="bg-primary-container text-on-primary-container px-10 py-5 rounded-full font-headline font-extrabold text-sm tracking-widest uppercase hover:scale-105 transition-transform">
                  Khám Phá Thực Đơn
                </button>
                <button className="border border-white/30 text-white px-10 py-5 rounded-full font-headline font-extrabold text-sm tracking-widest uppercase hover:bg-white/10 transition-colors">
                  Tìm Cửa Hàng
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-50 dark:bg-zinc-900 w-full py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 border-t border-zinc-200 dark:border-zinc-800 pt-12">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Coffee
                className="w-5 h-5 text-primary"
                fill="currentColor"
                strokeWidth={0}
              />
              <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100 font-headline">
                Capital Coffee
              </span>
            </div>
            <p className="text-zinc-500 font-body text-xs max-w-xs text-center md:text-left">
              Mang hương vị cà phê thượng hạng đến mọi không gian và thời điểm trong ngày của bạn.
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-8 font-['Plus_Jakarta_Sans'] text-xs font-normal tracking-wide">
            <a href="#" className="text-zinc-500 hover:text-emerald-600 transition-colors hover:underline underline-offset-4">
              Chính sách bảo mật
            </a>
            <a href="#" className="text-zinc-500 hover:text-emerald-600 transition-colors hover:underline underline-offset-4">
              Điều khoản sử dụng
            </a>
            <a href="#" className="text-zinc-500 hover:text-emerald-600 transition-colors hover:underline underline-offset-4">
              Liên hệ
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:scale-110 hover:rotate-6 transition-all duration-300 cursor-pointer">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:scale-110 hover:-rotate-6 transition-all duration-300 cursor-pointer">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto text-center mt-12">
          <p className="text-zinc-400 font-body text-[10px] tracking-widest uppercase">
            © 2024 Capital Coffee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
