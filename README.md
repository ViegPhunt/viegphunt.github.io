# viegphunt.github.io

**Personal site / projects / write-ups** built with Next.js + static export for GitHub Pages.

---

## 📁 Project Structure
```
src/
	app/
		layout.tsx        # Root layout
		page.tsx          # Home page
		about/            # About page
		projects/         # Projects listing
		writeup/          # Write-ups (Markdown based)
	components/         # Reusable UI pieces
	hooks/              # Custom React hooks
	lib/                # Utility modules (e.g. GitHub API, static loader)
	styles/             # Global + modular styles
public/               # Static assets (favicons, images)
projects.json         # Projects data source
```

## 🚀 Scripts
```bash
npm install			# Install dependencies
npm run dev			# Start dev server (http://localhost:3000)
npm run build		# Production build (generates .next)
```

## 📤 Deployment (GitHub Pages)
- This repository uses a GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Ensure in repository Settings → Pages → Source = GitHub Actions.

## ✍ Adding Content
### Add a Project
Edit `projects.json` and follow existing object structure.

### Add a Write-up
Extend the page in `app/writeup/page.tsx` to map local files or remote sources.
