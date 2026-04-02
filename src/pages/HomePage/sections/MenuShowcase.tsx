import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  badge?: string;
  badgeColor?: string;
}

const MenuShowcase = () => {
  const [sectionRef, isVisible] = useScrollReveal(0.1);
  const navigate = useNavigate();

  const products: Product[] = [
    {
      id: '1',
      name: 'Sữa Đá Capital',
      description: 'Đậm đà phong vị truyền thống',
      price: '45.000đ',
      imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80',
      badge: 'Bán chạy',
      badgeColor: 'bg-primary text-on-primary-fixed',
    },
    {
      id: '2',
      name: 'Latte Nghệ Nhân',
      description: 'Sự kết hợp mượt mà, tinh tế',
      price: '55.000đ',
      imageUrl: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80',
    },
    {
      id: '3',
      name: 'Cold Brew Trái Cây',
      description: 'Sảng khoái & thanh mát',
      price: '65.000đ',
      imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&q=80',
      badge: 'Mùa hè',
      badgeColor: 'bg-tertiary text-white',
    },
    {
      id: '4',
      name: 'Phin Đen Đậm Vị',
      description: 'Tỉnh táo từ ngụm đầu tiên',
      price: '39.000đ',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className={`py-24 bg-surface-container-low transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      aria-labelledby="menu-heading"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div 
          className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <div>
            <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">
              Thực đơn đặc tuyển
            </span>
            <h2
              id="menu-heading"
              className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface"
            >
              Hương vị nghệ nhân
            </h2>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="hidden md:flex items-center gap-2 text-on-surface font-bold hover:text-primary hover:gap-3 transition-all duration-300 group"
            aria-label="View all menu items"
          >
            Tất cả thực đơn
            <ExternalLink className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <article
              key={product.id}
              onClick={() => navigate('/menu')}
              className={`group cursor-pointer transition-all duration-700 ease-out ${
                isVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-12 scale-95'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
              role="button"
              tabIndex={0}
              aria-label={`${product.name} - ${product.price}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/menu');
                }
              }}
            >
              {/* Product Image */}
              <div className="bg-surface-container-lowest rounded-full aspect-[4/5] mb-6 overflow-hidden relative shadow-md hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Badge */}
                {product.badge && (
                  <div
                    className={`absolute top-4 right-4 ${product.badgeColor} font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    aria-label={`Badge: ${product.badge}`}
                  >
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <h3 className="font-headline text-lg font-bold mb-1 text-on-surface transition-all duration-300 group-hover:text-primary group-hover:translate-x-1">
                {product.name}
              </h3>
              <p className="text-on-surface-variant text-sm mb-3 transition-colors duration-300 group-hover:text-on-surface">
                {product.description}
              </p>
              <span className="text-primary font-headline font-extrabold text-lg transition-all duration-300 group-hover:scale-110 inline-block">
                {product.price}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuShowcase;
