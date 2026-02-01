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

        const headingElements = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingData: Heading[] = Array.from(headingElements).map((heading) => ({
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
            headingElements.forEach((heading) => {
                observer.unobserve(heading);
            });
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
        <nav className="toc-container hidden 2xl:block fixed right-8 top-[180px] w-[240px] max-h-[calc(100vh-220px)] overflow-y-auto">
            <div className="sticky top-0 bg-background pb-2">
                <h3 className="text-base font-bold text-text uppercase tracking-wide mb-3">
                    Table of Contents
                </h3>
            </div>
            
            <ul className="space-y-2 text-base border-l-2 border-border pl-0">
                {headings.map((heading) => {
                    const isActive = activeId === heading.id;
                    const paddingLeft = (heading.level - 1) * 20;
                    
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
                                    block py-1 px-3 -ml-[2px] border-l-2 transition-all duration-200
                                    hover:text-link hover:border-link
                                    ${
                                        isActive
                                        ? 'text-link border-link font-medium'
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