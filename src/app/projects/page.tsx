'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatedBox } from '@/components/ChangePage';
import { GitHubRepo, formatDate, fetchAllRepositories } from '@/lib/github-api';
import { useMarkdownFetcher } from '@/hooks/useMarkdownFetcher';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from "@/styles/pages/projects.module.css";

const SCROLL_OFFSET = 60;
const REPO_SCROLL_DELAY = 300;
const HEADING_SCROLL_DELAY = 500;

// Displays list of GitHub repositories with README previews
export default function Projects() {
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    // Construct README URL for selected repository
    const readmeUrl = selectedRepo
        ? `https://raw.githubusercontent.com/${selectedRepo}/main/README.md`
        : null;

    // Fetch markdown content for selected repository
    const { content, loading: markdownLoading, error: markdownError, githubUrl } = useMarkdownFetcher({
        url: readmeUrl || undefined
    });

    // Scroll to an element with a smooth animation and offset for fixed header
    const scrollToElement = useCallback((elementId: string, delay: number = 100) => {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element) {
                const scrollPosition = element.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
                window.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
            }
        }, delay);
    }, []);

    // Load repositories on component mount
    useEffect(() => {
        let mounted = true;

        const loadRepos = async () => {
            try {
                setLoading(true);
                setError(null);
                const repositories = await fetchAllRepositories();
                if (mounted) setRepos(repositories);
            } catch (err: any) {
                if (mounted) setError(err.message || 'Failed to load projects');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadRepos();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (repos.length === 0) return;

        const loadFromHash = () => {
            const hash = window.location.hash.slice(1);
            if (!hash) {
                setSelectedRepo(null);
                return;
            }

            const [repoName, headingId] = decodeURIComponent(hash).split('/');
            const repo = repos.find(r => r.name === repoName);
            if (!repo) return;

            setSelectedRepo(repo.full_name);
            
            if (headingId) {
                setTimeout(() => {
                    const element = document.getElementById(headingId);
                    if (element) {
                        scrollToElement(headingId, 0);
                    } else {
                        scrollToElement(repoName, 0);
                    }
                }, HEADING_SCROLL_DELAY);
            } else {
                scrollToElement(repoName, REPO_SCROLL_DELAY);
            }
        };

        loadFromHash();

        window.addEventListener('popstate', loadFromHash);
        return () => window.removeEventListener('popstate', loadFromHash);
    }, [repos, scrollToElement]);

    const handleProjectClick = useCallback((repoFullName: string, repoName: string) => {
        if (selectedRepo === repoFullName) {
            setSelectedRepo(null);
            window.history.pushState(null, '', window.location.pathname);
        } else {
            setSelectedRepo(repoFullName);
            window.history.pushState(null, '', `#${encodeURIComponent(repoName)}`);
            scrollToElement(repoName);
        }
    }, [selectedRepo, scrollToElement]);

    const renderProjects = () => {
        if (error || (repos.length === 0 && !loading)) {
            return <div className='error'>Failed to load projects. Please try again later.</div>;
        }

        return (
            <AnimatedBox trigger={!loading && repos.length > 0}>
                <div className={styles.projectsList}>
                    {repos.map((repo) => {
                        const isSelected = selectedRepo === repo.full_name;

                        return (
                            <div key={repo.full_name} className={styles.projectWrapper} id={repo.name}>
                                <div
                                    className={`${styles.projectItem} ${isSelected ? styles.projectItemActive : ''}`}
                                >
                                    <div className={styles.projectHeader}>
                                        <div className={styles.projectTitleAndStar}>
                                            <div className={styles.projectTitle}>
                                                {repo.name}
                                            </div>
                                            <span className={styles.projectStarCount}>⭐ {repo.stargazers_count}</span>
                                        </div>
                                        <span className={styles.projectUpdatedAt}>Updated: {formatDate(repo.updated_at)}</span>
                                    </div>
                                    <p className={styles.projectBody}>
                                        {repo.description || '...'}
                                    </p>
                                    <div className={styles.tagList}>
                                        {repo.topics?.slice(0, 3).map((topic) => (
                                            <span key={topic} className={styles.tagItem}>
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                    <div className={styles.buttonGroup}>
                                        <button
                                            className={styles.button}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProjectClick(repo.full_name, repo.name);
                                            }}
                                        >
                                            {isSelected ? 'Collapse' : 'View'}
                                        </button>
                                        <a
                                            href={`https://github.com/${repo.full_name}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.button}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            GitHub
                                        </a>
                                    </div>

                                    {isSelected && (
                                        <div className={styles.readmeContainer}>
                                            <MarkdownRenderer
                                                content={content}
                                                loading={markdownLoading}
                                                error={markdownError}
                                                githubUrl={githubUrl}
                                                filePath={'README.md'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </AnimatedBox>
        );
    };

    return (
        <AnimatedBox>
            <div className={`container ${styles.projectContainer}`}>
                { loading && <p className='loading'>Loading...</p> }

                { renderProjects() }
            </div>
        </AnimatedBox>
    );
}