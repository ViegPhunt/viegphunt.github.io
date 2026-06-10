'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SearchResult {
    title: string;
    description: string;
    link: string;
    type: 'project' | 'writeup';
    tags: string[];
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [allItems, setAllItems] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Helper function to parse cards into SearchResult[]
    const parseCards = (cards: NodeListOf<Element>): SearchResult[] => {
        const items: SearchResult[] = [];
        cards.forEach((card) => {
            const htmlCard = card as HTMLElement;
            const title = htmlCard.dataset.title || '';
            const description = htmlCard.dataset.description || '';
            const tags = (htmlCard.dataset.tags || '').split(',').filter(Boolean);
            
            // Get link - different for current page vs fetched page
            const link = (card as HTMLAnchorElement).href || htmlCard.querySelector('a')?.href || '';
            const type = link.includes('/projects/') ? 'project' : 'writeup';

            items.push({ title, description, link, type: type as 'project' | 'writeup', tags });
        });
        return items;
    };

    // Fetch all data from homepage
    useEffect(() => {
        if (isOpen && allItems.length === 0) {
            // Try to get cards from current page first
            const cards = document.querySelectorAll('[data-card]');
            
            if (cards.length > 0) {
                // Use cards from current page
                setAllItems(parseCards(cards));
            } else {
                // Fetch from homepage
                fetch('/')
                    .then(res => res.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const homeCards = doc.querySelectorAll('[data-card]');
                        setAllItems(parseCards(homeCards));
                    })
                    .catch(err => console.error('Error fetching search data:', err));
            }
        }
    }, [isOpen, allItems.length]);

    const titleId = 'search-modal-title';
    const inputId = 'site-search-input';

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            window.setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open (same as navbar)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Search functionality
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchQuery = query.toLowerCase();
        const filtered = allItems.filter(item => 
            item.title.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );

        setResults(filtered);
    }, [query, allItems]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 z-[calc(var(--z-modal)-1)] bg-background/75 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center px-4 pt-[10dvh] pointer-events-none">
                <div 
                    className="w-full max-w-2xl relative pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 id={titleId} className="sr-only">Search content</h2>
                    <div className="surface-panel rounded-2xl transition-colors focus-within:border-purple">
                        <div className="relative flex items-center p-4">
                            <svg
                                className="m-1 mr-4 text-text opacity-50"
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                id={inputId}
                                ref={inputRef}
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by title, description, or tags..."
                                className="min-w-0 flex-1 bg-transparent text-text text-lg outline-none placeholder:text-text placeholder:opacity-50"
                                aria-label="Search by title, description, or tags"
                                autoComplete="off"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="ml-2 p-1 text-text border-none rounded-full cursor-pointer flex items-center justify-center opacity-60 hover:text-text transition-all duration-300 ease-in-out hover:opacity-100 hover:bg-tag active:scale-90"
                                    aria-label="Clear search"
                                >
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {query && (
                        <div className="surface-panel absolute top-full left-0 right-0 mt-2 max-h-[min(60dvh,30rem)] overflow-y-auto rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {results.length === 0 ? (
                                <div className="text-center py-8 text-text/60 px-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="w-12 h-12 mx-auto mb-3" aria-hidden="true">
                                        <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/>
                                    </svg>
                                    <p>No results found for "{query}"</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {results.map((result, index) => (
                                        <a
                                            key={index}
                                            href={result.link}
                                            className="block p-4 rounded-lg border border-transparent hover:border-border hover:bg-raised transition-colors no-underline group"
                                            onClick={onClose}
                                        >
                                            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-purple font-bold">{result.type}</div>
                                            <h3 className="mb-3 text-xl text-text font-bold group-hover:text-purple transition-colors">{result.title}</h3>
                                            <p className="text-text/70 text-sm">{result.description}</p>
                                            {result.tags.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {result.tags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="px-2 py-1 bg-tag rounded-md text-xs text-text/50">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
