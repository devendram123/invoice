import React, { useRef } from 'react';
import { numberToWords } from '../utils/numberToWords';
import { shareOnWhatsApp } from '../utils/whatsapp';

export default function InvoicePreview({
    formData,
    totals,
    onEdit,
    onSavePDF,
    isSaving
}) {
    const invoiceDocRef = useRef(null);

    // Format date nicely (e.g. 06 Oct 2026)
    const formattedDate = formData.invoiceDate
        ? new Date(formData.invoiceDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
          })
        : '';

    const amountInWords = numberToWords(totals.grandTotal);

    const handlePrint = () => {
        const invoiceNo = formData.invoiceNo ? formData.invoiceNo.trim() : 'Invoice';
        const safeFilename = invoiceNo.replace(/[^a-zA-Z0-9]/g, '_');
        const originalTitle = document.title;
        document.title = safeFilename;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const handleSaveAsPDF = () => {
        if (!invoiceDocRef.current) return;
        const html = invoiceDocRef.current.innerHTML;
        onSavePDF(html, true);
    };

    const handleWhatsAppShare = () => {
        if (!invoiceDocRef.current) return;
        const html = invoiceDocRef.current.innerHTML;

        const invoiceNo = formData.invoiceNo.trim();
        const safeFilename = `${invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const pdfUrl = `${window.location.origin}/invoices/${safeFilename}`;

        // Ensure PDF is saved silently on server so the link works immediately
        onSavePDF(html, false);

        shareOnWhatsApp({
            invoiceNo,
            companyName: formData.companyName,
            buyerName: formData.buyerName,
            invoiceDate: formData.invoiceDate,
            amount: totals.grandTotal.toFixed(2),
            pdfUrl,
            phone: formData.buyerMobile
        });
    };

    return (
        <div className="invoice-preview" id="invoicePreview">
            <div className="preview-actions no-print">
                <button type="button" className="btn btn-primary" onClick={handlePrint}>
                    Print Invoice
                </button>
                <button type="button" className="btn btn-secondary" onClick={onEdit}>
                    Edit
                </button>
                <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSaveAsPDF}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving PDF...' : 'Save as PDF'}
                </button>
                <button
                    type="button"
                    className="btn btn-whatsapp"
                    onClick={handleWhatsAppShare}
                    title="Share invoice on WhatsApp"
                >
                    💬 Share on WhatsApp
                </button>
            </div>

            <div className="invoice-document" id="invoiceDocument" ref={invoiceDocRef}>
                <div className="invoice-page">
                    <div className="invoice-header-branding">
                        <div className="doc-header">
                            <div className="doc-header-main">
                                <div className="company-logo">
                                    <img
                                        src="/smart_logo.png"
                                        alt="Logo"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextElementSibling) {
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: 'none',
                                            width: '100%',
                                            height: '100%',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 900,
                                            color: '#dc3545',
                                            flexDirection: 'column',
                                            lineHeight: 1.1
                                        }}
                                    >
                                        <span style={{ fontSize: '28px' }}>S E</span>
                                    </div>
                                </div>
                                <div className="company-title-area">
                                    <h1 className="company-name-main">{formData.companyName}</h1>
                                    <p className="company-tagline">MANUFACTURING &amp; SUPPLIERS</p>
                                    <p className="company-business-details">{formData.companyBusiness}</p>
                                </div>
                            </div>
                            <div className="doc-header-info">
                                <p>{(formData.companyAddress || '').replace(/\n/g, ', ')}</p>
                                <p>Mob.: {formData.companyMobile}</p>
                                <p>E-mail : {formData.companyEmail}</p>
                                <p><strong>GSTIN : {formData.companyGSTIN}</strong></p>
                            </div>
                        </div>
                        <div className="tax-invoice-label">
                            <h3>TAX INVOICE</h3>
                        </div>
                    </div>

                    <div className="invoice-info-grid" style={{ marginTop: '10px' }}>
                        <div className="info-box">
                            <p><strong>M/s.</strong> {formData.buyerName}</p>
                            {(formData.buyerAddress || '').split('\n').map((line, idx) => (
                                <p key={idx}>{line}</p>
                            ))}
                            {formData.buyerGSTIN && <p><strong>GSTIN:</strong> {formData.buyerGSTIN}</p>}
                            {formData.buyerState && <p><strong>State:</strong> {formData.buyerState}</p>}
                        </div>
                        <div className="info-box">
                            <p><strong>Invoice No.:</strong> {formData.invoiceNo}</p>
                            <p><strong>Invoice Date:</strong> {formattedDate}</p>
                            {formData.referenceNo && <p><strong>P.O. Date / Ref:</strong> {formData.referenceNo}</p>}
                            {formData.deliveryNote && <p><strong>Delivery Note:</strong> {formData.deliveryNote}</p>}
                        </div>
                    </div>

                    <div className="invoice-items">
                        <div className="invoice-table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>Sr. No.</th>
                                        <th>Product Description</th>
                                        <th style={{ width: '80px' }}>HSN CODE</th>
                                        <th style={{ width: '70px' }}>QUANTITY</th>
                                        <th style={{ width: '100px' }}>RATE Rs.</th>
                                        <th style={{ width: '120px' }}>TOTAL AMOUNT Rs.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                            <td style={{ textAlign: 'left' }}>{item.desc}</td>
                                            <td style={{ textAlign: 'center' }}>{item.hsn}</td>
                                            <td style={{ textAlign: 'center' }}>{item.qty}</td>
                                            <td className="amount">{(parseFloat(item.rate) || 0).toFixed(2)}</td>
                                            <td className="amount">{(parseFloat(item.amount) || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="invoice-footer-grid">
                        <div>
                            <p style={{ fontSize: '0.75em', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                                Payment within................Days.
                            </p>
                            <div style={{ marginTop: '10px' }}>
                                <p style={{ fontSize: '0.8em', marginBottom: '5px' }}>
                                    <strong>Rs. in words:</strong> {amountInWords}
                                </p>
                            </div>
                            <div style={{ marginTop: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px', fontSize: '0.75em' }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#dc3545', borderBottom: '1px solid #eee' }}>Bank Details</h4>
                                <p><strong>BANK :</strong> {formData.bankName}</p>
                                <p><strong>BRANCH :</strong> {formData.branchName}</p>
                                <p><strong>Current A/c No.:</strong> {formData.accountNo}</p>
                                <p><strong>IFSC CODE:</strong> {formData.ifscCode}</p>
                            </div>
                            <div style={{ marginTop: '15px', fontSize: '0.65em', lineHeight: 1.4 }}>
                                <strong style={{ textDecoration: 'underline', color: '#dc3545' }}>Term &amp; Conditions :</strong><br />
                                1) Responsibility ceases on delivery of goods at registration of.........in Mumbai.<br />
                                2) Interest @24% p.a. Added monthly to accounts unpaid on month after delivery.<br />
                                3) Goods once sold will not be taken back.<br />
                                4) GST tax will be charged extra if applicable.<br />
                                5) All rate are extra.<br />
                                6) Subject to Mumbai Jurisdiction.
                            </div>
                        </div>

                        <div className="totals-table">
                            <table>
                                <tbody>
                                    <tr>
                                        <td className="label">Total Amount before Tax</td>
                                        <td className="amount">₹ {totals.subtotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">SGST {formData.sgstRate}%</td>
                                        <td className="amount">₹ {totals.sgstAmount.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">CGST {formData.cgstRate}%</td>
                                        <td className="amount">₹ {totals.cgstAmount.toFixed(2)}</td>
                                    </tr>
                                    {formData.igstRate > 0 && (
                                        <tr>
                                            <td className="label">IGST {formData.igstRate}%</td>
                                            <td className="amount">₹ {totals.igstAmount.toFixed(2)}</td>
                                        </tr>
                                    )}
                                    <tr className="total-row">
                                        <td className="label">Total Amount After Tax</td>
                                        <td className="amount">₹ {totals.grandTotal.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '40px', position: 'relative' }}>
                                {formData.signatureImage && (
                                    <img
                                        src={formData.signatureImage}
                                        alt="Signature"
                                        style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            maxWidth: '120px',
                                            maxHeight: '50px'
                                        }}
                                    />
                                )}
                                <p style={{ fontSize: '0.7em', fontWeight: 'bold' }}>
                                    Certified that the particulars given above are true and correct.
                                </p>
                                <p style={{ marginTop: '5px', fontWeight: 900, fontSize: '0.85em' }}>
                                    For {formData.companyName}
                                </p>
                                <div style={{ marginTop: '30px', fontSize: '0.75em', borderTop: '1px dashed #333', display: 'inline-block', paddingTop: '5px', minWidth: '150px' }}>
                                    {formData.signatoryName || 'Authorized Signatory'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
