import { useState, useEffect, useCallback } from 'react';

interface UseMarkdownFetcherOptions {
    url?: string | null;
    path?: string | null;
    repo?: string;
    autoFetch?: boolean;
}

interface UseMarkdownFetcherResult {
    content: string;
    loading: boolean;
    error: boolean;
    githubUrl: string;
    refetch: () => void;
}

const DEFAULT_REPO = 'ViegPhunt/CTF-WriteUps';
const BASE_RAW_URL = 'https://raw.githubusercontent.com';
const BASE_WEB_URL = 'https://github.com';
const BASE_API_URL = 'https://api.github.com/repos';

export function useMarkdownFetcher(options: UseMarkdownFetcherOptions): UseMarkdownFetcherResult {
    const { url, path, repo = DEFAULT_REPO, autoFetch = true } = options;

    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [githubUrl, setGithubUrl] = useState<string>('');

    const convertToRawUrl = useCallback((inputUrl: string): string => {
        if (inputUrl.includes(BASE_RAW_URL)) return inputUrl;
        const webMatch = inputUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
        if (webMatch) {
            const [, owner, repoName, branch, filePath] = webMatch;
            return `${BASE_RAW_URL}/${owner}/${repoName}/${branch}/${filePath}`;
        }

        return inputUrl;
    }, []);

    const generateWebUrl = useCallback((repoName: string, filePath: string): string => {
        return `${BASE_WEB_URL}/${repoName}/blob/main/${filePath}`;
    }, []);

    const fetchContent = useCallback(async () => {
        if (!url && (!path || !path.trim())) {
            setError(true);
            return;
        }

        let apiUrl = '';
        let webUrl = '';

        try {
            if (url) {
                const rawUrl = convertToRawUrl(url);
                if (url.includes('/blob/')) {
                    webUrl = url;
                    const blobMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
                    if (blobMatch) {
                        const [, owner, repoName, branch, filePath] = blobMatch;
                        apiUrl = `${BASE_API_URL}/${owner}/${repoName}/contents/${filePath}?ref=${branch}`;
                    }
                } else if (rawUrl.includes(BASE_RAW_URL)) {
                    const rawMatch = rawUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
                    if (rawMatch) {
                        const [, owner, repoName, branch, filePath] = rawMatch;
                        webUrl = generateWebUrl(`${owner}/${repoName}`, filePath);
                        apiUrl = `${BASE_API_URL}/${owner}/${repoName}/contents/${filePath}?ref=${branch}`;
                    }
                }
            } else if (path) {
                const [owner, repoName] = repo.split('/');
                webUrl = generateWebUrl(repo, path);
                apiUrl = `${BASE_API_URL}/${owner}/${repoName}/contents/${path}?ref=main`;
            }

            if (!apiUrl) {
                throw new Error('Unable to generate API URL');
            }

            setLoading(true);
            setError(false);
            setGithubUrl(webUrl);

            const headers: Record<string, string> = {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'ViegPhunt'
            };

            const response = await fetch(apiUrl, { headers });

            if (!response.ok) {
                throw new Error(`GitHub Error: ${response.statusText} (${response.status})`);
            }

            const data = await response.json();
            
            if (data.content) {
                const binaryString = atob(data.content.replace(/\s/g, ''));
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                setContent(new TextDecoder('utf-8').decode(bytes));
            } else {
                throw new Error('No content found');
            }
        } catch {
            setError(true);
            setContent('');
        } finally {
            setLoading(false);
        }
    }, [url, path, repo, convertToRawUrl, generateWebUrl]);

    const resetState = useCallback(() => {
        setContent('');
        setError(false);
        setLoading(false);
        setGithubUrl('');
    }, []);

    useEffect(() => {
        if (autoFetch && (url || (path?.trim()))) {
            fetchContent();
        } else if (autoFetch) {
            resetState();
        }
    }, [autoFetch, fetchContent, resetState, url, path]);

    return {
        content,
        loading,
        error,
        githubUrl,
        refetch: fetchContent
    };
}
