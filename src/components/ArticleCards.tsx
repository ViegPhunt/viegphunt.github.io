'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GitHubRepo, WriteupDir, WriteupArticle, fetchAllRepositories, fetchAllWriteups, fetchAllWriteupArticles } from '@/lib/github-api';
import styles from '@/styles/components/ArticleCards.module.css';

type ArticleItem = {
    title: string;
    description: string;
    tags: string[];
    link: string;
};

type ArticleSection = {
    title: string;
    category: string;
    items: ArticleItem[];
    displayRows?: number;
};

type ArticleCardsProps = {
    searchQuery?: string;
};

// Skeleton loader component
function CardSkeleton() {
    return (
        <div className={`${styles.card} ${styles.skeleton}`}>
            <div className={styles.skeletonTags}>
                <div className={styles.skeletonTag}></div>
                <div className={styles.skeletonTag}></div>
            </div>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonDescription}></div>
            <div className={styles.skeletonDescription}></div>
        </div>
    );
}

export default function ArticleCards({ searchQuery = '' }: ArticleCardsProps) {
    const [sections, setSections] = useState<ArticleSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [allWriteupArticles, setAllWriteupArticles] = useState<WriteupArticle[]>([]);

    useEffect(() => {
        const loadArticles = async () => {
            try {
                setLoading(true);
                const [projects, writeups, articles] = await Promise.all([
                    fetchAllRepositories(),
                    fetchAllWriteups(),
                    fetchAllWriteupArticles()
                ]);

                setAllWriteupArticles(articles);
                const articleSections: ArticleSection[] = [];

                // Add Projects section first (using GitHub topics as tags)
                if (projects.length > 0) {
                    articleSections.push({
                        title: 'Projects',
                        category: 'Projects',
                        items: projects.map((project: GitHubRepo) => ({
                            title: project.name,
                            description: project.description || '...',
                            tags: project.topics?.length > 0 ? project.topics : ['project'],
                            link: `/projects#${encodeURIComponent(project.name)}`
                        })),
                        displayRows: 1
                    });
                }

                // Add Write Up section (single tag for all writeups)
                if (writeups.length > 0) {
                    articleSections.push({
                        title: 'Write Up',
                        category: 'WriteUp',
                        items: writeups.map((writeup: WriteupDir) => ({
                            title: writeup.name,
                            description: writeup.lastCommitDate 
                                ? `Last updated: ${writeup.lastCommitDate}` 
                                : 'CTF write-up',
                            tags: ['Write Up'],
                            link: `/writeup#${encodeURIComponent(writeup.path)}`
                        })),
                        displayRows: 2
                    });
                }

                setSections(articleSections);
            } finally {
                setLoading(false);
            }
        };

        loadArticles();
    }, []);

    // Filter articles based on search query
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) {
            return sections.map(section => {
                const displayCount = (section.displayRows || 1) * 3;
                return {
                    ...section, 
                    items: section.items.slice(0, displayCount)
                };
            });
        }

        const query = searchQuery.toLowerCase().trim();
        
        // Filter existing sections (Projects and WriteUp folders)
        const filteredExistingSections = sections
            .map(section => ({
                ...section,
                items: section.items.filter(item =>
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.tags.some(tag => tag.toLowerCase().includes(query))
                )
            }))
            .filter(section => section.items.length > 0);

        // Search individual writeup articles
        const matchingArticles = allWriteupArticles.filter(article =>
            article.title.toLowerCase().includes(query)
        );

        // If there are matching articles, add them as a separate section after Write Up folders
        if (matchingArticles.length > 0) {
            const articlesSection: ArticleSection = {
                title: 'Write Up Articles',
                category: 'WriteUpArticles',
                items: matchingArticles.map(article => ({
                    title: article.title,
                    description: `in ${article.folderName}`,
                    tags: ['Write Up'],
                    link: `/writeup#${encodeURIComponent(article.path)}`
                }))
            };

            // Add articles section after WriteUp folders section (if it exists)
            const writeUpIndex = filteredExistingSections.findIndex(s => s.category === 'WriteUp');
            if (writeUpIndex !== -1) {
                // Insert after Write Up folders
                filteredExistingSections.splice(writeUpIndex + 1, 0, articlesSection);
            } else {
                // No Write Up folders found, just add articles section at the end
                filteredExistingSections.push(articlesSection);
            }
        }

        return filteredExistingSections;
    }, [searchQuery, sections, allWriteupArticles]);

    if (loading) {
        return (
            <div className={styles.articlesContainer}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={`${styles.sectionTitle} ${styles.skeleton} ${styles.skeletonSectionTitle}`}></div>
                    </div>
                    <div className={styles.cardsGrid}>
                        {[...Array(3)].map((_, idx) => (
                            <CardSkeleton key={idx} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (searchQuery.trim() && filteredSections.length === 0) {
        return (
            <div className={styles.articlesContainer}>
                <div className={styles.noResults}>
                    No articles found for "{searchQuery}"
                </div>
            </div>
        )
    }

    return (
        <div className={styles.articlesContainer}>
            {filteredSections.map((section, sectionIdx) => (
                <div key={sectionIdx} className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {section.title}
                            {searchQuery.trim() && (
                                <span className={styles.resultCount}>
                                    ({section.items.length} result{section.items.length !== 1 ? 's' : ''})
                                </span>
                            )}
                        </h2>
                        {!searchQuery.trim() && (
                            <Link 
                                href={section.category === 'WriteUp' ? '/writeup' : '/projects'} 
                                className={styles.viewAllButton}
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    <div className={styles.cardsGrid}>
                        {section.items.map((item, itemIdx) => (
                            <Link 
                                key={itemIdx} 
                                href={item.link}
                                className={styles.card}
                            >
                                <div className={styles.cardTags}>
                                    {item.tags.slice(0, 3).map((tag, tagIdx) => (
                                        <span key={tagIdx} className={styles.cardTag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h3 className={styles.cardTitle}>{item.title}</h3>
                                <p className={styles.cardDescription}>{item.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
