'use client';

import React, { memo, useState, Children, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Scrollbar from './Scrollbar';
import styles from '@/styles/components/MarkdownRenderer.module.css';

// Constants for scroll behavior and UI timing
const SCROLL_OFFSET = 60;
const COPY_TIMEOUT = 2000;
const SCROLL_CONTAINER_DELAY = 100;

// Props interface for MarkdownRenderer component
interface MarkdownRendererProps {
    content: string;
    loading?: boolean;
    error?: boolean;
    githubUrl?: string;
    filePath?: string;
    welcomeMessage?: string;
}

// Custom code block component with syntax highlighting and copy functionality
const CodeBlock = ({ children, className, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const codeContainerRef = useRef<HTMLDivElement>(null);
    const [actualScrollContainer, setActualScrollContainer] = useState<HTMLElement | null>(null);
    const actualScrollRef = useRef<HTMLElement | null>(null);
    
    // Extract language from className (e.g., "language-javascript" -> "javascript")
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');
    
    // Determine if this is a code block (vs inline code)
    const isCodeBlock = className?.includes('language-') || 
                        className === 'hljs' || 
                        (typeof children === 'string' && children.includes('\n')) ||
                        props.node?.tagName === 'pre';

    // Sync scroll container ref with state
    React.useEffect(() => {
        actualScrollRef.current = actualScrollContainer;
    }, [actualScrollContainer]);

    // Find the actual scrollable container for code blocks
    React.useEffect(() => {
        const findScrollContainer = () => {
            if (!codeContainerRef.current) return;
            const pre = codeContainerRef.current.querySelector('pre');
            setActualScrollContainer(pre || codeContainerRef.current);
            actualScrollRef.current = pre || codeContainerRef.current;
        };

        // Delay to ensure DOM is ready before finding scroll container
        const timeoutId = setTimeout(findScrollContainer, SCROLL_CONTAINER_DELAY);
        return () => clearTimeout(timeoutId);
    }, []);

    // Copy code to clipboard
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), COPY_TIMEOUT);
    };

    // Render code block with syntax highlighting and copy button
    return isCodeBlock ? (
        <div className={styles.codeWrapper}>
            <div ref={codeContainerRef} className={styles.codeContainer}>
                <SyntaxHighlighter 
                    style={vscDarkPlus}
                    language={language} 
                    customStyle={{
                        margin: 0,
                        padding: 0,
                        background: 'transparent',
                        overflowX: 'auto',
                    }}
                >
                    {code}
                </SyntaxHighlighter>
                <button className={styles.copyButton} onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            {actualScrollContainer && (
                <Scrollbar direction="horizontal" containerRef={actualScrollRef} />
            )}
        </div>
    ) : <code {...props}>{children}</code>;
};

const createSlug = (text: string) => {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
};

// Custom heading component that generates IDs for anchor links
const HeadingComponent = ({ level, children, ...props }: any) => {
    const text = Children.toArray(children).join('');
    const slug = createSlug(text);
    
    const headingProps = { id: slug, ...props };
    
    const headings = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' };
    const Tag = headings[level as keyof typeof headings] || 'h1';
    return React.createElement(Tag, headingProps, children);
};

const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const scrollPosition = element.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
};

// Update URL hash to include repository name and heading ID
const updateHashWithHeading = (targetId: string) => {
    const repoName = window.location.hash.slice(1).split('/')[0];
    if (repoName) window.history.replaceState(null, '', `#${repoName}/${targetId}`);
};

