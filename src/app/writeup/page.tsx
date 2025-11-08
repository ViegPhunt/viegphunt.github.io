'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatedBox } from '@/components/ChangePage';
import { useMarkdownFetcher } from '@/hooks/useMarkdownFetcher';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { fetchWriteupTree, fetchAllWriteupArticles, TreeNode, WriteupArticle } from '@/lib/github-api';
import { FileText, Folder, FolderOpen, Search, X } from 'lucide-react';
import styles from "@/styles/pages/writeup.module.css";

// Breakpoint for mobile layout
const MOBILE_BREAKPOINT = 1150;

// Portal component for rendering elements outside the DOM hierarchy, used for mobile sidebar overlay
function Portal({ children }: { children: React.ReactNode }) {
    if (typeof window === 'undefined') return null;
    return createPortal(children, document.body);
}

// Recursively find a tree node by its path
const findNodeByPath = (nodes: TreeNode[], targetPath: string): TreeNode | null => {
    for (const node of nodes) {
        if (node.path === targetPath) return node;
        if (node.children) {
            const found = findNodeByPath(node.children, targetPath);
            if (found) return found;
        }
    }
    return null;
};

// Get all parent folder paths that should be expanded for a given path
const getExpandedParents = (path: string): Set<string> => {
    const pathParts = path.split('/');
    const expanded = new Set<string>();
    for (let i = 1; i < pathParts.length; i++) {
        expanded.add(pathParts.slice(0, i).join('/'));
    }
    return expanded;
};

