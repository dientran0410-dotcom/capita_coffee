import { cn } from '@/components/ui/utils';

function PouringCupLogo({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)} aria-hidden="true">
      <svg
        viewBox="0 0 64 64"
        className="block h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* stream */}
        <rect
          x="31"
          y="6"
          width="2.6"
          height="22"
          rx="1.3"
          className="route-loader-stream"
          fill="currentColor"
          opacity="0.7"
        />

        {/* cup outline */}
        <path
          d="M18 24h26v18c0 7-5 12-12 12H30c-7 0-12-5-12-12V24Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M44 30h4c5 0 9 4 9 9s-4 9-9 9h-4"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M22 56h24"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* liquid fill */}
        <defs>
          <clipPath id="route-loader-cup-clip">
            <rect x="22" y="30" width="18" height="18" rx="4" />
          </clipPath>
        </defs>
        <g clipPath="url(#route-loader-cup-clip)">
          <rect
            x="20"
            y="28"
            width="22"
            height="22"
            className="route-loader-liquid"
            fill="currentColor"
            opacity="0.35"
          />
        </g>
      </svg>

      <style>{`
        @keyframes routeLoaderStream {
          0% { opacity: 0; transform: translateY(-10px) scaleY(0.2); }
          12% { opacity: 0.8; transform: translateY(0px) scaleY(1); }
          60% { opacity: 0.8; transform: translateY(10px) scaleY(1); }
          80% { opacity: 0; transform: translateY(14px) scaleY(0.2); }
          100% { opacity: 0; transform: translateY(14px) scaleY(0.2); }
        }

        @keyframes routeLoaderFill {
          0% { transform: translateY(18px) scaleY(0.15); }
          20% { transform: translateY(18px) scaleY(0.15); }
          70% { transform: translateY(0px) scaleY(1); }
          100% { transform: translateY(18px) scaleY(0.15); }
        }

        @keyframes routeLoaderBob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-1px) scale(1.03); }
        }

        .route-loader-stream {
          transform-origin: center top;
          animation: routeLoaderStream 900ms ease-in-out infinite;
        }

        .route-loader-liquid {
          transform-origin: 50% 100%;
          animation: routeLoaderFill 900ms ease-in-out infinite;
        }

        .route-loader-bob {
          animation: routeLoaderBob 900ms ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function RouteLoadingOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Đang chuyển trang"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-emerald-700 dark:text-emerald-400 text-6xl font-extrabold tracking-tight leading-none drop-shadow-sm">
          Capital Coffee
        </div>
        <div
          className={cn(
            'h-60 w-60 text-emerald-700 dark:text-emerald-400 drop-shadow-sm',
            'route-loader-bob',
          )}
        >
          <PouringCupLogo className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
