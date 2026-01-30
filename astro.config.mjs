// @ts-check
import { defineConfig } from 'astro/config';
import astroExpressiveCode from 'astro-expressive-code';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkGfm from 'remark-gfm';
import remarkGithubBlockquoteAlert from 'remark-github-blockquote-alert';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
    site: 'https://viegphunt.github.io',
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
        remarkPlugins: [
            remarkGfm,
            remarkGithubBlockquoteAlert,
        ],
        rehypePlugins: [
            [
                rehypeExternalLinks, { 
                    target: '_blank',
                    rel: ['noopener', 'noreferrer']
                }
            ]
        ]
    }
});