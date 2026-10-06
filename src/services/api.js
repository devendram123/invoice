export async function fetchInvoices() {
    const res = await fetch('/api/invoices');
    if (!res.ok) {
        throw new Error(`Failed to fetch invoices: ${res.statusText}`);
    }
    return res.json();
}

export async function saveInvoiceOnServer({ html, filename, metadata }) {
    const res = await fetch('/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename, metadata })
    });
    if (!res.ok) {
        throw new Error(`Failed to save invoice: ${res.statusText}`);
    }
    return res.json();
}

export async function deleteInvoiceOnServer(filename) {
    const res = await fetch(`/api/invoices/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error(`Failed to delete invoice: ${res.statusText}`);
    }
    return res.json();
}

export async function deleteAllInvoicesOnServer() {
    const res = await fetch('/api/invoices', {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error(`Failed to clear invoices: ${res.statusText}`);
    }
    return res.json();
}
