import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const sitemapIndexPath = path.join(distDir, 'sitemap-index.xml');
const sitemap0Path = path.join(distDir, 'sitemap-0.xml');
const sitemapPath = path.join(distDir, 'sitemap.xml');

try {
    // Rename sitemap-0.xml to sitemap.xml
    if (fs.existsSync(sitemap0Path)) {
        fs.renameSync(sitemap0Path, sitemapPath);
        console.log('✓ Renamed sitemap-0.xml to sitemap.xml');
    } else {
        console.warn('⚠ sitemap-0.xml not found, skipping rename');
    }

    // Delete sitemap-index.xml
    if (fs.existsSync(sitemapIndexPath)) {
        fs.unlinkSync(sitemapIndexPath);
        console.log('✓ Deleted sitemap-index.xml');
    } else {
        console.warn('⚠ sitemap-index.xml not found, skipping deletion');
    }

    console.log('✓ Sitemap processing completed successfully');
} catch (error) {
    console.error('✗ Error processing sitemap:', error.message);
    process.exit(1);
}