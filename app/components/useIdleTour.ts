'use client';

import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

export const IDLE_START_MS = 2000;
export const MANUAL_IDLE_MS = 12000;
export const HERO_INITIAL_DWELL_MS = 5000;
export const WORK_DWELL_MS = 20000;
export const FOOTER_DWELL_MS = 8000;

export type IdleTourWaypoint = {
  name: string;
  target: number;
  dwell: number;
};

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const easeInOut = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

/** Return the next meaningful waypoint, never one that is already behind the reader. */
export function upcomingWaypointIndex(waypoints: readonly IdleTourWaypoint[], scrollY: number): number {
  const index = waypoints.findIndex((waypoint) => waypoint.target > scrollY + 8);
  return index < 0 ? Math.max(0, waypoints.length - 1) : index;
}

function sectionTop(id: string): number | null {
  const element = document.getElementById(id);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.top + window.scrollY;
}

function sectionHeight(id: string, fallback: number): number {
  const element = document.getElementById(id);
  return element ? Math.max(element.getBoundingClientRect().height, fallback) : fallback;
}

/** Measure section progress against the portion that can actually be scrolled through the viewport. */
export function measureWaypoints(): IdleTourWaypoint[] {
  const hero = sectionTop('top');
  const services = sectionTop('services');
  const work = sectionTop('work');
  const contact = sectionTop('contact');
  if (hero == null || services == null || work == null || contact == null) return [];

  const heroHeight = sectionHeight('top', window.innerHeight * 4);
  const servicesHeight = sectionHeight('services', window.innerHeight * 3);
  const innerHeight = Math.max(1, window.innerHeight);
  const documentMax = Math.max(0, (document.documentElement?.scrollHeight ?? 0) - innerHeight);
  const progressTarget = (top: number, height: number, fraction: number) =>
    clamp(top + Math.max(0, height - innerHeight) * fraction, 0, documentMax);
  const at = (name: string, target: number, dwell: number): IdleTourWaypoint => ({
    name,
    target: clamp(target, 0, documentMax),
    dwell,
  });

  return [
    at('hero-start', hero, HERO_INITIAL_DWELL_MS),
    at('hero-intro', progressTarget(hero, heroHeight, 0.27), 4500),
    at('hero-final', progressTarget(hero, heroHeight, 0.61), 5000),
    at('services-start', progressTarget(services, servicesHeight, 0.15), 4500),
    at('services-middle', progressTarget(services, servicesHeight, 0.44), 4500),
    at('services-end', progressTarget(services, servicesHeight, 0.88), 4500),
    at('work', work, WORK_DWELL_MS),
    at('footer', contact, FOOTER_DWELL_MS),
  ];
}

function hasBlockedFocus(): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (active.matches('input, textarea, select, [contenteditable="true"]')) return true;
  return Boolean(active.closest('#work button'));
}

function isTourControl(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-idle-tour-control]'));
}

function isManualNavigation(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a[href^="#"]'));
}

