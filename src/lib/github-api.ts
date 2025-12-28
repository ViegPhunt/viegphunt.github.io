import dataConfig from "../../data.json";
import { CacheManager } from "./cache";

export type GitHubRepo = {
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    topics: string[];
    stargazers_count: number;
    updated_at: string;
};

export type WriteupDir = {
    name: string;
    path: string;
    html_url: string;
    lastCommitDate?: string;
};

export type WriteupArticle = {
    title: string;
    path: string;
    folderName: string;
    lastCommitDate?: string;
};

export type TreeNode = {
    name: string;
    path: string;
    type: 'file' | 'dir';
    children?: TreeNode[];
    hasReadme?: boolean;
};

const WRITEUPS_OWNER = 'ViegPhunt';
const WRITEUPS_REPO = 'CTF-WriteUps';
const BASE_API_URL = 'https://api.github.com';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const createHeaders = (): Record<string, string> => {
    return {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'ViegPhunt'
    };
};

const handleApiResponse = async (response: Response) => {
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    return await response.json();
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day} - ${month} - ${year}`;
};

async function fetchRepository(repoName: string): Promise<GitHubRepo | null> {
    const cacheKey = `repo_${repoName}`;
    const cached = CacheManager.get<GitHubRepo>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${BASE_API_URL}/repos/${repoName}`, { headers: createHeaders() });
        const data = await handleApiResponse(response);
        CacheManager.set(cacheKey, data, CACHE_DURATION);
        return data;
    } catch {
        return null;
    }
}

export async function fetchAllRepositories(): Promise<GitHubRepo[]> {
    return CacheManager.getOrFetch('all_repositories', async () => {
        const results = await Promise.all(dataConfig.projects.map(fetchRepository));
        return results.filter((repo): repo is GitHubRepo => repo !== null);
    }, CACHE_DURATION);
}

async function fetchCommitDate(path: string): Promise<string | null> {
    return CacheManager.getOrFetch(`commit_${path}`, async () => {
        try {
            const url = `${BASE_API_URL}/repos/${WRITEUPS_OWNER}/${WRITEUPS_REPO}/commits?path=${encodeURIComponent(path)}&per_page=1`;
            const response = await fetch(url, { headers: createHeaders() });
            const commits = await handleApiResponse(response);
            return commits?.length > 0 ? formatDate(commits[0].commit.committer.date) : null;
        } catch {
            return null;
        }
    }, CACHE_DURATION);
}

function sortDirsByDate(dirs: WriteupDir[]): WriteupDir[] {
    return dirs.sort((a, b) => {
        if (!a.lastCommitDate && !b.lastCommitDate) return 0;
        if (!a.lastCommitDate) return 1;
        if (!b.lastCommitDate) return -1;

        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split(' - ').map(Number);
            return new Date(year, month - 1, day);
        };

        return parseDate(b.lastCommitDate).getTime() - parseDate(a.lastCommitDate).getTime();
    });
}

export async function fetchAllWriteups(): Promise<WriteupDir[]> {
    return CacheManager.getOrFetch('all_writeups', async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/repos/${WRITEUPS_OWNER}/${WRITEUPS_REPO}/contents`, {
                headers: createHeaders()
            });
            const items = await handleApiResponse(response);
            if (!items) return [];

            const dirs = items.filter((item: any) => item.type === 'dir');
            const dirsWithDates = await Promise.all(
                dirs.map(async (dir: any) => ({
                    name: dir.name,
                    path: dir.path,
                    html_url: dir.html_url,
                    lastCommitDate: await fetchCommitDate(dir.path)
                }))
            );
            return sortDirsByDate(dirsWithDates);
        } catch {
            return [];
        }
    }, CACHE_DURATION);
}

export async function fetchWriteupTree(): Promise<TreeNode[]> {
    return CacheManager.getOrFetch('writeup_tree', async () => {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(
                    `${BASE_API_URL}/repos/${WRITEUPS_OWNER}/${WRITEUPS_REPO}/git/trees/main?recursive=1`,
                    { headers: createHeaders(), signal: controller.signal }
                );
                clearTimeout(timeoutId);

                const data = await handleApiResponse(response);
                if (!data?.tree) throw new Error('Invalid response');
                return buildTreeStructure(data.tree);
            } catch {
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
            }
        }
        return [];
    }, CACHE_DURATION);
}

function buildTreeStructure(treeData: any[]): TreeNode[] {
    const rootNodes: TreeNode[] = [];
    const pathMap = new Map<string, TreeNode>();

    treeData.forEach((item: any) => {
        const parts = item.path.split('/');
        const node: TreeNode = {
            name: parts[parts.length - 1],
            path: item.path,
            type: item.type === 'tree' ? 'dir' : 'file',
            children: item.type === 'tree' ? [] : undefined
        };
        pathMap.set(item.path, node);
    });

    treeData.forEach((item: any) => {
        const parts = item.path.split('/');
        const node = pathMap.get(item.path);
        
        if (!node) return;
        
        if (parts.length === 1) {
            if (node.type === 'dir') {
                rootNodes.push(node);
            }
        } else {
            const parentPath = parts.slice(0, -1).join('/');
            const parent = pathMap.get(parentPath);
            
            if (parent?.children) {
                parent.children.push(node);
                
                if (node.type === 'file' && node.name.toLowerCase() === 'readme.md') {
                    parent.hasReadme = true;
                }
            }
        }
    });

    return rootNodes;
}
export async function fetchAllWriteupArticles(): Promise<WriteupArticle[]> {
    return CacheManager.getOrFetch('all_writeup_articles', async () => {
        const tree = await fetchWriteupTree();
        const articles: WriteupArticle[] = [];

        function extractArticles(nodes: TreeNode[], rootFolderName: string = '') {
            nodes.forEach(node => {
                if (node.type === 'dir' && node.hasReadme && node.children) {
                    const readme = node.children.find(
                        child => child.type === 'file' && child.name.toLowerCase() === 'readme.md'
                    );
                    
                    if (readme) {
                        const title = node.name.replace(/^\d+[\s.-]+/, '');
                        // Get root folder name (first part of path)
                        const pathParts = node.path.split('/');
                        const rootFolder = pathParts[0];
                        
                        articles.push({
                            title,
                            path: node.path,
                            folderName: rootFolder
                        });
                    }
                }
                
                if (node.type === 'dir' && node.children) {
                    // Pass down the root folder name, or set it if we're at root level
                    const nextRootName = rootFolderName || node.name;
                    extractArticles(node.children, nextRootName);
                }
            });
        }

        extractArticles(tree);
        return articles;
    }, CACHE_DURATION);
}
