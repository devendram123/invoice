document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

async function loadHistory() {
    const container = document.getElementById('historyContent');
    const noData = document.getElementById('noData');

    try {
        // Fetch files from server
        const response = await fetch('/api/invoices');
        const diskInvoices = await response.json();

        // Get metadata from localStorage
        const history = JSON.parse(localStorage.getItem('invoice_history') || '[]');

        if (diskInvoices.length === 0 && history.length === 0) {
            noData.style.display = 'block';
            return;
        }

        noData.style.display = 'none';

        // Merge sources: Prioritize Server Metadata, fallback to disk parsing/localStorage
        const mergedHistory = diskInvoices.map(file => {
            const serverMeta = file.metadata || {};

            // Try to find metadata in localStorage as backup
            const stored = history.find(inv => {
                const safeName = `${inv.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                return safeName === file.filename;
            });

            return {
                invoiceNo: serverMeta.invoiceNo || (stored ? stored.invoiceNo : file.filename.replace('.pdf', '')),
                buyerName: serverMeta.buyerName || (stored ? stored.buyerName : 'Unknown'),
                invoiceDate: serverMeta.invoiceDate || file.createdAt,
                amount: serverMeta.amount || (stored ? stored.amount : 'N/A'),
                html: serverMeta.html || (stored ? stored.html : ''),
                url: file.url,
                fromDisk: true
            };
        });

        // Group by Month/Year
        const groups = {};
        mergedHistory.forEach(invoice => {
            const date = new Date(invoice.invoiceDate);
            const monthYear = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(invoice);
        });

        // Sort groups by date (descending)
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            return new Date(groups[b][0].invoiceDate) - new Date(groups[a][0].invoiceDate);
        });

        let historyHTML = '';
        sortedGroupKeys.forEach(monthYear => {
            historyHTML += `
                <div class="month-group">
                    <div class="month-title">${monthYear}</div>
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Buyer Name</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groups[monthYear].map(inv => `
                                <tr>
                                    <td data-label="Invoice No" style="font-weight: 600;">${inv.invoiceNo}</td>
                                    <td data-label="Date">${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                                    <td data-label="Buyer Name">${inv.buyerName}</td>
                                    <td data-label="Amount" style="font-weight: 600;">${inv.amount !== 'N/A' ? '₹ ' + inv.amount : 'N/A'}</td>
                                    <td data-label="Actions">
                                        <a href="${inv.url}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration: none; display: inline-block;">View PDF</a>
                                        <button class="btn btn-primary btn-sm" onclick="downloadInvoice('${inv.invoiceNo}')">Print Window</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteInvoice('${inv.invoiceNo}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

        container.innerHTML = historyHTML;
    } catch (err) {
        console.error('Error loading history:', err);
        container.innerHTML = `<div style="color: red; padding: 20px;">Error connecting to server. Make sure server.js is running.</div>`;
    }
}

function filterInvoices() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('.history-table tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });

    // Hide empty month groups
    document.querySelectorAll('.month-group').forEach(group => {
        const visibleRows = group.querySelectorAll('tbody tr:not([style*="display: none"])');
        group.style.display = visibleRows.length > 0 ? '' : 'none';
    });
}

async function downloadInvoice(invoiceNo) {
    // 1. Try to find in localStorage (fastest)
    const history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
    let invoice = history.find(inv => inv.invoiceNo === invoiceNo);

    // 2. If not in localStorage, fetch from server metadata
    if (!invoice) {
        try {
            const response = await fetch('/api/invoices');
            const diskInvoices = await response.json();
            const serverInvoice = diskInvoices.find(file => file.metadata && file.metadata.invoiceNo === invoiceNo);
            if (serverInvoice) {
                invoice = serverInvoice.metadata;
            }
        } catch (err) {
            console.error('Error fetching from server:', err);
        }
    }

    if (invoice && invoice.html) {
        const safeFilename = `${invoice.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        // Ensure printing container exists
        let printContainer = document.getElementById('printContainer');
        if (!printContainer) {
            printContainer = document.createElement('div');
            printContainer.id = 'printContainer';
            document.body.appendChild(printContainer);
        }

        printContainer.innerHTML = invoice.html;

        const originalTitle = document.title;
        document.title = safeFilename.replace('.pdf', '');

        window.print();

        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    }
}

async function deleteInvoice(invoiceNo) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        let history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
        const invoice = history.find(inv => inv.invoiceNo === invoiceNo);

        if (invoice) {
            const filename = `${invoice.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

            // Delete from server
            try {
                await fetch(`/api/invoices/${filename}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Error deleting from server:', err);
            }
        }

        // Delete from local storage
        history = history.filter(inv => inv.invoiceNo !== invoiceNo);
        localStorage.setItem('invoice_history', JSON.stringify(history));

        loadHistory();
    }
}

async function deleteAllInvoices() {
    if (confirm('CAUTION: Are you sure you want to delete ALL invoices? This cannot be undone.')) {
        // Delete from server
        try {
            await fetch('/api/invoices', { method: 'DELETE' });
        } catch (err) {
            console.error('Error clearing server history:', err);
        }

        // Delete from local storage
        localStorage.removeItem('invoice_history');

        loadHistory();
    }
}
