import React, { useState, useEffect } from 'react';
import { fetchInvoices, deleteInvoiceOnServer, deleteAllInvoicesOnServer } from '../services/api';
import { shareOnWhatsApp } from '../utils/whatsapp';

export default function InvoiceHistory({ onNavigateCreate }) {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [printHtml, setPrintHtml] = useState(null);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch server files
            let diskInvoices = [];
            try {
                diskInvoices = await fetchInvoices();
            } catch (err) {
                console.warn('Could not fetch server invoices (server may be offline):', err);
            }

            // 2. Fetch localStorage
            const localHistory = JSON.parse(localStorage.getItem('invoice_history') || '[]');

            // Merge sources
            const merged = diskInvoices.map((file) => {
                const serverMeta = file.metadata || {};
                const safeName = file.filename;

                const stored = localHistory.find((inv) => {
                    const localSafe = `${inv.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    return localSafe === safeName;
                });

                return {
                    filename: file.filename,
                    invoiceNo: serverMeta.invoiceNo || (stored ? stored.invoiceNo : file.filename.replace('.pdf', '')),
                    buyerName: serverMeta.buyerName || (stored ? stored.buyerName : 'Unknown'),
                    buyerMobile: serverMeta.buyerMobile || (stored ? stored.buyerMobile : ''),
                    invoiceDate: serverMeta.invoiceDate || file.createdAt,
                    amount: serverMeta.amount || (stored ? stored.amount : 'N/A'),
                    html: serverMeta.html || (stored ? stored.html : ''),
                    url: file.url
                };
            });

            // Add any localStorage items that are not in diskInvoices (if diskInvoices is empty or missing them)
            localHistory.forEach((localInv) => {
                const alreadyIncluded = merged.some((m) => m.invoiceNo === localInv.invoiceNo);
                if (!alreadyIncluded) {
                    const safeName = `${localInv.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    merged.push({
                        filename: safeName,
                        invoiceNo: localInv.invoiceNo,
                        buyerName: localInv.buyerName || 'Unknown',
                        buyerMobile: localInv.buyerMobile || '',
                        invoiceDate: localInv.invoiceDate,
                        amount: localInv.amount || 'N/A',
                        html: localInv.html || '',
                        url: `/invoices/${safeName}`
                    });
                }
            });

            setInvoices(merged);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleDelete = async (invoice) => {
        if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNo}?`)) {
            return;
        }

        try {
            if (invoice.filename) {
                await deleteInvoiceOnServer(invoice.filename);
            }
        } catch (err) {
            console.error('Error deleting from server:', err);
        }

        // Delete from local storage
        const history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
        const updatedHistory = history.filter((inv) => inv.invoiceNo !== invoice.invoiceNo);
        localStorage.setItem('invoice_history', JSON.stringify(updatedHistory));

        setInvoices((prev) => prev.filter((inv) => inv.invoiceNo !== invoice.invoiceNo));
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('CAUTION: Are you sure you want to delete ALL invoices? This cannot be undone.')) {
            return;
        }

        try {
            await deleteAllInvoicesOnServer();
        } catch (err) {
            console.error('Error clearing server invoices:', err);
        }

        localStorage.removeItem('invoice_history');
        setInvoices([]);
    };

    const handlePrintInvoice = (invoice) => {
        if (!invoice.html) {
            alert('Invoice preview HTML is not stored for this record.');
            return;
        }

        setPrintHtml(invoice.html);

        const safeFilename = `${invoice.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const originalTitle = document.title;
        document.title = safeFilename.replace('.pdf', '');

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.title = originalTitle;
                setPrintHtml(null);
            }, 500);
        }, 300);
    };

    const handleWhatsAppShare = (inv) => {
        const fullPdfUrl = inv.url.startsWith('http')
            ? inv.url
            : `${window.location.origin}${inv.url}`;

        shareOnWhatsApp({
            invoiceNo: inv.invoiceNo,
            companyName: 'SMART ENGINEERING',
            buyerName: inv.buyerName,
            invoiceDate: inv.invoiceDate,
            amount: inv.amount,
            pdfUrl: fullPdfUrl,
            phone: inv.buyerMobile || ''
        });
    };

    // Filter invoices by search term
    const filteredInvoices = invoices.filter((inv) => {
        const query = searchTerm.toLowerCase();
        return (
            (inv.buyerName && inv.buyerName.toLowerCase().includes(query)) ||
            (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(query))
        );
    });

    // Group invoices by Month/Year
    const groups = {};
    filteredInvoices.forEach((inv) => {
        const dateObj = new Date(inv.invoiceDate);
        const monthYear = isNaN(dateObj.getTime())
            ? 'Other'
            : dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(inv);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return new Date(groups[b][0].invoiceDate) - new Date(groups[a][0].invoiceDate);
    });

    return (
        <div>
            <div className="history-header no-print">
                <h1>Generated Invoices</h1>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by Buyer or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', minWidth: '240px' }}
                    />
                </div>
                {invoices.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteAll}
                        style={{ padding: '8px 15px', fontSize: '14px', width: 'auto' }}
                    >
                        Delete All
                    </button>
                )}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Loading invoices...</div>}

            {error && (
                <div style={{ color: '#dc3545', padding: '20px', background: '#ffe6e6', borderRadius: '6px', marginBottom: '20px' }}>
                    Note: Backend server issue ({error}). Local offline records are shown.
                </div>
            )}

            {!loading && sortedGroupKeys.length === 0 && (
                <div className="no-data" style={{ display: 'block', textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px' }}>
                    <h3>No invoices found</h3>
                    <p>Create a new invoice to see it in history.</p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onNavigateCreate}
                        style={{ display: 'inline-block', marginTop: '20px' }}
                    >
                        Create New Invoice
                    </button>
                </div>
            )}

            {!loading &&
                sortedGroupKeys.map((monthYear) => (
                    <div className="month-group no-print" key={monthYear}>
                        <div className="month-title">{monthYear}</div>
                        <table className="history-table">
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
                                {groups[monthYear].map((inv) => (
                                    <tr key={inv.invoiceNo}>
                                        <td data-label="Invoice No" style={{ fontWeight: 600 }}>
                                            {inv.invoiceNo}
                                        </td>
                                        <td data-label="Date">
                                            {inv.invoiceDate
                                                ? new Date(inv.invoiceDate).toLocaleDateString('en-IN')
                                                : 'N/A'}
                                        </td>
                                        <td data-label="Buyer Name">{inv.buyerName}</td>
                                        <td data-label="Amount" style={{ fontWeight: 600 }}>
                                            {inv.amount && inv.amount !== 'N/A' ? `₹ ${inv.amount}` : 'N/A'}
                                        </td>
                                        <td data-label="Actions">
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {inv.url && (
                                                    <a
                                                        href={inv.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-primary"
                                                        style={{
                                                            textDecoration: 'none',
                                                            display: 'inline-block',
                                                            padding: '6px 10px',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        View PDF
                                                    </a>
                                                )}
                                                {inv.html && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => handlePrintInvoice(inv)}
                                                        style={{ padding: '6px 10px', fontSize: '12px' }}
                                                    >
                                                        Print Window
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-whatsapp"
                                                    onClick={() => handleWhatsAppShare(inv)}
                                                    title="Share invoice on WhatsApp"
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                >
                                                    💬 WhatsApp
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(inv)}
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}

            {/* Container for printing historical invoice */}
            {printHtml && (
                <div
                    id="printContainer"
                    dangerouslySetInnerHTML={{ __html: printHtml }}
                    style={{ display: 'none' }}
                />
            )}
        </div>
    );
}
