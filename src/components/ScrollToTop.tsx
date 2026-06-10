'use client';

import { useState, useEffect, useRef } from 'react';

export default function ScrollToTop() {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const isVisibleRef = useRef(false);

    useEffect(() => {
        const footer = document.querySelector('footer');
        const button = buttonRef.current;
        let rafId = 0;
        const baseOffset = 50;

        if (!button) return;

        const updatePosition = () => {
            rafId = 0;

            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const nextVisible = scrollY > 500;

            if (nextVisible !== isVisibleRef.current) {
                isVisibleRef.current = nextVisible;
                setIsVisible(nextVisible);
            }

            if (footer) {
                const footerTop = footer.getBoundingClientRect().top;
                const overlap = Math.max(0, window.innerHeight - footerTop);
                button.style.setProperty('--scroll-top-bottom', `${baseOffset + overlap}px`);
            } else {
                button.style.setProperty('--scroll-top-bottom', `${baseOffset}px`);
            }
        };

        const requestUpdate = () => {
            if (rafId) return;
            rafId = window.requestAnimationFrame(updatePosition);
        };

        const resizeObserver = footer ? new ResizeObserver(requestUpdate) : null;
        resizeObserver?.observe(footer as Element);

        requestUpdate();

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate, { passive: true });

        return () => {
            window.removeEventListener('scroll', requestUpdate);
            window.removeEventListener('resize', requestUpdate);
            resizeObserver?.disconnect();
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, []);

    const scrollToTop = () => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    };

    return (
        <button
            ref={buttonRef}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            data-visible={isVisible}
            className="scroll-top-button group"
        >
            <svg 
                width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-200 ease-linear group-hover:-translate-y-[1px]"
                aria-hidden="true"
            >
                <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
    );
}
