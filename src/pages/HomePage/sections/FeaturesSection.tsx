import { Sprout, Flame, Store, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const FeaturesSection = () => {
  const [sectionRef, isVisible] = useScrollReveal(0.1);

  return (
    <section
      ref={sectionRef}
      className={`py-24 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      aria-labelledby="features-heading"
    >
      <h2 id="features-heading" className="sr-only">
        Coffee Features and Services
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Intro Card with Image */}
        <article 
          className={`md:col-span-8 relative rounded-full overflow-hidden min-h-[500px] group bg-surface-container-lowest shadow-sm transition-all duration-700 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <img
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80"
            alt="Farmer hands holding ripe red coffee cherries"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12 transition-all duration-500 group-hover:from-black/70">
            <h3 className="font-headline text-3xl md:text-4xl font-bold text-white mb-4 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
              Nghệ thuật canh tác chuẩn hiện đại
            </h3>
            <p className="text-white/80 max-w-lg mb-6 leading-relaxed text-sm md:text-base transition-all duration-500 group-hover:text-white/90">
              Mỗi hạt cà phê tại Capital Coffee đều được chăm sóc tỉ mỉ từ những
              trang trại bền vững, kết hợp phương pháp truyền thống và công nghệ
              xanh tiên tiến.
            </p>
            <a
              href="#"
              className="text-primary-container font-bold flex items-center gap-2 hover:gap-3 transition-all duration-300 group/link"
              aria-label="Learn more about sustainable farming"
            >
              Tìm hiểu thêm
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/link:translate-x-1" aria-hidden="true" />
            </a>
          </div>
        </article>

        {/* Sub Feature Cards */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Roasting Card */}
          <article 
            className={`bg-surface-container-high p-8 md:p-10 rounded-full h-full flex flex-col justify-center relative overflow-hidden group transition-all duration-700 hover:shadow-lg hover:-translate-y-1 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:rotate-12" aria-hidden="true">
              <Flame className="w-20 h-20" />
            </div>
            <Flame className="w-12 h-12 text-primary mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" aria-hidden="true" />
            <h3 className="font-headline text-xl md:text-2xl font-bold mb-4 text-on-surface transition-colors duration-300 group-hover:text-primary">
              Rang xay tinh xảo
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6 transition-colors duration-300 group-hover:text-on-surface">
              Công thức rang bí truyền đánh thức mọi giác quan trong từng tách cà
              phê đậm đà.
            </p>
            <span className="w-12 h-1 bg-primary rounded-full transition-all duration-500 group-hover:w-20" aria-hidden="true" />
          </article>

          {/* Franchise Card with Primary Gradient */}
          <article 
            className={`primary-gradient p-8 md:p-10 rounded-full h-full flex flex-col justify-center text-on-primary-fixed shadow-xl shadow-primary/10 group transition-all duration-700 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <Store className="w-12 h-12 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true" />
            <h3 className="font-headline text-xl md:text-2xl font-bold mb-4 transition-transform duration-300 group-hover:translate-x-1">
              Nhượng quyền
            </h3>
            <p className="text-on-primary-fixed/80 text-sm leading-relaxed mb-8 transition-all duration-300 group-hover:text-on-primary-fixed/90">
              Trở thành đối tác của Capital Coffee và cùng chúng tôi lan tỏa hương
              vị Việt ra thế giới.
            </p>
            <button
              className="bg-white text-primary font-headline text-sm font-bold py-3 px-6 rounded-full self-start hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
              aria-label="Learn about franchise opportunities"
            >
              Hợp tác ngay
            </button>
          </article>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
