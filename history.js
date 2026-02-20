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

        // Merge sources: Use disk as source of truth for presence, localStorage for metadata
        const mergedHistory = diskInvoices.map(file => {
            // Try to find metadata in localStorage
            // Filename format: BuyerName_InvoiceNo.pdf
            const stored = history.find(inv => {
                const safeName = `${inv.buyerName.replace(/[^a-zA-Z0-9]/g, '_')}_${inv.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                return safeName === file.filename;
            });

            if (stored) {
                return { ...stored, url: file.url, fromDisk: true };
            } else {
                // Fallback parsing from filename if not in localStorage
                const parts = file.filename.replace('.pdf', '').split('_');
                const invoiceNo = parts.pop();
                const buyerName = parts.join(' ').replace(/_/g, ' ');
                return {
                    invoiceNo: invoiceNo || 'Unknown',
                    buyerName: buyerName || file.filename,
                    invoiceDate: file.createdAt,
                    amount: 'N/A',
                    url: file.url,
                    fromDisk: true
                };
            }
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
                                    <td style="font-weight: 600;">${inv.invoiceNo}</td>
                                    <td>${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                                    <td>${inv.buyerName}</td>
                                    <td style="font-weight: 600;">${inv.amount !== 'N/A' ? '₹ ' + inv.amount : 'N/A'}</td>
                                    <td>
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

function downloadInvoice(invoiceNo) {
    const history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
    const invoice = history.find(inv => inv.invoiceNo === invoiceNo);

    if (invoice) {
        const safeFilename = `${invoice.buyerName.replace(/[^a-zA-Z0-9]/g, '_')}_${invoice.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        // Also save to server if not already there (or just to be sure)
        fetch('/save-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                html: invoice.html,
                filename: safeFilename
            })
        }).then(response => response.json())
            .then(data => console.log('Server response:', data))
            .catch(err => console.error('Error saving to server:', err));

        const printContainer = document.getElementById('printContainer');
        printContainer.innerHTML = invoice.html;

        const originalTitle = document.title;
        document.title = safeFilename.replace('.pdf', '');

        window.print();

        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    }
}

function deleteInvoice(invoiceNo) {
    if (confirm('Are you sure you want to delete this invoice from history?')) {
        let history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
        history = history.filter(inv => inv.invoiceNo !== invoiceNo);
        localStorage.setItem('invoice_history', JSON.stringify(history));
        loadHistory();
    }
}
