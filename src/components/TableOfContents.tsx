import { useEffect, useState } from 'react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

export default function TableOfContents() {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Extract all headings from article
        const article = document.querySelector('article');
        if (!article) return;

        const headingElements = article.querySelectorAll('h1, h2, h3, h4');
        const headingData: Heading[] = Array.from(headingElements)
            .filter((heading) => heading.id)
            .map((heading) => ({
                id: heading.id,
                text: heading.textContent?.replace('#', '').trim() || '',
                level: parseInt(heading.tagName.substring(1)),
            }));

        setHeadings(headingData);

        // Intersection Observer to detect active heading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '0px 0px -80% 0px',
            }
        );

        headingElements.forEach((heading) => {
            observer.observe(heading);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const elementTop = element.getBoundingClientRect().top;
            const yOffset = elementTop < 0 ? -100 : -35;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // Update URL without triggering scroll
            history.pushState(null, '', `#${id}`);
            setActiveId(id);
            setIsOpen(false);
        }
    };

    if (headings.length === 0) return null;

    const renderHeadingList = () => (
        <ul className="space-y-1 border-l border-border pl-0 text-sm">
            {headings.map((heading) => {
                const isActive = activeId === heading.id;
                const paddingLeft = Math.max(0, heading.level - 1) * 14;

                return (
                    <li
                        key={heading.id}
                        style={{ paddingLeft: `${paddingLeft}px` }}
                        className="relative"
                    >
                        <a
                            href={`#${heading.id}`}
                            onClick={(e) => handleClick(e, heading.id)}
                            className={`
                                block rounded-r-md border-l px-3 py-1.5 -ml-[1px] transition-all duration-200
                                hover:border-link hover:text-link
                                ${
                                    isActive
                                        ? 'border-link bg-tag font-semibold text-link'
                                        : 'border-transparent text-text/70'
                                }
                            `}
                        >
                            {heading.text}
                        </a>
                    </li>
                );
            })}
        </ul>
    );

    return (
        <>
            <div className="fixed bottom-5 left-4 z-[var(--z-floating)] 2xl:hidden">
                <button
                    type="button"
                    aria-label="Open table of contents"
                    aria-expanded={isOpen}
                    aria-controls="mobile-toc-panel"
                    onClick={() => setIsOpen(true)}
                    className="surface-panel flex size-12 items-center justify-center rounded-2xl text-purple shadow-[0_18px_44px_-28px_var(--color-shadow)] backdrop-blur-xl transition-all duration-200 hover:text-link active:scale-95"
                >
                    <i className="fa-solid fa-bars" aria-hidden="true"></i>
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[var(--z-modal)] 2xl:hidden" role="presentation">
                    <button
                        type="button"
                        aria-label="Close table of contents"
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-sm"
                    />

                    <nav
                        id="mobile-toc-panel"
                        aria-label="Table of contents"
                        className="surface-panel toc-container fixed bottom-20 left-4 max-h-[calc(100dvh-160px)] w-[250px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl p-4 backdrop-blur-xl"
                    >
                        <div className="sticky top-0 bg-surface/95 pb-2">
                            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-purple">
                                Table of contents
                            </h3>
                        </div>

                        {renderHeadingList()}
                    </nav>
                </div>
            )}

            <nav
                aria-label="Table of contents"
                className="surface-panel toc-container fixed right-8 top-[180px] hidden max-h-[calc(100dvh-220px)] w-[250px] overflow-y-auto rounded-2xl p-4 backdrop-blur-xl 2xl:block"
            >
                <div className="sticky top-0 bg-surface/95 pb-2">
                    <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-purple">
                        Table of contents
                    </h3>
                </div>

                {renderHeadingList()}
            </nav>
        </>
    );
}