// CTF WriteUp page component
export default function CTFWriteUp() {
    const [selectedReadme, setSelectedReadme] = useState<string | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<TreeNode | null>(null);
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [treeLoading, setTreeLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [allArticles, setAllArticles] = useState<WriteupArticle[]>([]);

    // Monitor header visibility for proper sidebar positioning
    useEffect(() => {
        const waitForHeader = () => {
            const header = document.querySelector('[class*="siteHeader"]');
            if (!header) {
                requestAnimationFrame(waitForHeader);
                return;
            }

            const updateHeaderVisibility = () => {
                const classList = Array.from(header.classList);
                const isHidden = classList.some(c => c.includes('hide'));
                setHeaderVisible(!isHidden);
            };

            updateHeaderVisibility();

            const observer = new MutationObserver(updateHeaderVisibility);
            observer.observe(header, { attributes: true, attributeFilter: ['class'] });

            return () => observer.disconnect();
        };

        waitForHeader();
    }, []);

    // Fetch markdown content for selected README file
    const { content, loading: markdownLoading, error, githubUrl } = useMarkdownFetcher({
        path: selectedReadme, repo: 'ViegPhunt/CTF-WriteUps', autoFetch: selectedReadme !== null
    });

    // Load writeup tree structure on component mount
    useEffect(() => {
        const loadTree = async () => {
            try {
                setTreeLoading(true);
                const [fetchedTree, articles] = await Promise.all([
                    fetchWriteupTree(),
                    fetchAllWriteupArticles()
                ]);
                setTree(fetchedTree);
                setAllArticles(articles);
            } finally {
                setTreeLoading(false);
            }
        };
        loadTree();
    }, []);

    // Handle URL hash navigation to load specific files/folders
    useEffect(() => {
        if (tree.length === 0) return;

        const loadFromHash = () => {
            const hash = window.location.hash.slice(1);
            if (!hash) {
                setSelectedReadme(null);
                setSelectedFolder(null);
                return;
            }

            const decodedHash = decodeURIComponent(hash);
            const node = findNodeByPath(tree, decodedHash);
            if (!node) return;

            const expandedParents = getExpandedParents(node.path);

            // If node has README, display it
            if (node.hasReadme) {
                setSelectedReadme(`${node.path}/README.md`);
                setSelectedFolder(null);
                setExpandedFolders(expandedParents);
            } else if (node.type === 'dir') {
                // Otherwise, show folder contents
                setSelectedFolder(node);
                setSelectedReadme(null);
                expandedParents.add(node.path);
                setExpandedFolders(expandedParents);
            }
        };

        loadFromHash();
        window.addEventListener('popstate', loadFromHash);
        return () => window.removeEventListener('popstate', loadFromHash);
    }, [tree]);

    // Detect mobile screen size
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
        const handleChange = () => setIsMobile(mql.matches);
        
        handleChange();
        
        // Use modern API if available, fallback to deprecated API for older browsers
        if (typeof mql.addEventListener === 'function') {
            mql.addEventListener('change', handleChange);
            return () => mql.removeEventListener('change', handleChange);
        } else {
            mql.addListener(handleChange);
            return () => mql.removeListener(handleChange);
        }
    }, []);

    // Prevent body scrolling when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }, [isMenuOpen]);

    // Close mobile overlay when clicked
    const handleOverlayClick = () => setIsMenuOpen(false);

    // Toggle folder expanded/collapsed state
    const toggleFolder = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            newSet.has(path) ? newSet.delete(path) : newSet.add(path);
            return newSet;
        });
    }, []);

    // Update URL hash with folder/file path
    const updateUrlHash = useCallback((path: string) => {
        window.history.pushState(null, '', `#${encodeURIComponent(path)}`);
    }, []);

    // Close mobile menu if in mobile mode
    const closeMenuIfMobile = useCallback(() => {
        if (isMobile && isMenuOpen) {
            setIsMenuOpen(false);
        }
    }, [isMobile, isMenuOpen]);

    // Handle folder click in tree view
    const handleFolderClick = useCallback((node: TreeNode, shouldToggle: boolean = true) => {
        if (node.hasReadme) {
            // Folder with README - show README
            setSelectedReadme(`${node.path}/README.md`);
            setSelectedFolder(null);
            updateUrlHash(node.path);
        } else {
            // Regular folder - toggle expansion or set as selected
            if (shouldToggle) {
                toggleFolder(node.path);
            } else {
                const expandedParents = getExpandedParents(node.path);
                expandedParents.add(node.path);
                setExpandedFolders(expandedParents);
            }

            setSelectedFolder(node);
            setSelectedReadme(null);
            updateUrlHash(node.path);
            closeMenuIfMobile();
        }
    }, [toggleFolder, updateUrlHash, closeMenuIfMobile]);

    // Handle page (README) click in folder contents view
    const handlePageClick = useCallback((node: TreeNode) => {
        setSelectedReadme(`${node.path}/README.md`);
        setSelectedFolder(null);
        updateUrlHash(node.path);
        closeMenuIfMobile();
    }, [updateUrlHash, closeMenuIfMobile]);

    //  Build breadcrumb navigation from folder path
    const buildBreadcrumbs = useCallback((folder: TreeNode) => {
        const pathParts = folder.path.split('/').filter(p => p);
        const breadcrumbs: { name: string; path: string }[] = [];

        for (let i = 0; i < pathParts.length; i++) {
            const path = pathParts.slice(0, i + 1).join('/');
            breadcrumbs.push({ name: pathParts[i], path });
        }

        return breadcrumbs;
    }, []);

    // Handle breadcrumb click navigation
    const handleBreadcrumbClick = useCallback((path: string) => {
        const node = findNodeByPath(tree, path);
        if (!node) return;

        const expandedParents = getExpandedParents(node.path);
        
        // Expand folder if it's a directory without README
        if (node.type === 'dir' && !node.hasReadme) {
            expandedParents.add(node.path);
        }
        
        setExpandedFolders(expandedParents);

        // Navigate to appropriate view
        if (node.hasReadme) {
            handlePageClick(node);
        } else if (node.type === 'dir') {
            handleFolderClick(node, false);
        }
    }, [tree, handlePageClick, handleFolderClick]);

    // Filter articles and folders based on search query
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return { articles: [], folders: [] };
        
        const query = searchQuery.toLowerCase().trim();
        
        // Search in articles (by title only, not folder name)
        const matchingArticles = allArticles.filter(article => 
            article.title.toLowerCase().includes(query)
        );
        
        // Search in root folders (CTF competitions)
        const matchingFolders: TreeNode[] = [];
        tree.forEach(node => {
            if (node.name.toLowerCase().includes(query)) {
                matchingFolders.push(node);
            }
        });
        
        return { articles: matchingArticles, folders: matchingFolders };
    }, [searchQuery, allArticles, tree]);

    // Handle article click from search results
    const handleArticleClick = useCallback((article: WriteupArticle) => {
        const articleNode: TreeNode = {
            name: article.title,
            path: article.path,
            type: 'dir',
            hasReadme: true,
            children: []
        };
        handlePageClick(articleNode);
    }, [handlePageClick]);
    
    // Handle folder click from search results
    const handleSearchFolderClick = useCallback((folder: TreeNode) => {
        handleFolderClick(folder, false);
    }, [handleFolderClick]);

    // Render search result item
    const renderSearchResultItem = (
        key: string,
        title: string,
        subtitle: string,
        icon: React.ReactNode,
        onClick: () => void
    ) => (
        <div
            key={key}
            className={styles.searchResultItem}
            onClick={onClick}
        >
            {icon}
            <div className={styles.searchResultContent}>
                <div className={styles.searchResultTitle}>{title}</div>
                <div className={styles.searchResultPath}>{subtitle}</div>
            </div>
        </div>
    );

    // Render folder contents with breadcrumbs and child items
    const renderFolderContents = (folder: TreeNode) => {
        const breadcrumbs = buildBreadcrumbs(folder);

        return (
            <div className={styles.folderContents}>
                <div className={styles.breadcrumbs}>
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.path}>
                            {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                            <span
                                className={styles.breadcrumbItem}
                                onClick={() => handleBreadcrumbClick(crumb.path)}
                            >
                                {crumb.name}
                            </span>
                        </span>
                    ))}
                </div>
                <div className={styles.folderItemsList}>
                    {folder.children?.map((child) => {
                        const isPage = child.type === 'dir' && child.hasReadme;
                        const isFolder = child.type === 'dir' && !child.hasReadme;

                        return (
                            <div
                                key={child.path}
                                className={styles.folderItem}
                                onClick={() => {
                                    if (isPage) {
                                        handlePageClick(child);
                                    } else if (isFolder) {
                                        handleFolderClick(child, false);
                                    }
                                }}
                            >
                                <h3 className={styles.folderItemName}>{child.name}</h3>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render a tree node with proper indentation and icons
    const renderNode = (node: TreeNode, level: number = 0) => {
        const isExpanded = expandedFolders.has(node.path);
        const hasChildren = node.children && node.children.length > 0;
        
        const isPage = node.type === 'dir' && node.hasReadme; // Folder with README
        const isFolder = node.type === 'dir' && !node.hasReadme; // Regular folder
        
        return (
            <div key={node.path} className={styles.treeNode} id={node.path}>
                <div 
                    className={`${styles.nodeItem} ${isPage || isFolder ? styles.clickable : ''}`}
                    style={{ paddingLeft: `${level * 20 + 10}px` }}
                    onClick={() => isPage ? handlePageClick(node) : isFolder ? handleFolderClick(node) : undefined}
                >
                    {isFolder && (
                        <span className={styles.folderIcon}>
                            {hasChildren ? (
                                isExpanded ? 
                                <FolderOpen size={20} color="#ede0d4" /> : 
                                <Folder size={20} color="#ede0d4" />
                            ) : (
                                <Folder size={20} color="#ede0d4" />
                            )}
                        </span>
                    )}
                    {isPage && (
                        <FileText size={20} className={styles.pageIcon} color="#89b4fa" />
                    )}
                    <span className={styles.nodeName}>
                        {node.name}
                    </span>
                </div>
                
                {isFolder && isExpanded && hasChildren && (
                    <div className={styles.children}>
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const sidebarInner = treeLoading
        ? <div className={styles.loading}>Loading folder structure...</div>
        : (
        <div className={styles.treeContainer}>
            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <Search size={22} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className={styles.clearButton}
                            aria-label="Clear search"
                        >
                            <X size={22} />
                        </button>
                    )}
                </div>
            </div>
            {searchQuery.trim() && (searchResults.folders.length > 0 || searchResults.articles.length > 0) ? (
                <div className={styles.searchResults}>
                    {searchResults.folders.length > 0 && (
                        <>
                            <div className={styles.searchResultsHeader}>
                                {searchResults.folders.length} competition{searchResults.folders.length !== 1 ? 's' : ''}
                            </div>
                            {searchResults.folders.map(folder => 
                                renderSearchResultItem(
                                    folder.path,
                                    folder.name,
                                    'CTF Competition',
                                    <Folder size={22} className={styles.searchResultIcon} color="#ede0d4" />,
                                    () => handleSearchFolderClick(folder)
                                )
                            )}
                        </>
                    )}
                    {searchResults.articles.length > 0 && (
                        <>
                            <div className={styles.searchResultsHeader}>
                                {searchResults.articles.length} article{searchResults.articles.length !== 1 ? 's' : ''}
                            </div>
                            {searchResults.articles.map(article => 
                                renderSearchResultItem(
                                    article.path,
                                    article.title,
                                    `in ${article.folderName}`,
                                    <FileText size={22} className={styles.searchResultIcon} color="#89b4fa" />,
                                    () => handleArticleClick(article)
                                )
                            )}
                        </>
                    )}
                </div>
            ) : searchQuery.trim() ? (
                <div className={styles.noResults}>No results found</div>
            ) : (
                <div className={styles.treeContent}>{tree.map(n => renderNode(n))}</div>
            )}
        </div>
        );

    return (
        <AnimatedBox>
            <div className={`container ${styles.writeupContainer}`}>
                {isMobile && (
                    <Portal>
                        <div 
                            className={`
                                ${styles.menuButton} 
                                ${headerVisible ? styles.withHeader : styles.noHeader}
                                ${isMenuOpen ? styles.menuButtonHidden : ''}
                            `}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                <path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"/>
                            </svg>
                        </div>

                        <div
                            ref={overlayRef}
                            className={`${styles.overlay} ${isMenuOpen ? styles.active : ''}`}
                            onClick={handleOverlayClick}
                        />

                        <div 
                            className={`
                                ${styles.sidebar}
                                ${isMenuOpen ? styles.sidebarOpen : ''}
                                ${headerVisible ? styles.withHeader : styles.noHeader}
                            `}
                        >
                            {sidebarInner}
                        </div>
                    </Portal>
                )}

                <div className={styles.twoColumnLayout}>
                    {!isMobile && (
                        <aside className={styles.sidebar}>
                            {sidebarInner}
                        </aside>
                    )}
                    
                    <div className={styles.mainContent}>
                        {selectedFolder ? (
                            renderFolderContents(selectedFolder)
                        ) : (
                            <MarkdownRenderer
                                content={content}
                                loading={markdownLoading}
                                error={error}
                                githubUrl={githubUrl}
                                filePath={selectedReadme || ''}
                                welcomeMessage={'CTF WriteUps'}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AnimatedBox>
    );
}