'use client';

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

export function useScrollDirection(): ['up' | 'down', Dispatch<SetStateAction<'up' | 'down'>>] {
    const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up');
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY || 0;

            if (y <= 8) {
                setScrollDir(currentDir => currentDir !== 'up' ? 'up' : currentDir);
                lastYRef.current = y;
                tickingRef.current = false;
                return;
            }

            if (Math.abs(y - lastYRef.current) >= 24) {
                setScrollDir(y > lastYRef.current ? 'down' : 'up');
                lastYRef.current = y;
            }
            tickingRef.current = false;
        };

        const onScroll = () => {
            if (!tickingRef.current) {
                tickingRef.current = true;
                requestAnimationFrame(handleScroll);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return [scrollDir, setScrollDir];
}