export default function useIdleTour({ enabled, paused }: { enabled: boolean; paused: boolean }) {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const explicitPauseRef = useRef(false);
  const stageRef = useRef(0);
  const phaseElapsedRef = useRef(0);
  const originRef = useRef(0);
  const travelMsRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const scheduleRef = useRef<(() => void) | null>(null);
  const startTimerRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const pausedPropRef = useRef(paused);
  const enabledRef = useRef(enabled);
  const reducedRef = useRef(reduce !== false);

  const setPlayingSafe = useCallback((value: boolean) => {
    playingRef.current = value;
    setPlaying(value);
  }, []);

  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastTimeRef.current = null;
  }, []);

  const stop = useCallback((persistent = false) => {
    if (persistent) explicitPauseRef.current = true;
    cancelFrame();
    setPlayingSafe(false);
  }, [cancelFrame, setPlayingSafe]);

  const begin = useCallback((fromCurrent = false) => {
    if (!enabledRef.current || reducedRef.current || pausedPropRef.current || !visibleRef.current || document.hidden || document.getElementById('outbox-menu') || document.querySelector('.chat-drawer') || hasBlockedFocus()) return;
    const waypoints = measureWaypoints();
    if (!waypoints.length) return;
    if (fromCurrent || Math.abs(window.scrollY - waypoints[0].target) > 8) {
      stageRef.current = upcomingWaypointIndex(waypoints, window.scrollY);
    }
    stageRef.current = Math.min(stageRef.current, waypoints.length - 1);
    phaseElapsedRef.current = 0;
    originRef.current = window.scrollY;
    travelMsRef.current = stageRef.current === 0
      ? 0
      : Math.max(2500, Math.min(4000, Math.abs(waypoints[stageRef.current].target - originRef.current) * 1.25));
    lastTimeRef.current = null;
    setPlayingSafe(true);
    scheduleRef.current?.();
  }, [setPlayingSafe]);

  const manualPause = useCallback((persistent = false) => {
    if (startTimerRef.current != null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    stop(persistent);
    if (persistent || !enabledRef.current || reducedRef.current || pausedPropRef.current) return;
    if (resumeTimerRef.current != null) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      resumeTimerRef.current = null;
      if (!explicitPauseRef.current) begin(true);
    }, MANUAL_IDLE_MS);
  }, [begin, stop]);

  const toggle = useCallback(() => {
    if (!enabledRef.current || reducedRef.current) return;
    if (playingRef.current) {
      explicitPauseRef.current = true;
      stop(true);
    } else {
      explicitPauseRef.current = false;
      if (startTimerRef.current != null) window.clearTimeout(startTimerRef.current);
      if (resumeTimerRef.current != null) window.clearTimeout(resumeTimerRef.current);
      begin(true);
    }
  }, [begin, stop]);

  useEffect(() => {
    enabledRef.current = enabled;
    reducedRef.current = reduce !== false;
    if (!enabled || reduce !== false) {
      explicitPauseRef.current = false;
      if (startTimerRef.current != null) window.clearTimeout(startTimerRef.current);
      stop();
    }
  }, [enabled, reduce, stop]);

  useEffect(() => {
    const wasPaused = pausedPropRef.current;
    pausedPropRef.current = paused;
    if (paused) stop();
    else if (wasPaused && !explicitPauseRef.current) manualPause(false);
  }, [manualPause, paused, stop]);

  useEffect(() => {
    if (!enabled || reduce !== false) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMediaChange = () => {
      reducedRef.current = media.matches;
      if (media.matches) stop();
    };
    onMediaChange();

    const run = (time: number) => {
      frameRef.current = null;
      if (!playingRef.current || pausedPropRef.current || reducedRef.current || !visibleRef.current || document.hidden || document.getElementById('outbox-menu') || document.querySelector('.chat-drawer') || hasBlockedFocus()) {
        if (playingRef.current) manualPause(false);
        return;
      }
      const waypoints = measureWaypoints();
      const waypoint = waypoints[stageRef.current];
      if (!waypoint) { stop(); return; }
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const delta = Math.min(100, Math.max(0, time - lastTimeRef.current));
      lastTimeRef.current = time;
      const travelMs = travelMsRef.current;
      if (travelMs > 0 && phaseElapsedRef.current < travelMs) {
        phaseElapsedRef.current += delta;
        const progress = clamp(phaseElapsedRef.current / travelMs);
        window.scrollTo({ top: originRef.current + (waypoint.target - originRef.current) * easeInOut(progress), behavior: 'instant' as ScrollBehavior });
      } else {
        phaseElapsedRef.current += delta;
      }
      const dwellElapsed = Math.max(0, phaseElapsedRef.current - travelMs);
      if (dwellElapsed >= waypoint.dwell) {
        if (stageRef.current >= waypoints.length - 1) { stop(); return; }
        stageRef.current += 1;
        originRef.current = window.scrollY;
        phaseElapsedRef.current = 0;
        travelMsRef.current = Math.max(2500, Math.min(4000, Math.abs(waypoints[stageRef.current].target - originRef.current) * 1.25));
      }
      scheduleRef.current?.();
    };

    const schedule = () => {
      if (frameRef.current == null && playingRef.current) frameRef.current = window.requestAnimationFrame(run);
    };
    scheduleRef.current = schedule;
    const onVisibility = () => {
      visibleRef.current = !document.hidden;
      lastTimeRef.current = null;
      if (document.hidden) cancelFrame(); else schedule();
    };
    const onInput = (event: Event) => {
      if (isTourControl(event.target)) return;
      if (event.type === 'click' && !isManualNavigation(event.target)) return;
      manualPause(false);
    };
    const onFocus = () => { if (hasBlockedFocus()) manualPause(false); };
    const events: Array<[string, EventListener, AddEventListenerOptions | undefined]> = [
      ['wheel', onInput, { passive: true }], ['touchstart', onInput, { passive: true }], ['pointerdown', onInput, { passive: true }],
      ['keydown', onInput, undefined], ['click', onInput, { passive: true }], ['focusin', onFocus, undefined],
    ];
    events.forEach(([name, listener, options]) => document.addEventListener(name, listener, options));
    document.addEventListener('visibilitychange', onVisibility);
    media.addEventListener?.('change', onMediaChange);
    startTimerRef.current = window.setTimeout(() => {
      startTimerRef.current = null;
      if (!explicitPauseRef.current) begin(false);
    }, IDLE_START_MS);
    return () => {
      scheduleRef.current = null;
      events.forEach(([name, listener, options]) => document.removeEventListener(name, listener, options));
      document.removeEventListener('visibilitychange', onVisibility);
      media.removeEventListener?.('change', onMediaChange);
      if (startTimerRef.current != null) window.clearTimeout(startTimerRef.current);
      if (resumeTimerRef.current != null) window.clearTimeout(resumeTimerRef.current);
      cancelFrame();
    };
  }, [begin, cancelFrame, enabled, manualPause, reduce, stop]);

  return { playing, toggle };
}
