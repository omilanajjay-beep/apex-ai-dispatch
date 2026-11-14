'use client';
import { useEffect } from 'react';

export default function ExperienceMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.querySelector<HTMLElement>('.experience');
    if (!root || reduced) return;
    let frame = 0;
    let lastX = 0, lastY = 0, lastTime = 0;
    let timer: ReturnType<typeof setTimeout>;
    const render = () => {
      const progress = Math.min(1, window.scrollY / (window.innerHeight * .85));
      root.style.setProperty('--hero-scroll', String(progress));
      root.style.setProperty('--hero-photo-shift', `${progress * -28}px`);
      const finale = document.getElementById('finale');
      if (finale) {
        const bounds = finale.getBoundingClientRect();
        root.style.setProperty('--blind-progress', String(Math.max(0, Math.min(1, 1 - bounds.top / window.innerHeight))));
      }
      frame = 0;
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(render); };
    const move = (event: PointerEvent) => {
      const time = performance.now();
      const speed = Math.hypot(event.clientX - lastX, event.clientY - lastY) / Math.max(16, time - lastTime);
      lastX = event.clientX; lastY = event.clientY; lastTime = time;
      if (speed > 1.5 && (event.target as HTMLElement).closest('#finale')) {
        root.classList.add('chromatic-jerk'); clearTimeout(timer);
        timer = setTimeout(() => root.classList.remove('chromatic-jerk'), 180);
      }
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    root.querySelectorAll('.comfort-card, .comfort-intro, .visit-story, .expertise-heading').forEach(el => observer.observe(el));
    const photoObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('photo-in-view', entry.isIntersecting);
    }), { rootMargin: '120px 0px', threshold: .08 });
    root.querySelectorAll('.service-image').forEach(el => photoObserver.observe(el));
    const storyObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    }), { rootMargin: '120px 0px', threshold: .01 });
    root.querySelectorAll('.hvac-story').forEach(el => storyObserver.observe(el));
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    render();
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('pointermove', move); observer.disconnect(); photoObserver.disconnect(); storyObserver.disconnect(); cancelAnimationFrame(frame); clearTimeout(timer); };
  }, []);
  return null;
}
