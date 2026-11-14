'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const segment = (progress: number, range: [number, number]) => {
  const [start, end] = range;
  if (progress < start) return 0;
  if (progress > end) return 1;
  return (progress - start) / (end - start);
};

export default function ApexHeroMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.apex-hero');
    if (!hero) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const counter = hero.querySelector<HTMLElement>('[data-apex-counter]');
      const firstScreen = hero.querySelector<HTMLElement>('.apex-first-screen');
      const secondScreen = hero.querySelector<HTMLElement>('.apex-ready');
      const headlineContainer = hero.querySelector<HTMLElement>('.apex-hero-copy');
      const cardBox = hero.querySelector<HTMLElement>('.apex-card-box');
      const cardFloat = hero.querySelector<HTMLElement>('.apex-card-float');
      const cardArt = hero.querySelector<HTMLElement>('.apex-system-card');
      const headings = secondScreen?.querySelectorAll<HTMLElement>('.apex-heading-one .apex-reveal-word') ?? [];
      const subHeadings = secondScreen?.querySelectorAll<HTMLElement>('.apex-heading-two .apex-reveal-word') ?? [];
      const readyItems = secondScreen?.querySelectorAll<HTMLElement>('[data-apex-ready-item]') ?? [];
      if (!firstScreen || !secondScreen || !headlineContainer || !cardBox || !cardFloat || !cardArt) return;

      document.documentElement.setAttribute('data-locked', 'true');
      const counterProgress = { value: 0 };
      const intro = gsap.timeline({ defaults: { overwrite: 'auto' } });
      intro.set('.apex-loader', { autoAlpha: 1 });
      intro.fromTo('.apex-photo', { scale: 0, autoAlpha: .75 }, { scale: 1, autoAlpha: 1, duration: .85, ease: 'power2.out' }, .6);
      intro.to(counterProgress, {
        value: 100, duration: .5, ease: 'power1.out',
        onUpdate: () => { if (counter) counter.textContent = `${Math.round(counterProgress.value)}%`; },
      }, 0);
      intro.to('.apex-loader', { autoAlpha: 0, duration: .15, ease: 'power1.in' }, .5);
      intro.fromTo('.apex-photo-light', { opacity: .05, filter: 'brightness(1)' }, {
        keyframes: [
          { opacity: .9, filter: 'brightness(2.2)', duration: .09 },
          { opacity: .18, filter: 'brightness(1.15)', duration: .08 },
          { opacity: .8, filter: 'brightness(1.8)', duration: .1 },
          { opacity: .42, filter: 'brightness(1.3)', duration: .08 },
          { opacity: .72, filter: 'brightness(1.55)', duration: .1 },
        ], ease: 'none', clearProps: 'filter',
      }, 1.05);
      intro.fromTo('.apex-rim-flash', { opacity: 0, scale: .95 }, {
        keyframes: [{ opacity: .85, scale: 1 }, { opacity: 0, scale: 1.04 }], duration: .7, ease: 'power1.out',
      }, 1.05);
      intro.fromTo('.apex-badge', { opacity: 0, filter: 'blur(12px)' }, {
        opacity: 1, filter: 'blur(0px)', duration: .6, ease: 'power2.out', clearProps: 'filter',
      }, 1.1);
      intro.fromTo('.apex-nav', { opacity: 0, filter: 'blur(8px)', y: -8 }, {
        opacity: 1, filter: 'blur(0px)', y: 0, duration: .65, ease: 'power2.out', clearProps: 'filter',
      }, 1.15);
      intro.set('.apex-hero-copy h1', { opacity: 1 }, 1.25);
      intro.fromTo('.apex-hero-copy h1 .apex-word', { opacity: 0, filter: 'blur(12px)', yPercent: 20 }, {
        opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: .7, stagger: .04, ease: 'power2.out', clearProps: 'filter',
      }, 1.25);
      intro.fromTo('.apex-hero-actions', { opacity: 0, filter: 'blur(12px)' }, {
        opacity: 1, filter: 'blur(0px)', duration: .6, ease: 'power2.out', clearProps: 'filter',
      }, 1.55);
      intro.fromTo('.apex-lead, .apex-hero-note, .apex-hero-footer', { opacity: 0, filter: 'blur(12px)' }, {
        opacity: 1, filter: 'blur(0px)', duration: .6, stagger: .12, ease: 'power2.out', clearProps: 'filter',
      }, 1.85);
      intro.add(() => {
        document.documentElement.removeAttribute('data-locked');
        ScrollTrigger.refresh();
      }, 2.3);

      const media = gsap.matchMedia();
      media.add('(min-width: 821px)', () => {
        const reveal = gsap.timeline({ paused: true });
        const float = gsap.fromTo(cardArt, { yPercent: -3, rotation: -1.5 }, {
          yPercent: 3, rotation: 1.5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
        });
        reveal.fromTo(cardBox, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power1.out' }, 0);
        reveal.fromTo(cardFloat, { rotationY: -70, rotation: 18, scale: .75, filter: 'blur(16px) brightness(1.6)' }, {
          rotationY: 0, rotation: 0, scale: 1, filter: 'blur(0px) brightness(1)', duration: 1.4, ease: 'power3.out', clearProps: 'filter',
        }, 0);
        if (headings.length) reveal.fromTo(headings, { opacity: 0, filter: 'blur(12px)', yPercent: 20 }, {
          opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: .7, stagger: .04, ease: 'power2.out', clearProps: 'filter',
        }, .15);
        if (subHeadings.length) reveal.fromTo(subHeadings, { opacity: 0, filter: 'blur(12px)', yPercent: 20 }, {
          opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: .7, stagger: .04, ease: 'power2.out', clearProps: 'filter',
        }, .3);
        if (readyItems[0]) reveal.fromTo(readyItems[0], { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: .6, clearProps: 'filter' }, .55);
        if (readyItems[1]) reveal.fromTo(readyItems[1], { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: .6, clearProps: 'filter' }, .65);
        if (readyItems[2]) reveal.fromTo(readyItems[2], { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: .6, clearProps: 'filter' }, .75);
        if (readyItems[3]) reveal.fromTo(readyItems[3], { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: .6, clearProps: 'filter' }, .9);

        let hasShownReveal = false;
        let hasReversedReveal = false;
        secondScreen.inert = true;
        const scrollTrigger = ScrollTrigger.create({
          trigger: hero, start: 'top top', end: () => `+=${window.innerHeight * 2.5}`,
          pin: true, scrub: .5, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const rise = segment(progress, [0, .4]) * 120;
            headlineContainer.style.transform = `translateY(-${rise}px)`;
            secondScreen.style.opacity = String(segment(progress, [.3, .7]));
            secondScreen.style.visibility = progress > .05 ? 'visible' : 'hidden';
            secondScreen.style.pointerEvents = progress > .35 ? 'auto' : 'none';
            secondScreen.inert = progress <= .3;
            firstScreen.inert = progress >= .65;
            hero.style.setProperty('--apex-portal-light', String(segment(progress, [.25, .62])));
            if (progress >= .6 && !hasShownReveal) {
              hasShownReveal = true;
              hasReversedReveal = false;
              reveal.timeScale(1).play();
              float.play();
            } else if (progress < .3 && hasShownReveal && !hasReversedReveal) {
              hasReversedReveal = true;
              hasShownReveal = false;
              reveal.timeScale(2).reverse();
              float.pause();
            }
          },
          onRefresh: (self) => {
            if (self.progress <= .3) {
              secondScreen.inert = true;
              firstScreen.inert = false;
            }
          },
        });
        const cue = hero.querySelector<HTMLAnchorElement>('.apex-hero-footer a');
        const advance = (event: MouseEvent) => {
          event.preventDefault();
          window.scrollTo({ top: scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * .7, behavior: 'smooth' });
        };
        cue?.addEventListener('click', advance);
        return () => {
          cue?.removeEventListener('click', advance);
          scrollTrigger.kill();
          reveal.kill();
          float.kill();
          secondScreen.inert = false;
          firstScreen.inert = false;
        };
      });

      media.add('(max-width: 820px)', () => {
        const float = gsap.fromTo(cardArt, { yPercent: -3, rotation: -1.5 }, {
          yPercent: 3, rotation: 1.5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
        });
        const cardObserver = new IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) float.play(); else float.pause();
        }), { threshold: .05 });
        cardObserver.observe(cardBox);
        gsap.fromTo(cardBox, { opacity: 0, y: 30, rotationY: -25 }, {
          opacity: 1, y: 0, rotationY: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: secondScreen, start: 'top 85%', once: true },
        });
        return () => { cardObserver.disconnect(); float.kill(); };
      });

      return () => {
        media.revert();
        document.documentElement.removeAttribute('data-locked');
      };
    }, hero);
    return () => ctx.revert();
  }, []);

  return null;
}
