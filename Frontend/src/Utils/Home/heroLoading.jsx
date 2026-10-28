function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-16 sm:px-10 lg:px-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text Skeleton */}
        <div className="order-2 space-y-7 lg:order-1">
          {/* Small label */}
          <div className="h-5 w-32 animate-pulse rounded-full bg-gray-200" />

          {/* Heading */}
          <div className="space-y-4">
            <div className="h-10 w-full max-w-lg animate-pulse rounded-lg bg-gray-200 sm:h-14" />
            <div className="h-10 w-4/5 max-w-md animate-pulse rounded-lg bg-gray-200 sm:h-14" />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <div className="h-4 w-full max-w-lg animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-5/6 max-w-md animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 max-w-sm animate-pulse rounded bg-gray-100" />
          </div>

          {/* Button */}
          <div className="flex gap-4 pt-2">
            <div className="h-12 w-36 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>

        {/* Image Skeleton */}
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl bg-gray-100">
            {/* Animated shimmer */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            {/* Decorative placeholder shapes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-20 w-20 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="1.5"
                />
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
                <path
                  d="m21 15-5-5L5 21"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Screen-reader announcement */}
      <p className="sr-only" role="status">
        Loading hero section...
      </p>
    </section>
  );
}

export default HeroSkeleton;
