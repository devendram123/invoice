const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const INVOICE_DIR = path.join(__dirname, 'invoices');
const DIST_DIR = path.join(__dirname, 'dist');

// Ensure invoices directory exists
if (!fs.existsSync(INVOICE_DIR)) {
    fs.mkdirSync(INVOICE_DIR);
}

// Serve invoices files directly
app.use('/invoices', express.static(INVOICE_DIR));

// Serve built frontend if dist exists, otherwise serve root
if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
} else {
    app.use(express.static(__dirname));
}

// Serve public directory for static assets
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR));
}

function getChromeExecutablePath() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
}

app.post('/save-invoice', async (req, res) => {
    const { html, filename, metadata } = req.body;

    if (!html || !filename) {
        return res.status(400).send('HTML and filename are required');
    }

    try {
        // Save metadata alongside PDF
        if (metadata) {
            const jsonFilename = filename.replace('.pdf', '.json');
            const jsonPath = path.join(INVOICE_DIR, jsonFilename);
            fs.writeFileSync(jsonPath, JSON.stringify({ ...metadata, html }, null, 2));
        }

        const execPath = getChromeExecutablePath();
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        };
        if (execPath) {
            launchOptions.executablePath = execPath;
        }

        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Emulate print media so that @media print rules apply with exact A4 physical boundaries
        await page.emulateMediaType('print');

        // Embed logo as base64 data URI if available for guaranteed offline rendering
        let processedHtml = html;
        const logoPath = path.join(__dirname, 'public', 'smart_logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            const logoDataUri = `data:image/png;base64,${logoBase64}`;
            processedHtml = processedHtml.replace(/src=["']\/?smart_logo\.png["']/g, `src="${logoDataUri}"`);
        }

        // Read CSS
        const cssPath = path.join(__dirname, 'src', 'style.css');
        const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

        // Ensure proper outer hierarchy matching preview
        const wrappedHtml = processedHtml.includes('invoice-page')
            ? processedHtml
            : `<div class="invoice-page">${processedHtml}</div>`;
        const fullContent = wrappedHtml.includes('invoice-document')
            ? wrappedHtml
            : `<div class="invoice-document">${wrappedHtml}</div>`;

        const fullHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>${cssContent}</style>
            </head>
            <body>
                <div class="invoice-preview">
                    ${fullContent}
                </div>
            </body>
            </html>
        `;

        await page.setContent(fullHTML, {
            waitUntil: 'networkidle0'
        });

        const filePath = path.join(INVOICE_DIR, filename);
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '8mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();
        console.log(`Invoice saved: ${filename}`);
        res.send({ success: true, message: 'Invoice saved successfully', path: filePath });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF: ' + error.message);
    }
});

app.get('/api/invoices', (req, res) => {
    try {
        const files = fs.readdirSync(INVOICE_DIR);
        const invoices = files.filter(file => file.endsWith('.pdf')).map(file => {
            const stats = fs.statSync(path.join(INVOICE_DIR, file));
            const jsonFilename = file.replace('.pdf', '.json');
            const jsonPath = path.join(INVOICE_DIR, jsonFilename);
            let metadata = {};

            if (fs.existsSync(jsonPath)) {
                try {
                    metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                } catch (e) {
                    console.error(`Error reading metadata for ${file}:`, e);
                }
            }

            return {
                filename: file,
                createdAt: stats.birthtime,
                url: `/invoices/${file}`,
                metadata: metadata // Contains amount, buyerName, date, html
            };
        });
        res.json(invoices);
    } catch (err) {
        res.status(500).send('Error reading directory: ' + err.message);
    }
});

app.delete('/api/invoices/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(INVOICE_DIR, filename);
    const jsonPath = filePath.replace('.pdf', '.json');

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);

    console.log(`Invoice and metadata deleted: ${filename}`);
    res.send({ success: true, message: 'Invoice and metadata deleted successfully' });
});

app.delete('/api/invoices', (req, res) => {
    try {
        const files = fs.readdirSync(INVOICE_DIR);
        files.forEach(file => {
            if (file.endsWith('.pdf') || file.endsWith('.json')) {
                fs.unlinkSync(path.join(INVOICE_DIR, file));
            }
        });
        console.log('All invoices and metadata deleted from server');
        res.send({ success: true, message: 'All history cleared successfully' });
    } catch (err) {
        res.status(500).send('Error clearing invoices: ' + err.message);
    }
});

// Fallback to React app
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }
    if (req.path.startsWith('/api') || req.path.startsWith('/invoices')) {
        return next();
    }
    const distIndex = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Invoice server running at http://localhost:${port}`);
});
