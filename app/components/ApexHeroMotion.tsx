'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ApexHeroMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.apex-hero');
    if (!hero) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      const counter = hero.querySelector('[data-apex-counter]');
      const progress = { value: 0 };
      const intro = gsap.timeline();
      intro.set('.apex-loader', { autoAlpha: 1 });
      intro.to(progress, { value: 100, duration: .5, ease: 'power1.out', onUpdate: () => { if (counter) counter.textContent = `${Math.round(progress.value)}%`; } }, 0);
      intro.to('.apex-loader', { autoAlpha: 0, duration: .2 }, .5);
      intro.fromTo('.apex-photo', { scale: .92, opacity: .5 }, { scale: 1, opacity: 1, duration: .9, ease: 'power3.out' }, .15);
      intro.fromTo('.apex-badge', { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: .6, clearProps: 'filter' }, .35);
      intro.fromTo('.apex-word', { opacity: 0, yPercent: 20, filter: 'blur(12px)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: .7, stagger: .055, ease: 'power2.out', clearProps: 'filter' }, .45);
      intro.fromTo('.apex-lead, .apex-hero-actions, .apex-hero-note', { opacity: 0, y: 10, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .6, stagger: .1, clearProps: 'filter' }, .75);

      const media = gsap.matchMedia();
      media.add('(min-width: 821px)', () => {
        const ready = hero.querySelector<HTMLElement>('.apex-ready');
        const first = hero.querySelector<HTMLElement>('.apex-first-screen');
        if (!ready || !first) return;
        ready.inert = true;
        const reveal = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${window.innerHeight * 1.4}`, pin: true, scrub: .5, invalidateOnRefresh: true, onUpdate: self => { const showing = self.progress > .36; ready.inert = !showing; first.inert = showing; } } });
        reveal.to('.apex-hero-copy, .apex-hero-footer', { y: -65, opacity: 0, duration: .4, ease: 'none' }, 0);
        reveal.to('.apex-photo', { scale: 1.08, opacity: 0, duration: .45, ease: 'none' }, .05);
        reveal.fromTo(ready, { autoAlpha: 0 }, { autoAlpha: 1, duration: .35, ease: 'none' }, .2);
        reveal.fromTo('.apex-card-box', { opacity: 0 }, { opacity: 1, duration: .25 }, .3);
        reveal.fromTo('.apex-card-float', { rotationY: -65, rotation: 15, scale: .8, filter: 'blur(14px)' }, { rotationY: 0, rotation: 0, scale: 1, filter: 'blur(0px)', duration: .65, ease: 'power3.out' }, .3);
        reveal.fromTo('[data-apex-ready]', { opacity: 0, y: 20, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .35, stagger: .055, ease: 'power2.out' }, .45);
        const cue = hero.querySelector<HTMLAnchorElement>('.apex-hero-footer a');
        const advance = (event: MouseEvent) => {
          event.preventDefault();
          const trigger = reveal.scrollTrigger;
          if (trigger) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * .98, behavior: 'smooth' });
        };
        cue?.addEventListener('click', advance);
        return () => { cue?.removeEventListener('click', advance); ready.inert = false; first.inert = false; };
      });
      media.add('(max-width: 820px)', () => {
        gsap.fromTo('.apex-card-box', { opacity: 0, y: 35, rotationY: -18 }, { opacity: 1, y: 0, rotationY: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.apex-ready', start: 'top 85%', once: true } });
      });
      const float = gsap.fromTo('.apex-system-card', { y: -7, rotation: -1 }, { y: 7, rotation: 1, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
      const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) float.play(); else float.pause(); }), { threshold: .05 });
      const card = hero.querySelector('.apex-card-box');
      if (card) observer.observe(card);
      return () => { observer.disconnect(); media.revert(); };
    }, hero);
    return () => ctx.revert();
  }, []);
  return null;
}
