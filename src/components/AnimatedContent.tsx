'use client';

import React, { useRef, useEffect, forwardRef, useState, createContext, useContext } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Context for dropdown open state
interface DropdownAnimationContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownAnimationContext = createContext<DropdownAnimationContextType | null>(null);

export const useDropdownAnimation = () => useContext(DropdownAnimationContext);

export const DropdownAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DropdownAnimationContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DropdownAnimationContext.Provider>
  );
};

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  container?: Element | string | null;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  scaleInitial?: number;
  threshold?: number;
  delay?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  dropdownMode?: boolean;
  isOpen?: boolean;
}

// Modern minimalist defaults
const DEFAULT_DISTANCE = 16;
const DEFAULT_DURATION = 0.5;
const DEFAULT_EASE = 'power2.out';

const AnimatedContent = forwardRef<HTMLDivElement, AnimatedContentProps>(({
  children,
  container,
  distance = DEFAULT_DISTANCE,
  direction = 'vertical',
  reverse = false,
  duration = DEFAULT_DURATION,
  ease = DEFAULT_EASE,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  scaleInitial = 0.95,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.25,
  disappearEase = 'power2.inOut',
  onComplete,
  onDisappearanceComplete,
  dropdownMode = false,
  isOpen: controlledIsOpen,
  className = '',
  ...props
}, forwardedRef) => {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const dropdownContext = useDropdownAnimation();
  
  // Use controlled isOpen prop, or from context, or default
  const isOpen = controlledIsOpen ?? dropdownContext?.isOpen ?? true;
  const isDropdownVisible = dropdownMode && isOpen;

  const setRefs = (node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  // Dropdown mode: animate based on isOpen state
  useEffect(() => {
    if (!dropdownMode) return;
    
    const el = internalRef.current;
    if (!el) return;

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;

    gsap.killTweensOf(el);

    if (isOpen) {
      // Opening animation
      gsap.fromTo(el, 
        {
          [axis]: offset,
          scale: scaleInitial,
          opacity: 0,
          visibility: 'hidden',
        },
        {
          [axis]: 0,
          scale: 1,
          opacity: 1,
          visibility: 'visible',
          duration,
          ease: 'power3.out',
          delay,
          onComplete
        }
      );
    } else {
      // Closing animation
      gsap.to(el, {
        [axis]: offset / 2,
        scale: scaleInitial,
        opacity: 0,
        duration: disappearDuration,
        ease: disappearEase,
        onComplete: () => {
          gsap.set(el, { visibility: 'hidden' });
          onDisappearanceComplete?.();
        }
      });
    }

    return () => {
      gsap.killTweensOf(el);
    };
  }, [dropdownMode, isOpen, direction, reverse, distance, duration, delay, disappearDuration, disappearEase, scaleInitial, onComplete, onDisappearanceComplete]);

  // Scroll-triggered mode (original behavior)
  useEffect(() => {
    if (dropdownMode) return;
    
    const el = internalRef.current;
    if (!el) return;

    let scrollerTarget: Element | string | null = container || document.getElementById('snap-main-container') || null;

    if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;
    const startPct = (1 - threshold) * 100;

    gsap.set(el, {
      [axis]: offset,
      scale,
      opacity: animateOpacity ? initialOpacity : 1,
      visibility: 'visible'
    });

    const tl = gsap.timeline({
      paused: true,
      delay,
      onComplete: () => {
        if (onComplete) onComplete();
        if (disappearAfter > 0) {
          gsap.to(el, {
            [axis]: reverse ? distance : -distance,
            scale: 0.8,
            opacity: animateOpacity ? initialOpacity : 0,
            delay: disappearAfter,
            duration: disappearDuration,
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.()
          });
        }
      }
    });

    tl.to(el, {
      [axis]: 0,
      scale: 1,
      opacity: 1,
      duration,
      ease
    });

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget || window,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => tl.play()
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, [
    dropdownMode,
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    onComplete,
    onDisappearanceComplete
  ]);

  return (
    <div 
      ref={setRefs} 
      className={`${dropdownMode ? '' : 'invisible'} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
});

AnimatedContent.displayName = 'AnimatedContent';

export default AnimatedContent;
