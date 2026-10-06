import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import InvoiceHistory from './components/InvoiceHistory';
import { DEFAULT_ITEMS } from './data/inventory';
import { saveInvoiceOnServer } from './services/api';
import './style.css';

function getNextInvoiceNumber() {
    const counter = parseInt(localStorage.getItem('invoice_counter')) || 1;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `INV/${year}/${month}/${String(counter).padStart(4, '0')}`;
}

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

const getInitialFormData = () => ({
    companyName: 'SMART ENGINEERING',
    companyBusiness:
        'MANUFACTURING & SUPPLIERS, INSTRUMENTATION, HYDRAULIC & PNEUMATIC - TUBE FITTINGS, VALVE, MANIFOLD, & QRC IN S.S., M.S. & BRASS (MAKERS)',
    companyAddress: '411, Subhash Nagar, M.I.D.C. Road, Airoli, Navi Mumbai - 400 708',
    companyMobile: '9324040359 / 9326576679',
    companyEmail: 'smartmaker9@gmail.com',
    companyGSTIN: '27CGMPM8454N1ZG',
    companyState: 'Maharashtra, Code: 27',
    bankName: 'TJSB',
    branchName: 'Mulund (E), Mumbai - 400 081.',
    accountNo: '106120100000102',
    ifscCode: 'TJSB0000106',
    signatoryName: 'Proprietor',
    signatureImage: '',

    buyerName: '',
    buyerMobile: '',
    buyerAddress: '',
    buyerGSTIN: '',
    buyerState: '',

    invoiceNo: getNextInvoiceNumber(),
    invoiceDate: getTodayDateString(),
    referenceNo: '',
    deliveryNote: '',

    items: DEFAULT_ITEMS.map((item) => ({
        desc: item.desc,
        hsn: item.hsn,
        qty: item.qty,
        rate: item.rate,
        amount: (item.qty * item.rate).toFixed(2)
    })),

    cgstRate: 9,
    sgstRate: 9,
    igstRate: 0
});

export default function App() {
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'preview' | 'history'
    const [formData, setFormData] = useState(getInitialFormData);
    const [isSaving, setIsSaving] = useState(false);

    // Calculated totals
    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, item) => {
            return sum + (parseFloat(item.amount) || 0);
        }, 0);

        const cgstAmount = (subtotal * (parseFloat(formData.cgstRate) || 0)) / 100;
        const sgstAmount = (subtotal * (parseFloat(formData.sgstRate) || 0)) / 100;
        const igstAmount = (subtotal * (parseFloat(formData.igstRate) || 0)) / 100;
        const totalTax = cgstAmount + sgstAmount + igstAmount;
        const grandTotal = subtotal + totalTax;

        return {
            subtotal,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalTax,
            grandTotal
        };
    }, [formData.items, formData.cgstRate, formData.sgstRate, formData.igstRate]);

    // Generate Invoice preview
    const handleGenerateInvoice = () => {
        setActiveTab('preview');
        window.scrollTo(0, 0);
    };

    // Return to form from preview
    const handleEditInvoice = () => {
        setActiveTab('create');
        window.scrollTo(0, 0);
    };

    // Reset Form
    const handleResetForm = () => {
        if (window.confirm('Are you sure you want to reset the form? All data will be reset.')) {
            setFormData(getInitialFormData());
            window.scrollTo(0, 0);
        }
    };

    // Save as PDF and trigger print (or silent save)
    const handleSavePDF = async (renderedHTML, triggerPrint = true) => {
        setIsSaving(true);
        const invoiceNo = formData.invoiceNo.trim();
        const buyerName = formData.buyerName.trim();
        const buyerMobile = (formData.buyerMobile || '').trim();
        const invoiceDate = formData.invoiceDate;
        const grandTotalFormatted = totals.grandTotal.toFixed(2);
        const safeFilename = `${invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        // 1. Save to LocalStorage history
        try {
            const history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
            const index = history.findIndex((inv) => inv.invoiceNo === invoiceNo);
            const invoiceRecord = {
                invoiceNo,
                buyerName,
                buyerMobile,
                invoiceDate,
                amount: grandTotalFormatted,
                html: renderedHTML
            };

            if (index !== -1) {
                history[index] = invoiceRecord;
            } else {
                history.push(invoiceRecord);
            }
            localStorage.setItem('invoice_history', JSON.stringify(history));
        } catch (e) {
            console.error('Failed to update localStorage:', e);
        }

        // 2. Save on Server via API
        try {
            await saveInvoiceOnServer({
                html: renderedHTML,
                filename: safeFilename,
                metadata: {
                    invoiceNo,
                    buyerName,
                    buyerMobile,
                    invoiceDate,
                    amount: grandTotalFormatted
                }
            });
        } catch (err) {
            console.warn('Could not save PDF to server (offline or error):', err);
        } finally {
            setIsSaving(false);
        }

        // 3. Increment Invoice Counter in LocalStorage
        const currentCounter = parseInt(localStorage.getItem('invoice_counter')) || 1;
        localStorage.setItem('invoice_counter', currentCounter + 1);

        // 4. Trigger browser print dialog if requested
        if (triggerPrint) {
            const originalTitle = document.title;
            document.title = safeFilename.replace('.pdf', '');
            window.print();
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        }
    };

    return (
        <div>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="container">
                {activeTab === 'create' && (
                    <InvoiceForm
                        formData={formData}
                        setFormData={setFormData}
                        onGenerateInvoice={handleGenerateInvoice}
                        onResetForm={handleResetForm}
                    />
                )}

                {activeTab === 'preview' && (
                    <InvoicePreview
                        formData={formData}
                        totals={totals}
                        onEdit={handleEditInvoice}
                        onSavePDF={handleSavePDF}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'history' && (
                    <InvoiceHistory onNavigateCreate={() => setActiveTab('create')} />
                )}
            </div>
        </div>
    );
}
