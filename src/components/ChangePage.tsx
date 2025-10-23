'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import styles from '@/styles/components/ChangePage.module.css';

export default function ScrollManager() {
    const pathname = usePathname();
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
    }, [pathname]);
    
    return null;
}

interface AnimatedBoxProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    trigger?: boolean;
}

export function AnimatedBox({ children, delay = 0, trigger, className = '' }: AnimatedBoxProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (trigger !== undefined) {
            if (trigger) {
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, delay);
                return () => clearTimeout(timer);
            }
            return;
        }
        
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay, trigger]);

    return (
        <div 
            className={`${styles.animatedBox} ${isVisible ? styles.visible : ''} ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}