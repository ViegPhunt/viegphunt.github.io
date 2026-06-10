import { useEffect, useState } from 'react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

export default function TableOfContents() {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        // Extract all headings from article
        const article = document.querySelector('article');
        if (!article) return;

        const headingElements = article.querySelectorAll('h2, h3, h4');
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
        }
    };

    if (headings.length === 0) return null;

    return (
        <nav className="surface-panel toc-container hidden 2xl:block fixed right-8 top-[180px] w-[250px] max-h-[calc(100dvh-220px)] overflow-y-auto rounded-2xl p-4 backdrop-blur-xl">
            <div className="sticky top-0 bg-surface/95 pb-2">
                <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-purple">
                    Contents
                </h3>
            </div>
            
            <ul className="space-y-1 text-sm border-l border-border pl-0">
                {headings.map((heading) => {
                    const isActive = activeId === heading.id;
                    const paddingLeft = Math.max(0, heading.level - 2) * 14;
                    
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
                                    block rounded-r-md py-1.5 px-3 -ml-[1px] border-l transition-all duration-200
                                    hover:text-link hover:border-link
                                    ${
                                        isActive
                                        ? 'text-link border-link font-semibold bg-tag'
                                        : 'text-text/70 border-transparent'
                                    }
                                `}
                            >
                                {heading.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
