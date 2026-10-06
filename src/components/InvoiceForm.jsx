import React from 'react';
import { INVENTORY_LIST, DEFAULT_ITEMS } from '../data/inventory';

export default function InvoiceForm({
    formData,
    setFormData,
    onGenerateInvoice,
    onResetForm
}) {
    // Handle top-level input change
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle signature upload
    const handleSignatureChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({
                    ...prev,
                    signatureImage: event.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Add item row
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { desc: '', hsn: '7218', qty: 1, rate: 0, amount: '0.00' }
            ]
        }));
    };

    // Remove item row
    const removeItem = (index) => {
        setFormData(prev => {
            const updated = prev.items.filter((_, i) => i !== index);
            return { ...prev, items: updated };
        });
    };

    // Update item field
    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            const currentItem = { ...newItems[index] };

            if (field === 'desc') {
                currentItem.desc = value;
                // Auto-match inventory
                const matched = INVENTORY_LIST.find(
                    item =>
                        item.code.toLowerCase() === value.trim().toLowerCase() ||
                        item.description.toLowerCase() === value.trim().toLowerCase() ||
                        `${item.code} - ${item.description}`.toLowerCase() === value.trim().toLowerCase()
                );
                if (matched) {
                    currentItem.desc = `${matched.code} - ${matched.description}`;
                }
            } else if (field === 'qty') {
                const qty = parseFloat(value) || 0;
                currentItem.qty = value === '' ? '' : qty;
                const rate = parseFloat(currentItem.rate) || 0;
                currentItem.amount = (qty * rate).toFixed(2);
            } else if (field === 'rate') {
                const rate = parseFloat(value) || 0;
                currentItem.rate = value === '' ? '' : rate;
                const qty = parseFloat(currentItem.qty) || 0;
                currentItem.amount = (qty * rate).toFixed(2);
            } else {
                currentItem[field] = value;
            }

            newItems[index] = currentItem;
            return { ...prev, items: newItems };
        });
    };

    // Load defaults
    const handleLoadDefaultItems = () => {
        if (window.confirm('Reset items list to default 46 items?')) {
            const mapped = DEFAULT_ITEMS.map(i => ({
                desc: i.desc,
                hsn: i.hsn,
                qty: i.qty,
                rate: i.rate,
                amount: (i.qty * i.rate).toFixed(2)
            }));
            setFormData(prev => ({ ...prev, items: mapped }));
        }
    };

    // Form submit validation
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.companyName.trim()) {
            alert('Please enter company name');
            return;
        }

        if (!formData.buyerName.trim()) {
            alert('Please enter buyer name');
            return;
        }

        if (!formData.items || formData.items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.desc || !item.desc.trim()) {
                alert(`Please enter description for item ${i + 1}`);
                return;
            }
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            if (qty <= 0 || rate <= 0) {
                alert(`Please enter valid quantity and rate for item ${i + 1}`);
                return;
            }
        }

        onGenerateInvoice();
    };

    return (
        <div className="invoice-form" id="invoiceForm">
            {/* Datalist for inventory items */}
            <datalist id="inventoryData">
                {INVENTORY_LIST.map((item, idx) => (
                    <React.Fragment key={idx}>
                        <option value={`${item.code} - ${item.description}`} />
                        <option value={item.code} />
                        <option value={item.description} />
                    </React.Fragment>
                ))}
            </datalist>

            <h2>Create New Invoice</h2>

            {/* Company Details */}
            <div className="section">
                <h3>Company Details</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Company Name:</label>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Business Type:</label>
                        <input
                            type="text"
                            value={formData.companyBusiness}
                            onChange={(e) => handleChange('companyBusiness', e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Company Address:</label>
                        <textarea
                            rows="2"
                            value={formData.companyAddress}
                            onChange={(e) => handleChange('companyAddress', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mobile:</label>
                        <input
                            type="text"
                            value={formData.companyMobile}
                            onChange={(e) => handleChange('companyMobile', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={formData.companyEmail}
                            onChange={(e) => handleChange('companyEmail', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>GSTIN/UIN:</label>
                        <input
                            type="text"
                            value={formData.companyGSTIN}
                            onChange={(e) => handleChange('companyGSTIN', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>State & Code:</label>
                        <input
                            type="text"
                            value={formData.companyState}
                            onChange={(e) => handleChange('companyState', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Bank Name:</label>
                        <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => handleChange('bankName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Branch Name:</label>
                        <input
                            type="text"
                            value={formData.branchName}
                            onChange={(e) => handleChange('branchName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Account No:</label>
                        <input
                            type="text"
                            value={formData.accountNo}
                            onChange={(e) => handleChange('accountNo', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>IFSC Code:</label>
                        <input
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => handleChange('ifscCode', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Authorized Signatory Name:</label>
                        <input
                            type="text"
                            value={formData.signatoryName}
                            onChange={(e) => handleChange('signatoryName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Upload Signature Image (Optional):</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureChange}
                        />
                        {formData.signatureImage && (
                            <div style={{ marginTop: '10px' }}>
                                <img
                                    src={formData.signatureImage}
                                    alt="Signature Preview"
                                    style={{ maxWidth: '160px', maxHeight: '60px', objectFit: 'contain', border: '1px solid #ddd', padding: '4px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChange('signatureImage', '')}
                                    style={{ display: 'block', marginTop: '5px', fontSize: '11px', color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    Remove signature
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Buyer Details */}
            <div className="section">
                <h3>Buyer Details</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Buyer Name: *</label>
                        <input
                            type="text"
                            placeholder="Enter buyer name"
                            value={formData.buyerName}
                            onChange={(e) => handleChange('buyerName', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Buyer GSTIN/UIN:</label>
                        <input
                            type="text"
                            placeholder="Enter GSTIN"
                            value={formData.buyerGSTIN}
                            onChange={(e) => handleChange('buyerGSTIN', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Buyer Mobile / WhatsApp (Optional):</label>
                        <input
                            type="tel"
                            placeholder="e.g., 9876543210"
                            value={formData.buyerMobile || ''}
                            onChange={(e) => handleChange('buyerMobile', e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Buyer Address:</label>
                        <textarea
                            rows="2"
                            placeholder="Enter address"
                            value={formData.buyerAddress}
                            onChange={(e) => handleChange('buyerAddress', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Buyer State & Code:</label>
                        <input
                            type="text"
                            placeholder="e.g., Maharashtra, Code: 27"
                            value={formData.buyerState}
                            onChange={(e) => handleChange('buyerState', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="section">
                <h3>Invoice Information</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Invoice No:</label>
                        <input
                            type="text"
                            placeholder="INV/YYYY/MM/XXXX"
                            value={formData.invoiceNo}
                            onChange={(e) => handleChange('invoiceNo', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Invoice Date:</label>
                        <input
                            type="date"
                            value={formData.invoiceDate}
                            onChange={(e) => handleChange('invoiceDate', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Reference No / P.O. Date:</label>
                        <input
                            type="text"
                            placeholder="Optional"
                            value={formData.referenceNo}
                            onChange={(e) => handleChange('referenceNo', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Delivery Note:</label>
                        <input
                            type="text"
                            placeholder="Optional"
                            value={formData.deliveryNote}
                            onChange={(e) => handleChange('deliveryNote', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Items Section */}
            <div className="section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Items ({formData.items.length})</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" className="btn btn-secondary" onClick={handleLoadDefaultItems} style={{ fontSize: '13px', padding: '6px 12px' }}>
                            Reset to Default 46 Items
                        </button>
                        <button type="button" className="btn btn-add" onClick={addItem}>
                            + Add Item
                        </button>
                    </div>
                </div>
                <div className="items-table-wrapper">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>Sl</th>
                                <th>Description</th>
                                <th style={{ width: '90px' }}>HSN/SAC</th>
                                <th style={{ width: '80px' }}>Quantity</th>
                                <th style={{ width: '100px' }}>Rate</th>
                                <th style={{ width: '110px' }}>Amount</th>
                                <th style={{ width: '70px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                    <td>
                                        <input
                                            type="text"
                                            list="inventoryData"
                                            placeholder="Search code or name..."
                                            value={item.desc}
                                            onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="HSN"
                                            value={item.hsn}
                                            onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={item.qty}
                                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.amount}
                                            readOnly
                                            style={{ backgroundColor: '#f9f9f9', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => removeItem(index)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tax Configuration */}
            <div className="section">
                <h3>Tax Configuration</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>CGST (%):</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.cgstRate}
                            onChange={(e) => handleChange('cgstRate', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="form-group">
                        <label>SGST (%):</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.sgstRate}
                            onChange={(e) => handleChange('sgstRate', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="form-group">
                        <label>IGST (%):</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.igstRate}
                            onChange={(e) => handleChange('igstRate', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                    Generate Invoice
                </button>
                <button type="button" className="btn btn-secondary" onClick={onResetForm}>
                    Reset
                </button>
            </div>
        </div>
    );
}
