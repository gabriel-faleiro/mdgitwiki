const express = require('express');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const config = require('./config.json');

const app = express();
const REPO_DIR = path.join(__dirname, 'content_repo');
const git = simpleGit();

// --- 1. Build Git URL with credentials (for private repos) ---
function getAuthenticatedRepoUrl() {
    if (config.username && config.password) {
        const url = new URL(config.repoUrl);
        url.username = encodeURIComponent(config.username);
        url.password = encodeURIComponent(config.password);
        return url.toString();
    }
    return config.repoUrl;
}

// --- 2. Git Automation ---
async function initRepo() {
    const repoUrl = getAuthenticatedRepoUrl();
    if (!fs.existsSync(REPO_DIR)) {
        console.log('Cloning repository...');
        await git.clone(repoUrl, REPO_DIR);
    } else {
        console.log('Repository exists. Pulling latest...');
        await simpleGit(REPO_DIR).pull();
    }
}

// --- 3. Auto-update timer ---
if (config.updateIntervalMinutes > 0) {
    setInterval(async () => {
        try {
            console.log('Auto-updating repository...');
            await simpleGit(REPO_DIR).pull();
        } catch (e) { console.error('Update failed:', e.message); }
    }, config.updateIntervalMinutes * 60 * 1000);
}

// --- 4. Helper: Parse Frontmatter YAML ---
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { metadata: {}, content };
    }
    
    const metadata = {};
    const yamlContent = match[1];
    
    yamlContent.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            metadata[key] = value;
        }
    });
    
    return {
        metadata,
        content: content.replace(frontmatterRegex, '')
    };
}

// --- 6. Helper: Generate Sidebar HTML (Recursive) ---
function getMenuHtml(dir, baseDir) {
    let html = '<ul class="tree">';
    const items = fs.readdirSync(dir, { withFileTypes: true });

    // Sort: Folders first, then files
    items.sort((a, b) => (a.isDirectory() === b.isDirectory() ? 0 : a.isDirectory() ? -1 : 1));

    items.forEach(item => {
        const fullPath = path.join(dir, item.name);
        const relPath = path.relative(baseDir, fullPath);
        
        // Skip .git folder
        if (item.name.startsWith('.')) return;

        if (item.isDirectory()) {
            html += `<li>
                <details open>
                    <summary>${item.name}</summary>
                    ${getMenuHtml(fullPath, baseDir)}
                </details>
            </li>`;
        } else if (item.name.endsWith('.md')) {
            // Read file to get menu_option from frontmatter
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            const { metadata } = parseFrontmatter(fileContent);
            const displayName = metadata.menu_option || item.name.replace('.md', '');
            html += `<li><a href="/?file=${encodeURIComponent(relPath)}">📄 ${displayName}</a></li>`;
        }
    });
    html += '</ul>';
    return html;
}

// --- 7. Main Route ---
app.get('/', (req, res) => {
    const requestFile = req.query.file;
    let mainContent = '<h1>Select a file from the menu</h1>';

    // Read and Parse Markdown file if requested
    if (requestFile) {
        const safePath = path.join(REPO_DIR, requestFile);
        // Security check to prevent reading outside repo
        if (safePath.startsWith(REPO_DIR) && fs.existsSync(safePath)) {
            const fileContent = fs.readFileSync(safePath, 'utf-8');
            const { content } = parseFrontmatter(fileContent);
            mainContent = marked.parse(content);
        } else {
            mainContent = '<h1>File not found</h1>';
        }
    }

    // Generate Menu
    const menuHtml = fs.existsSync(REPO_DIR) ? getMenuHtml(REPO_DIR, REPO_DIR) : '<p>Repository not ready.</p>';

    // Return Full HTML Page
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Docs Reader</title>
        <style>
            body { font-family: sans-serif; margin: 0; display: flex; height: 100vh; background: #f4f4f4; }
            nav { width: 300px; background: #333; color: #fff; overflow-y: auto; padding: 20px; flex-shrink: 0; }
            main { flex-grow: 1; padding: 40px; overflow-y: auto; background: white; }
            
            /* Sidebar Styles */
            ul.tree, ul.tree ul { list-style: none; padding-left: 15px; }
            ul.tree li { margin: 5px 0; }
            a { color: #ddd; text-decoration: none; display: block; padding: 2px 0; }
            a:hover { color: #fff; text-decoration: underline; }
            summary { cursor: pointer; font-weight: bold; margin-bottom: 5px; outline: none; }
            
            /* Markdown Content Styles */
            main img { max-width: 100%; }
            main pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
            main blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #666; }
        </style>
    </head>
    <body>
        <nav>
            <h3>📚 Documentation</h3>
            ${menuHtml}
        </nav>
        <main>
            ${mainContent}
        </main>
    </body>
    </html>
    `);
});

// --- Start Server ---
initRepo().then(() => {
    app.listen(config.port, () => {
        console.log(`Server running at http://localhost:${config.port}`);
    });
}).catch(err => console.error("Failed to start:", err));