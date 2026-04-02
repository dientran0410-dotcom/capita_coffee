import { Coffee } from 'lucide-react';

import { cn } from '@/components/ui/utils';

type ProductsLoadingVariant = 'amber' | 'emerald';

export function ProductsLoading({
  text = 'ĐANG TẢI SẢN PHẨM...',
  variant = 'emerald',
  className,
}: {
  text?: string;
  variant?: ProductsLoadingVariant;
  className?: string;
}) {
  const accent =
    variant === 'emerald'
      ? {
          ring: 'border-emerald-600',
          icon: 'text-emerald-700 dark:text-emerald-400',
          text: 'text-emerald-700 dark:text-emerald-400',
        }
      : {
          ring: 'border-amber-500',
          icon: 'text-amber-600',
          text: 'text-amber-600',
        };

  return (
    <div
      className={cn('w-full py-16 flex items-center justify-center min-h-[260px]', className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border border-gray-200" />
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 border-t-transparent animate-spin',
              accent.ring,
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Coffee
              className={cn('w-6 h-6', accent.icon)}
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
        </div>

        <div
          className={cn(
            'text-sm font-bold tracking-widest uppercase font-headline',
            accent.text,
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
