'use client';

import React, { useState, useEffect } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import ThemeToggle from '@/components/ThemeToggle';
import SearchModal from '@/components/SearchModal';

export default function Header({ pathname }: { pathname: string }) {
    const [scrollDir, setScrollDir] = useScrollDirection();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }, [isMenuOpen]);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const getLinkClass = (href: string) => {
        const normalizedPathname = pathname.replace(/\/$/, '') || '/';
        const normalizedHref = href.replace(/\/$/, '') || '/';
        const isActive = normalizedPathname === normalizedHref;
        
        const baseClasses = 'w-full block text-lg text-center font-bold text-text py-4 lg:py-2 lg:px-2';
        const activeClasses = 'bg-tag lg:bg-transparent lg:relative lg:after:content-[""] lg:after:absolute lg:after:w-full lg:after:h-[2px] lg:after:left-0 lg:after:bottom-[5px] lg:after:bg-text';
        const inactiveClasses = 'text-text/70 hover:text-text group lg:relative lg:after:content-[""] lg:after:absolute lg:after:w-0 lg:after:h-[2px] lg:after:left-0 lg:after:bottom-[5px] lg:after:bg-text lg:after:transition-all lg:after:duration-200 lg:after:ease-in-out lg:hover:lg:after:w-full';
    
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/projects', label: 'Projects' },
        { href: '/writeups', label: 'CTF WriteUps' },
        { href: '/about', label: 'About Me' }
    ];

    const headerClasses = [
        'w-full', 'fixed', 'z-[1000]', 'h-header', 'transition-transform', 'duration-300', 'ease-in-out', 'border-b', 'border-border', 'text-text', 'bg-background', 'font-mono',
        // Mobile styles
        'shadow-none', 'px-4',
        // Desktop styles
        'lg:shadow-xl', 'lg:px-[10%]',
        // Conditional visibility
        isMenuOpen ? 'translate-y-0' : scrollDir === 'down' ? '-translate-y-full lg:-translate-y-[60px]' : 'translate-y-0'
    ].join(' ');

    const navClasses = [
        'items-center',
        // Mobile layout (base)
        'fixed', 'top-header', 'right-0', 'h-[calc(100vh-theme(spacing.header))]', 'w-[250px]', 'bg-background', 
        'flex', 'flex-col', 'p-0', 'gap-0', 'border-l', 'border-border', 'transition-all', 'duration-300', 'ease-in-out', 'z-[1000]',
        // Mobile state
        isMenuOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none',
        // Desktop layout (overrides)
        'lg:flex', 'lg:static', 'lg:h-auto', 'lg:w-auto', 'lg:bg-transparent', 'lg:flex-row', 
        'lg:p-0', 'lg:border-none', 'lg:opacity-100', 'lg:pointer-events-auto', 'lg:translate-x-0', 'lg:gap-8'
    ].join(' ');


    return (
        <>
        <header onMouseEnter={() => setScrollDir('up')} className={headerClasses}>
            <div className="h-full w-full mx-auto flex justify-between items-center">
                <a href="/" className="text-2xl font-bold text-text no-underline p-[0.5rem] lg:p-0">
                    ViegPhunt
                </a>
                <div
                    className="p-2 w-[45px] h-[45px] flex items-center justify-center fill-current text-text transition-transform duration-200 ease-in-out z-[1200] lg:hidden active:scale-110"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                    aria-controls="mobile-menu"
                    aria-expanded={isMenuOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-full h-full">
                        <path d={isMenuOpen ? "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" : "M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"}/>
                    </svg>
                </div>
                <div
                    className={`fixed top-header left-0 w-screen h-screen bg-black/20 backdrop-blur-sm transition-opacity z-[800] lg:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsMenuOpen(false)}
                />
                <nav id="mobile-menu" className={navClasses}>
                    {navLinks.map(link => (
                        <div key={link.href} className="w-full lg:w-auto">
                            <a href={link.href} className={getLinkClass(link.href)} onClick={() => setIsMenuOpen(false)}>
                                {link.label}
                            </a>
                        </div>
                    ))}
                    <div className="w-full flex items-center text-center justify-center gap-8 py-4 lg:static lg:w-auto lg:py-0">
                        <button
                            onClick={() => {
                                setIsSearchOpen(true);
                                setIsMenuOpen(false);
                            }}
                            className="text-text transition-transform duration-300 ease-in-out hover:scale-[115%]"
                            aria-label="Search"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="w-6 h-6">
                                <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/>
                            </svg>
                        </button>
                        <ThemeToggle />
                    </div>
                </nav>
            </div>
        </header>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}