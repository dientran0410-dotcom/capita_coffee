import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <section
      className="relative h-screen min-h-[700px] flex items-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80"
          alt=""
          className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${
            isLoaded ? 'scale-100' : 'scale-110'
          }`}
          loading="eager"
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
        <div className="max-w-2xl">
          {/* Premium Heritage Badge */}
          <span 
            className={`inline-block px-4 py-1 rounded-full bg-primary-container/20 text-primary-fixed border border-primary-container/30 font-headline text-xs font-bold tracking-widest uppercase mb-6 transition-all duration-700 ${
              isLoaded 
                ? 'opacity-100 translate-y-0 blur-0' 
                : 'opacity-0 -translate-y-4 blur-sm'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            Premium Heritage
          </span>

          {/* Main Heading */}
          <h1 
            className={`font-headline text-5xl md:text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-8 tracking-tighter transition-all duration-1000 ${
              isLoaded 
                ? 'opacity-100 translate-y-0 blur-0' 
                : 'opacity-0 translate-y-8 blur-sm'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            Cà phê mới cho <br />
            <span className="text-primary-container inline-block animate-gradient">
              ngày hứng khởi
            </span>
          </h1>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-wrap gap-4 transition-all duration-700 ${
              isLoaded 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <button
              onClick={() => navigate('/menu')}
              className="primary-gradient text-on-primary-fixed px-8 py-4 rounded-full font-headline text-base font-bold flex items-center gap-2 hover:scale-105 hover:shadow-2xl active:scale-95 transition-all duration-300 shadow-xl shadow-primary/30 group"
              aria-label="Explore our coffee menu"
            >
              Khám phá ngay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-headline text-base font-bold hover:bg-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-300"
              aria-label="View full menu"
            >
              Xem thực đơn
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
