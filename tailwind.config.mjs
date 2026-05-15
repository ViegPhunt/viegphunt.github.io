/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['Arial', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			
			spacing: {
				header: '80px',
				footer: '130px',
			},

			colors: {
				background: 'var(--color-background)',
				surface: 'var(--color-surface)',
				text: 'var(--color-text)',
				border: 'var(--color-border)',
				link: 'var(--color-link)',
				tag: 'var(--color-tag)',
				shadow: 'var(--color-shadow)',
				blue: 'var(--color-blue)',
				green: 'var(--color-green)',
				yellow: 'var(--color-yellow)',
				purple: 'var(--color-purple)',
				red: 'var(--color-red)',
			},

			/* Centralized typography overrides for @tailwindcss/typography plugin */
			typography: ({ theme }) => ({
				DEFAULT: {
					css: {
						color: 'var(--text-main)',
						a: {
							color: 'var(--color-link)',
							textDecoration: 'underline',
							'&:hover': { color: 'var(--color-link)' },
						},
						h1: { color: 'var(--text-main)', scrollMarginTop: theme('spacing.header') },
						h2: { color: 'var(--text-main)' },
						h3: { color: 'var(--text-main)' },
						blockquote: { color: 'var(--text-muted)', borderLeftColor: 'var(--color-border)' },
						code: { color: 'var(--text-main)', backgroundColor: 'var(--color-tag)' },
						'thead th': { color: 'var(--text-main)' },
						'tbody td': { borderTopColor: 'var(--color-border)' },
					},
				},
				invert: {
					css: {
						color: 'var(--text-main)',
						a: { color: 'var(--color-link)' },
						code: { backgroundColor: 'var(--color-tag)' },
					},
				},
			}),
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}