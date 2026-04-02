import { useState, type FormEvent } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionRef, isVisible] = useScrollReveal(0.2);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert(`Đăng ký thành công với email: ${email}`);
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <section 
      ref={sectionRef}
      className={`py-24 px-4 md:px-8 transition-all duration-1000 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`} 
      aria-labelledby="newsletter-heading"
    >
      <div className="max-w-7xl mx-auto primary-gradient rounded-full p-12 md:p-16 text-center text-on-primary-fixed shadow-2xl shadow-primary/20 relative overflow-hidden hover:shadow-3xl hover:shadow-primary/30 transition-all duration-500">
        {/* Abstract Pattern Overlays */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />

        {/* Content */}
        <div className="relative z-10">
          <h2 
            id="newsletter-heading" 
            className={`font-headline text-3xl md:text-4xl font-extrabold mb-6 transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            Tham gia cộng đồng yêu cà phê
          </h2>
          <p 
            className={`max-w-xl mx-auto mb-10 text-on-primary-fixed/80 text-sm md:text-base transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            Nhận thông tin sớm nhất về các sản phẩm mới, chương trình ưu đãi và
            kiến thức cà phê từ các chuyên gia.
          </p>

          {/* Newsletter Form */}
          <form
            onSubmit={handleSubmit}
            className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={{ transitionDelay: '400ms' }}
            aria-label="Newsletter subscription form"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              required
              disabled={isSubmitting}
              className="flex-grow rounded-full px-6 py-4 bg-white/20 border border-white/20 text-on-primary-fixed placeholder:text-on-primary-fixed/50 focus:ring-2 focus:ring-white focus:outline-none focus:bg-white/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby="email-description"
            />
            <span id="email-description" className="sr-only">
              Enter your email address to receive newsletters and updates
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-primary font-headline font-bold px-8 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label={isSubmitting ? 'Submitting...' : 'Subscribe to newsletter'}
            >
              {isSubmitting ? 'Đang gửi...' : 'Đăng ký nhận tin'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
