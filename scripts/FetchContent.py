#!/usr/bin/env python3

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import quote



# Get GitHub Token from environment variables
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
HEADERS = {
    "User-Agent": "Portfolio-Builder",
    "Accept": "application/vnd.github.v3+json"
}
# Add Authorization header if token exists
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"token {GITHUB_TOKEN}"

def fetch_url(url: str) -> str:
    """Fetch content from a URL."""
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=30) as response:
            return response.read().decode('utf-8')
    except (HTTPError, URLError) as e:
        print(f"Warning: Failed to fetch {url}. Error: {e}")
        return ""


def clone_writeups():
    """Clone the CTF-WriteUps repository."""
    print("Cloning Writeups")

    writeups_dir = Path("src/content/writeups")
    repo_owner = "ViegPhunt"
    repo_name = "CTF-WriteUps"
    writeups_repo = f"https://github.com/{repo_owner}/{repo_name}.git"

    # Clone writeups repo
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", writeups_repo, str(writeups_dir)],
            check=True,
            capture_output=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Failed to clone writeups: {e}")
        sys.exit(1)
    
    # Remove .git and .github folders to avoid nested git repos
    shutil.rmtree(writeups_dir / ".git", ignore_errors=True)
    shutil.rmtree(writeups_dir / ".github", ignore_errors=True)
    (writeups_dir / "README.md").unlink(missing_ok=True)
    
    # Rename README.md to index.md (Astro convention)
    print("Renaming README.md files to index.md")
    for readme in writeups_dir.rglob("README.md"):
        readme.rename(readme.parent / "index.md")
    
    # Add frontmatter to each CTF writeup
    for index_file in writeups_dir.glob("*/index.md"):
        ctf_folder = index_file.parent.name
        
        # Fetch last commit date for this folder from GitHub API
        encoded_path = quote(ctf_folder)
        api_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/commits?path={encoded_path}&page=1&per_page=1"
        commits_json = fetch_url(api_url)
        
        updated_date = ""
        if commits_json:
            try:
                commits = json.loads(commits_json)
                if commits and len(commits) > 0:
                    updated_date = commits[0]['commit']['committer']['date']
            except (json.JSONDecodeError, KeyError, IndexError):
                pass
        
        # Read existing content
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if banner.png exists
        banner_path = ""
        banner_file = index_file.parent / "images" / "banner.png"
        if banner_file.exists():
            try:
                from PIL import Image
                
                img = Image.open(banner_file)
                if img.width < 950:
                    target_width = 950
                    w_percent = (target_width / float(img.width))
                    h_size = int((float(img.height) * float(w_percent)))
                    
                    img = img.resize((target_width, h_size), Image.Resampling.LANCZOS)
                    img.save(banner_file)
                    print(f" -> Resized banner for {ctf_folder}")
            except ImportError:
                print(" -> Pillow not found, skipping banner resize")
            except Exception as e:
                print(f" -> Failed to resize banner for {ctf_folder}: {e}")

            banner_path = "./images/banner.png"
        
        # Create frontmatter
        frontmatter = f"""---
title: "{ctf_folder}"
description: "My write up for some challenges from {ctf_folder}"
updated: "{updated_date}"
banner: {banner_path if banner_path else '""'}
---

"""
        
        # Write frontmatter + content
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(frontmatter + content)
    
    print("Writeups cloned successfully!")


def fetch_projects():
    """Fetch project READMEs from GitHub."""
    print("Fetching projects")
    
    projects_dir = Path("src/content/projects")
    projects_dir.mkdir(parents=True, exist_ok=True)
    
    # Read projects from data.json
    data_file = Path("data.json")
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    projects = data.get('projects', [])
    
    if not projects:
        return
    
    # Fetch each project
    for project in projects:
        repo = project.get('url', '')
        banner_url = project.get('banner', '')
        slug = repo.split('/')[-1].lower()
        print(f"Processing {slug}...")
        
        # Try to fetch README.md from main branch first, then master
        readme = fetch_url(f"https://raw.githubusercontent.com/{repo}/main/README.md")
        if not readme:
            print(f" -> Skip: No README found for {repo}")
            continue
        
        # Fetch repository metadata from GitHub API
        meta_json = fetch_url(f"https://api.github.com/repos/{repo}")
        if not meta_json:
            continue
        
        meta = json.loads(meta_json)
        
        # Extract metadata
        title = project.get('name', meta.get('name', slug))
        description = meta.get('description') or 'No description'
        url = meta.get('html_url', '')
        updated = meta.get('updated_at', '')
        topics = ', '.join(meta.get('topics', []))
        
        # Download banner image if available
        banner_path = ''
        if banner_url:
            try:
                print(f" -> Downloading banner...")
                req = Request(banner_url, headers={"User-Agent": "Portfolio-Builder"})
                with urlopen(req, timeout=30) as response:
                    banner_data = response.read()
                
                # Create images folder for this project
                images_dir = projects_dir / slug / "images"
                images_dir.mkdir(parents=True, exist_ok=True)
                
                # Save banner image
                banner_file = images_dir / "banner.png"
                with open(banner_file, 'wb') as f:
                    f.write(banner_data)
                
                banner_path = "./images/banner.png"
                print(f" -> Banner saved to {banner_file}")
            except Exception as e:
                print(f" -> Warning: Failed to download banner. Error: {e}")
        
        # Create markdown file with frontmatter
        md_content = f"""---
title: "{title}"
description: "{description}"
url: "{url}"
updated: "{updated}"
topics: "{topics}"
banner: {banner_path if banner_path else '""'}
---

{"\n".join(readme.splitlines()[1:])}
"""
        
        project_folder = projects_dir / slug
        project_folder.mkdir(parents=True, exist_ok=True)
        
        with open(project_folder / "index.md", 'w', encoding='utf-8') as f:
            f.write(md_content)
        
    print("Projects fetched!")


def main():
    """Main function."""
    # Change to script directory
    os.chdir(Path(__file__).parent.parent)
    
    clone_writeups()
    fetch_projects()
    
    print("Content fetched successfully!")


if __name__ == "__main__":
    main()