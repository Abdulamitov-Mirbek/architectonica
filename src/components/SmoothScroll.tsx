'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';

/** Inertial smooth scrolling for the whole page (off when the visitor prefers reduced motion). */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      anchors: { offset: -72 },
      allowNestedScroll: true,
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
