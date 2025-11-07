'use client';

import { useState } from 'react';
import styles from '@/styles/components/SearchArticles.module.css';
import { Search, X } from 'lucide-react';

type SearchArticlesProps = {
    onSearch: (query: string) => void;
};

export default function SearchArticles({ onSearch }: SearchArticlesProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchQuery);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setSearchQuery('');
        onSearch('');
    };

    return (
        <div className={styles.searchSection}>
            <div className={styles.searchHeader}>
                <div className={styles.searchTitle}>Search Articles</div>
            </div>
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                    <Search size={22} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by title, description or tags..."
                        value={searchQuery}
                        onChange={handleInputChange}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className={styles.clearButton}
                            aria-label="Clear search"
                        >
                            <X size={22} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}