// Main MarkdownRenderer component
function MarkdownRendererComponent({
    content,
    loading = false,
    error = false,
    githubUrl = '',
    filePath = '',
    welcomeMessage,
}: MarkdownRendererProps) {
    // Transform relative image URLs to absolute GitHub URLs
    const transformImageUrl = (src: string) => {
        if (!filePath || !src || src.startsWith('http') || src.startsWith('/')) return src;
        const basePath = filePath.substring(0, filePath.lastIndexOf('/'));
        return new URL(`${basePath}/${src}`, 'https://raw.githubusercontent.com/ViegPhunt/CTF-WriteUps/main/').href;
    };

    // Show welcome message when no content is loaded
    if (!content && !loading && !error && welcomeMessage) {
        return <div className={styles.welcome}><h2>{welcomeMessage}</h2></div>;
    }

    if (loading) return <div className={styles.loading}>Loading content...</div>;

    // Show error state with link to GitHub
    if (error) {
        return (
            <div className={styles.error}>
                <h1>Failed to Load Content</h1>
                {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer">View on GitHub</a>}
            </div>
        );
    }

    return (
        <div className={styles.markdown}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code: CodeBlock,
                    h1: (props: any) => <HeadingComponent level={1} {...props} />,
                    h2: (props: any) => <HeadingComponent level={2} {...props} />,
                    h3: (props: any) => <HeadingComponent level={3} {...props} />,
                    h4: (props: any) => <HeadingComponent level={4} {...props} />,
                    h5: (props: any) => <HeadingComponent level={5} {...props} />,
                    h6: (props: any) => <HeadingComponent level={6} {...props} />,
                    a: ({ href, children, ...props }) => {
                        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
                        const isVideoLink = href && (
                            href.includes('github.com/user-attachments/assets/') ||
                            videoExtensions.some(ext => 
                                href.toLowerCase().includes(ext) || 
                                (typeof children === 'string' && children.toLowerCase().includes(ext))
                            )
                        );
                        
                        if (isVideoLink) {
                            return (
                                <video src={href} controls>
                                    Your browser does not support the video tag.
                                </video>
                            );
                        }
                        
                        if (href?.startsWith('#')) {
                            const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.preventDefault();
                                const targetId = href.slice(1);
                                updateHashWithHeading(targetId);
                                scrollToElement(targetId);
                            };
                            return <a href={href} onClick={handleAnchorClick} {...props}>{children}</a>;
                        }
                        
                        const isInternalLink = href?.startsWith('/') || (!href?.startsWith('http') && !href?.startsWith('mailto:'));
                        if (isInternalLink) return <a href={href} {...props}>{children}</a>;
                        
                        return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                    },
                    img: ({ src, alt, ...props }) => {
                        const imageUrl = transformImageUrl(typeof src === 'string' ? src : '');
                        if (!imageUrl || imageUrl.trim() === '') return null;

                        return (
                            <img
                                src={imageUrl}
                                alt={alt}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                style={{ maxWidth: '100%', height: 'auto' }}
                                {...props}
                            />
                        );
                    },
                    table: ({ children }) => <table className={styles.table}>{children}</table>,
                    blockquote({ children, ...props }) {
                        const childArray = Children.toArray(children);

                        const firstText = childArray
                            .map((child) => {
                                if (typeof child === 'string') return child.trim();
                                if (React.isValidElement(child)) {
                                    const el = child as React.ReactElement<{ children?: React.ReactNode }>;
                                    const inner = el.props.children;
                                    if (typeof inner === 'string') return inner.trim();
                                    if (Array.isArray(inner))
                                        return inner.map((c) => (typeof c === 'string' ? c.trim() : '')).join(' ');
                                }
                                return '';
                            })
                            .find((txt) => txt.length > 0) || '';

                        const match = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
                        if (!match) return <blockquote className={styles.blockquote} {...props}>{children}</blockquote>;

                        const alertType = match[1].toUpperCase();

                        const cleanedChildren = childArray.map((child) => {
                            if (typeof child === 'string') {
                                return child.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
                            }

                            if (React.isValidElement(child)) {
                                const el = child as React.ReactElement<{ children?: React.ReactNode }>;
                                const inner = el.props.children;
                                let newChildren = inner;

                                if (typeof inner === 'string') {
                                    newChildren = inner.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
                                } else if (Array.isArray(inner)) {
                                    newChildren = inner.map((c: any) =>
                                        typeof c === 'string'
                                            ? c.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '')
                                            : c
                                    );
                                }

                                return React.cloneElement(el, { ...el.props, children: newChildren });
                            }

                            return child;
                        });

                        return (
                            <blockquote
                                className={`${styles.blockquote} ${styles[`blockquote-${alertType.toLowerCase()}`] || ''}`}
                                data-alert-type={alertType}
                                {...props}
                            >
                                <strong className={styles.alertLabel}>{alertType}</strong>{' '}
                                {cleanedChildren.map((child, i) => (
                                    <React.Fragment key={i}>{child}</React.Fragment>
                                ))}
                            </blockquote>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

const MarkdownRenderer = memo(MarkdownRendererComponent);

export default MarkdownRenderer;