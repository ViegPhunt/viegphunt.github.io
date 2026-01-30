# viegphunt.github.io

**Personal site / projects / write-ups** built with Astro.

---

## Project Structure
```
public/				# Static public assets
scripts/			# Custom scripts
src/
	assets/				# Static assets
	components/			# Reusable UI components
	content/			# Content collections (Markdown/MDX)
	hooks/				# Custom hooks
	layouts/			# Page layouts
	pages/				# App routes
		projects/			# Projects page
		writeups/			# Write-ups page
		about.astro			# About page
		index.astro			# Home page
	styles/				# Global styles
data.json			# Data source
```

## Scripts
```bash
npm install			# Install dependencies
npm run dev			# Start dev server (http://localhost:4321)
npm run build		# Production build
```

## Deployment (GitHub Pages)
- This repository uses a GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Ensure in repository Settings → Pages → Source = GitHub Actions.

## Adding Content
### Add SEO, Projects, Achievements, Contacts
Edit `data.json` and follow existing object structure.