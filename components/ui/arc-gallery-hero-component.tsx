'use client';

import React, { useEffect, useState } from 'react';

// --- The ArcGalleryHero Component ---
type ArcGalleryHeroProps = {
  images: string[];
  // Wave parameters (new pattern)
  waveAmplitude?: number;     // Height of wave peaks/valleys
  waveFrequency?: number;     // Number of complete waves
  waveBaselineY?: number;     // Vertical position of wave center
  wavePhase?: number;         // Horizontal shift of wave
  // Legacy arc parameters (kept for backwards compatibility)
  startAngle?: number;
  endAngle?: number;
  radiusLg?: number;
  radiusMd?: number;
  radiusSm?: number;
  // size of each card for different screen sizes
  cardSizeLg?: number;
  cardSizeMd?: number;
  cardSizeSm?: number;
  // optional extra class on outer section
  className?: string;
  // custom content
  title?: React.ReactNode;
  description?: string;
  primaryButton?: React.ReactNode;
  secondaryButtons?: React.ReactNode;
};

export const ArcGalleryHero: React.FC<ArcGalleryHeroProps> = ({
  images,
  // Wave parameters with defaults
  waveAmplitude = 150,
  waveFrequency = 1.5,
  waveBaselineY = 200,
  wavePhase = Math.PI / 4,
  // Legacy arc parameters
  startAngle = 20,
  endAngle = 160,
  radiusLg = 480,
  radiusMd = 360,
  radiusSm = 260,
  cardSizeLg = 120,
  cardSizeMd = 100,
  cardSizeSm = 80,
  className = '',
  title,
  description,
  primaryButton,
  secondaryButtons,
}) => {
  const [dimensions, setDimensions] = useState({
    radius: radiusLg,
    cardSize: cardSizeLg,
  });

  // Effect to handle responsive resizing of the arc and cards
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ radius: radiusSm, cardSize: cardSizeSm });
      } else if (width < 1024) {
        setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
      } else {
        setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  // Calculate arc positioning
  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section className={`relative overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col ${className}`}>
      {/* Arc container */}
      <div
        className="relative mx-auto mt-20"
        style={{
          width: '100%',
          height: dimensions.radius * 1.2,
        }}
      >
        {/* Center reference point */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
          {/* Each image positioned on arc */}
          {images.map((src, i) => {
            // Calculate angle for this card
            const angle = startAngle + step * i;
            const angleRad = (angle * Math.PI) / 180;

            // Arc position
            const x = Math.cos(angleRad) * dimensions.radius;
            const y = Math.sin(angleRad) * dimensions.radius;

            // Optional: subtle wave ripple effect
            const waveRipple = 15 * Math.sin(3 * angleRad);
            const finalY = y + waveRipple;

            // Rotation follows the arc tangent with gentler tilt
            const rotation = -(90 - angle) * 0.3; // Scale down rotation for subtler effect

            return (
              <div
                key={i}
                className="absolute opacity-0 animate-fade-in-up"
                style={{
                  width: dimensions.cardSize,
                  height: dimensions.cardSize,
                  left: `calc(50% + ${x}px)`,
                  bottom: `${finalY}px`,
                  transform: `translate(-50%, 50%)`,
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: 'forwards',
                  zIndex: count - i,
                }}
              >
                <div
                  className="rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 transition-transform hover:scale-105 w-full h-full"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <img
                    src={src}
                    alt={`Memory ${i + 1}`}
                    className="block w-full h-full object-cover"
                    draggable={false}
                    // Add a fallback in case an image fails to load
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x400/334155/e2e8f0?text=Memory`;
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content positioned below the arc */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 -mt-32 md:-mt-44 lg:-mt-56">
        <div className="text-center max-w-3xl px-6 opacity-0 animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
          {title || (
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              Rediscover Your Memories with AI
            </h1>
          )}
          {description && (
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {primaryButton}
            {secondaryButtons}
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 50%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
        .animate-fade-in {
          animation-name: fade-in;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
      `}</style>
    </section>
  );
};
