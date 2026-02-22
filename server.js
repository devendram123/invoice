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
app.use(express.static(__dirname));

const INVOICE_DIR = path.join(__dirname, 'invoices');

// Ensure invoices directory exists
if (!fs.existsSync(INVOICE_DIR)) {
    fs.mkdirSync(INVOICE_DIR);
}

app.post('/save-invoice', async (req, res) => {
    const { html, filename } = req.body;

    if (!html || !filename) {
        return res.status(400).send('HTML and filename are required');
    }

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();

        // Set viewport to standard desktop size to avoid mobile breakpoints
        await page.setViewport({ width: 1200, height: 800 });

        // Emulate screen media to match the preview exactly, 
        // but A4 PDF generation will handle the format
        await page.emulateMediaType('screen');

        // Wrap the invoice HTML in a basic template with the CSS
        const cssContent = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
        const fullHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${cssContent}</style>
                <style>
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .invoice-document { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
                </style>
            </head>
            <body>
                ${html}
            </body>
            </html>
        `;

        await page.setContent(fullHTML, {
            waitUntil: 'networkidle0',
            url: `file://${path.join(__dirname, 'index.html')}` // Provides context for relative assets
        });

        const filePath = path.join(INVOICE_DIR, filename);
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
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
            return {
                filename: file,
                createdAt: stats.birthtime,
                url: `/invoices/${file}`
            };
        });
        res.json(invoices);
    } catch (err) {
        res.status(500).send('Error reading directory: ' + err.message);
    }
});

app.listen(port, () => {
    console.log(`Invoice server running at http://localhost:${port}`);
});
