'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/components/Header.module.css';

export default function Header() {
    const pathname = usePathname();
    const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY || 0;

            if (y <= 8) {
                if (scrollDir !== 'up') setScrollDir('up');
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
    }, [scrollDir]);

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }, [isMenuOpen]);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const getLinkClass = (href: string) => {
        const normalizedPathname = pathname.replace(/\/$/, '') || '/';
        const normalizedHref = href.replace(/\/$/, '') || '/';
        return normalizedPathname === normalizedHref ? styles.focusItem : styles.navItem;
    };

    return (
        <header
            onMouseEnter={() => setScrollDir('up')}
            className={`${styles.siteHeader} ${
                isMenuOpen ? styles.show : scrollDir === 'down' ? styles.hide : styles.show
            }`}
        >
            <div className={styles.headerContainer}>
                <Link href="/" className={styles.logo}>ViegPhunt</Link>
                <div
                    className={styles.menuButton}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"/>
                    </svg>
                </div>
                <div
                    className={`${styles.overlay} ${isMenuOpen ? styles.active : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                />
                <nav className={`${styles.navBar} ${isMenuOpen ? styles.navOpen : ''}`}>
                    <div className={styles.navLink}>
                        <Link href="/" className={getLinkClass("/")} onClick={() => setIsMenuOpen(false)}>Home</Link>
                    </div>
                    <div className={styles.navLink}>
                        <Link href="/projects" className={getLinkClass("/projects")} onClick={() => setIsMenuOpen(false)}>Projects</Link>
                    </div>
                    <div className={styles.navLink}>
                        <Link href="/writeup" className={getLinkClass("/writeup")} onClick={() => setIsMenuOpen(false)}>CTF WriteUps</Link>
                    </div>
                    <div className={styles.navLink}>
                        <Link href="/about" className={getLinkClass("/about")} onClick={() => setIsMenuOpen(false)}>About Me</Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}