import React, { useState, useEffect } from 'react';
import { AnimatedFeatureCard } from './ui/animated-feature-card';

const features = [
  {
    index: "01",
    tag: "VELOCIDAD",
    title: "De 0 a 100 en Segundos. Sube tu Excel y empieza a contactar.",
    imageSrc: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    color: "blue" as const,
  },
  {
    index: "02",
    tag: "PERSONALIZACIÓN",
    title: "Variables dinámicas para que cada mensaje se sienta humano y único.",
    imageSrc: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?w=800&q=80",
    color: "purple" as const,
  },
  {
    index: "03",
    tag: "SEGURIDAD",
    title: "Cero Riesgo de Bloqueo. Utiliza tu WhatsApp Web de forma orgánica.",
    imageSrc: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    color: "green" as const,
  },
  {
    index: "04",
    tag: "CONTROL",
    title: "El sistema recuerda a quién contactaste. Retoma donde lo dejaste.",
    imageSrc: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    color: "orange" as const,
  }
];

export const FeatureCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-8 relative w-full h-[400px]">
      {features.map((feature, i) => (
        <div 
          key={feature.index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <AnimatedFeatureCard
            index={feature.index}
            tag={feature.tag}
            title={feature.title}
            imageSrc={feature.imageSrc}
            color={feature.color}
            className="max-w-none h-full"
          />
        </div>
      ))}
      
      {/* Indicators outside the card */}
      <div className="absolute -bottom-8 left-0 flex w-full justify-center gap-2 z-20">
        {features.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            className="p-1 focus:outline-none group"
            aria-label={`Go to slide ${i + 1}`}
          >
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentIndex ? 'w-8 bg-primary-500' : 'w-2 bg-secondary-200 group-hover:bg-primary-300'
              }`} />
          </button>
        ))}
      </div>
    </div>
  );
};
