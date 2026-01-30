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
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}