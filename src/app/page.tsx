'use client'

import { useState } from 'react'
import { AnimatedBox } from '@/components/ChangePage'
import SearchArticles from '@/components/SearchArticles'
import ArticleCards from '@/components/ArticleCards'
import styles from '@/styles/pages/home.module.css'

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <AnimatedBox delay={100}>
            <div className={`container ${styles.homeContainer}`}>
                <div className={styles.pageHeading}>
                    <div className={styles.avatar}>
                        <img src="/avatar.jpg" alt="Avatar" />
                    </div>
                    <div className={styles.pageHeadingContent}>
                        <h1 className={styles.homeTitle}>Welcome to my personal website!</h1>
                        <p className={styles.homeDescription}>
                            A collection of projects, CTF write-ups, and technology notes I've gathered through my learning process.
                        </p>
                    </div>
                </div>

                <div className="divider"></div>

                <AnimatedBox delay={200}>
                    <SearchArticles onSearch={setSearchQuery} />
                </AnimatedBox>

                <AnimatedBox delay={300}>
                    <ArticleCards searchQuery={searchQuery} />
                </AnimatedBox>
            </div>
        </AnimatedBox>
    )
}