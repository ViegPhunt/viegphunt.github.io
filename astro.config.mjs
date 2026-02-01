// @ts-check
import { defineConfig } from 'astro/config';
import astroExpressiveCode from 'astro-expressive-code';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkGithubBlockquoteAlert from 'remark-github-blockquote-alert';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
    site: 'https://viegphunt.me',
    integrations: [
        react(), 
        tailwind(),
        sitemap({
            filter: (page) => !page.includes('/404'),
        }),
        astroExpressiveCode({
            themes: ['dark-plus', 'rose-pine-dawn'],
            styleOverrides: {
                borderRadius: '0.5rem',
                codeFontFamily: 'JetBrains Mono, monospace',
                frames: {
                    shadowColor: 'transparent',
                }
            }
        })
    ],
    image: {
        service: {
            entrypoint: 'astro/assets/services/sharp'
        }
    },
    markdown: {
        smartypants: true,
        gfm: true,
        remarkPlugins: [
            remarkGithubBlockquoteAlert,
        ],
        rehypePlugins: [
            rehypeSlug,
            [
                rehypeAutolinkHeadings, {
                    behavior: 'append',
                    properties: {
                        className: ['anchor-link'],
                        ariaHidden: 'true',
                        tabIndex: -1
                    },
                }
            ],
            [
                rehypeExternalLinks, { 
                    target: '_blank',
                    rel: ['noopener', 'noreferrer']
                }
            ]
        ]
    }
});