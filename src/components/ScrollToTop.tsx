'use client';

import { useState, useEffect } from 'react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [footerHeight, setFooterHeight] = useState(0);
    const [bottomOffset, setBottomOffset] = useState(50);

    useEffect(() => {
        const footer = document.querySelector('footer');
        if (!footer) return;

        const updateFooterHeight = () => {
            const rect = footer.getBoundingClientRect();
            setFooterHeight(rect.height);
            document.documentElement.style.setProperty('--height-footer', `${rect.height}px`);
        };

        updateFooterHeight();

        const resizeObserver = new ResizeObserver(updateFooterHeight);
        resizeObserver.observe(footer);

        window.addEventListener('resize', updateFooterHeight);

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;

            setIsVisible(scrollY > 500);

            const footerTop = docHeight - footerHeight;
            const overlap = Math.max(0, scrollY + windowHeight - footerTop);
            const ratio = Math.min(overlap / footerHeight, 1);

            const newBottom = 50 + ratio * footerHeight;
            setBottomOffset(newBottom);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateFooterHeight);
            resizeObserver.disconnect();
        };
    }, [footerHeight]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            style={{ bottom: `${bottomOffset}px` }}
            className={`
                fixed right-[50px] z-[1000] flex h-[50px] w-[50px] items-center justify-center rounded-full border-none cursor-pointer
                bg-[var(--color-bg-main)] text-[var(--color-text)] shadow-[0_0px_8px_var(--color-shadow)]
                transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                group max-[1150px]:hidden
                hover:-translate-y-[2px] hover:scale-[1.05] hover:shadow-[0_0_15px_var(--color-shadow)]
                active:translate-y-0 active:scale-[0.95]
                ${isVisible 
                    ? 'visible translate-y-0 scale-100 opacity-100' 
                    : 'invisible translate-y-[20px] scale-[0.8] opacity-0'
                }
            `}
        >
            <svg 
                width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-200 ease-linear group-hover:-translate-y-[1px]"
            >
                <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
    );
}