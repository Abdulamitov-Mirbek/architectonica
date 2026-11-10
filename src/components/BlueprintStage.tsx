'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Blueprint = dynamic(() => import('./scene/Blueprint'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** The self-drawing line drawing of the house, as a section background. */
export function BlueprintStage() {
  const stage = useRef<HTMLDivElement>(null);
  const input = useRef({ visible: false, px: 0, py: 0 });
  const [env, setEnv] = useState({ mount: false, running: false, animate: true });

  useEffect(() => {
    const el = stage.current;
    if (!el || !hasWebGL()) return;
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnv((s) => ({ ...s, animate }));
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setEnv((s) => ({ ...s, mount: true })), { rootMargin: '500px 0px' });
    const vis = new IntersectionObserver(
      ([e]) => {
        input.current.visible = e.intersectionRatio > 0.2;
        setEnv((s) => ({ ...s, running: e.isIntersecting }));
      },
      { threshold: [0, 0.2] },
    );
    near.observe(el);
    vis.observe(el);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      input.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      input.current.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      near.disconnect();
      vis.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div
      ref={stage}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[58svh] min-h-[420px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] lg:h-[80svh]"
    >
      {env.mount && <Blueprint input={input} running={env.running} animate={env.animate} />}
    </div>
  );
}
