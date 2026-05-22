'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function ScrollAndClickEffects() {
  const [mounted, setMounted] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [isDesktop, setIsDesktop] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    setMounted(true);
    setIsDesktop(window.innerWidth > 768);

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Scroll Progress Bar at very top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 origin-left z-[99999] shadow-[0_0_10px_rgba(230,182,25,0.6)]"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #e6b619 100%)'
        }}
      />

      {/* Dynamic Cursor Light (Desktop Only) */}
      {isDesktop && (
        <div
          className="fixed pointer-events-none z-[9999] w-[180px] h-[180px] rounded-full blur-[80px] transition-all duration-300 ease-out opacity-25"
          style={{
            left: mousePos.x - 90,
            top: mousePos.y - 90,
            background: 'radial-gradient(circle, rgba(230, 182, 25, 0.4) 0%, rgba(230, 57, 70, 0.1) 50%, transparent 100%)',
          }}
        />
      )}

      {/* Click Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-[99999] rounded-full border border-[#e6b619]/40 bg-gradient-radial from-[#e6b619]/20 to-transparent -translate-x-1/2 -translate-y-1/2 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '100px',
            height: '100px'
          }}
        />
      ))}
    </>
  );
}
