// Initialize invoice number
let invoiceCounter = 1;
let items = [];
let signatureImage = '';

// Load signature image
function loadSignature(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            signatureImage = e.target.result;
            document.getElementById('signaturePreview').src = signatureImage;
            document.getElementById('signaturePreview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Generate invoice number on page load
window.onload = function () {
    generateInvoiceNumber();
    setTodayDate();
    addItem(); // Add first item by default
};

// Generate unique invoice number
function generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const invoiceNo = `${prefix}/${year}/${month}/${String(invoiceCounter).padStart(4, '0')}`;
    document.getElementById('invoiceNo').value = invoiceNo;
    invoiceCounter++;
}

// Set today's date
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
}

// Add new item row
function addItem() {
    const itemsBody = document.getElementById('itemsBody');
    const rowCount = itemsBody.rows.length + 1;

    const row = itemsBody.insertRow();
    row.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <select class="item-desc">
                <option value="">Select item</option>
                <option value="Laptop">Laptop</option>
                <option value="Desktop Computer">Desktop Computer</option>
                <option value="Monitor">Monitor</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Mouse">Mouse</option>
                <option value="Headphones">Headphones</option>
                <option value="Webcam">Webcam</option>
                <option value="Printer">Printer</option>
                <option value="Scanner">Scanner</option>
                <option value="Router">Router</option>
            </select>
        </td>
        <td><input type="text" class="item-hsn" placeholder="HSN/SAC"></td>
        <td><input type="number" class="item-qty" value="1" min="1" onchange="calculateItemAmount(this)"></td>
        <td><input type="number" class="item-rate" value="0" step="0.01" onchange="calculateItemAmount(this)"></td>
        <td><input type="number" class="item-amount" value="0" readonly></td>
        <td><button class="btn btn-danger" onclick="removeItem(this)">Delete</button></td>
    `;
}

// Remove item row
function removeItem(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
    updateSerialNumbers();
    calculateTotal();
}

// Update serial numbers after deletion
function updateSerialNumbers() {
    const itemsBody = document.getElementById('itemsBody');
    const rows = itemsBody.rows;
    for (let i = 0; i < rows.length; i++) {
        rows[i].cells[0].textContent = i + 1;
    }
}

// Calculate amount for individual item
function calculateItemAmount(input) {
    const row = input.parentNode.parentNode;
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;
    row.querySelector('.item-amount').value = amount.toFixed(2);
    calculateTotal();
}

// Calculate total amounts
function calculateTotal() {
    const itemsBody = document.getElementById('itemsBody');
    const rows = itemsBody.rows;
    let subtotal = 0;

    for (let i = 0; i < rows.length; i++) {
        const amount = parseFloat(rows[i].querySelector('.item-amount').value) || 0;
        subtotal += amount;
    }

    return subtotal;
}

// Validate form
function validateForm() {
    const companyName = document.getElementById('companyName').value.trim();
    const buyerName = document.getElementById('buyerName').value.trim();
    const itemsBody = document.getElementById('itemsBody');

    if (!companyName) {
        alert('Please enter company name');
        return false;
    }

    if (!buyerName) {
        alert('Please enter buyer name');
        return false;
    }

    if (itemsBody.rows.length === 0) {
        alert('Please add at least one item');
        return false;
    }

    // Check if items have description and amount
    const rows = itemsBody.rows;
    for (let i = 0; i < rows.length; i++) {
        const desc = rows[i].querySelector('.item-desc').value.trim();
        const amount = parseFloat(rows[i].querySelector('.item-amount').value) || 0;

        if (!desc) {
            alert(`Please enter description for item ${i + 1}`);
            return false;
        }

        if (amount <= 0) {
            alert(`Please enter valid quantity and rate for item ${i + 1}`);
            return false;
        }
    }

    return true;
}

// Generate invoice preview
function generateInvoice() {
    if (!validateForm()) {
        return;
    }

    // Get form data
    const companyName = document.getElementById('companyName').value;
    const companyBusiness = document.getElementById('companyBusiness').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyMobile = document.getElementById('companyMobile').value;
    const companyEmail = document.getElementById('companyEmail').value;
    const companyGSTIN = document.getElementById('companyGSTIN').value;
    const companyState = document.getElementById('companyState').value;
    const challanNumber = document.getElementById('challanNumber').value;
    const bankName = document.getElementById('bankName').value;
    const branchName = document.getElementById('branchName').value;
    const accountNo = document.getElementById('accountNo').value;
    const ifscCode = document.getElementById('ifscCode').value;
    const signatoryName = document.getElementById('signatoryName').value;

    const buyerName = document.getElementById('buyerName').value;
    const buyerAddress = document.getElementById('buyerAddress').value;
    const buyerGSTIN = document.getElementById('buyerGSTIN').value;
    const buyerState = document.getElementById('buyerState').value;

    const invoiceNo = document.getElementById('invoiceNo').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const referenceNo = document.getElementById('referenceNo').value;
    const deliveryNote = document.getElementById('deliveryNote').value;

    const cgstRate = parseFloat(document.getElementById('cgstRate').value) || 0;
    const sgstRate = parseFloat(document.getElementById('sgstRate').value) || 0;
    const igstRate = parseFloat(document.getElementById('igstRate').value) || 0;

    // Calculate totals
    const subtotal = calculateTotal();
    const cgstAmount = (subtotal * cgstRate) / 100;
    const sgstAmount = (subtotal * sgstRate) / 100;
    const igstAmount = (subtotal * igstRate) / 100;
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = subtotal + totalTax;

    // Generate items table
    const itemsBody = document.getElementById('itemsBody');
    const rows = itemsBody.rows;
    let itemsHTML = '';

    for (let i = 0; i < rows.length; i++) {
        const desc = rows[i].querySelector('.item-desc').value;
        const hsn = rows[i].querySelector('.item-hsn').value;
        const qty = rows[i].querySelector('.item-qty').value;
        const rate = parseFloat(rows[i].querySelector('.item-rate').value).toFixed(2);
        const amount = parseFloat(rows[i].querySelector('.item-amount').value).toFixed(2);

        itemsHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${desc}</td>
                <td>${hsn}</td>
                <td>${qty}</td>
                <td class="amount">₹ ${rate}</td>
                <td class="amount">₹ ${amount}</td>
            </tr>
        `;
    }

    // Convert amount to words
    const amountInWords = numberToWords(grandTotal);

    // Format date
    const formattedDate = new Date(invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Generate invoice HTML
    const invoiceHTML = `
        <div class="invoice-page">
        <div class="invoice-header">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="company-logo">
                        <div style="text-align: center;">
                            <div class="logo-om">ॐ</div>
                            <div class="logo-sm">SM</div>
                        </div>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.3em; letter-spacing: 1px; font-weight: 900;">${companyName}</h2>
                        <p style="margin: 3px 0 0 0; font-size: 0.65em; opacity: 0.95; font-weight: 500; line-height: 1.1;">${companyBusiness}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <h3 style="margin: 0; font-size: 1.3em; letter-spacing: 1px;">TAX INVOICE</h3>
                    <p style="margin: 2px 0 0 0; font-size: 0.75em;">Date: ${formattedDate}</p>
                </div>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 2px solid rgba(255,255,255,0.3); display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; font-size: 0.7em;">
                <div><strong>📍</strong> ${companyAddress.replace(/\n/g, ', ')}</div>
                <div><strong>📞</strong> ${companyMobile} | <strong>✉</strong> ${companyEmail}</div>
                <div style="text-align: right;"><strong>GST:</strong> ${companyGSTIN}</div>
            </div>
        </div>
        
        <div class="invoice-info-grid">
            <div class="info-box">
                <h4>Invoice Details</h4>
                <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                ${referenceNo ? `<p><strong>Reference No:</strong> ${referenceNo}</p>` : ''}
                ${deliveryNote ? `<p><strong>Delivery Note:</strong> ${deliveryNote}</p>` : ''}
            </div>
            
            <div class="info-box">
                <h4>Company Details</h4>
                <p><strong>${companyName}</strong></p>
                <p>${companyAddress.replace(/\n/g, '<br>')}</p>
                <p><strong>GSTIN/UIN:</strong> ${companyGSTIN}</p>
                <p><strong>State:</strong> ${companyState}</p>
            </div>
        </div>
        
        <div class="info-box">
            <h4>Buyer Details (Bill To)</h4>
            <p><strong>${buyerName}</strong></p>
            <p>${buyerAddress.replace(/\n/g, '<br>')}</p>
            <p><strong>GSTIN/UIN:</strong> ${buyerGSTIN}</p>
            <p><strong>State:</strong> ${buyerState}</p>
        </div>
        
        <div class="invoice-items">
            <table>
                <thead>
                    <tr>
                        <th>Sl</th>
                        <th>Description of Goods</th>
                        <th>HSN/SAC</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        
        <div class="invoice-totals">
            <div class="totals-table">
                <table>
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="amount">₹ ${subtotal.toFixed(2)}</td>
                    </tr>
                    ${cgstRate > 0 ? `
                    <tr>
                        <td class="label">CGST (${cgstRate}%)</td>
                        <td class="amount">₹ ${cgstAmount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${sgstRate > 0 ? `
                    <tr>
                        <td class="label">SGST (${sgstRate}%)</td>
                        <td class="amount">₹ ${sgstAmount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${igstRate > 0 ? `
                    <tr>
                        <td class="label">IGST (${igstRate}%)</td>
                        <td class="amount">₹ ${igstAmount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td class="label">Total Amount</td>
                        <td class="amount">₹ ${grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="invoice-footer">
            <div class="amount-in-words">
                <strong>Amount in Words:</strong> ${amountInWords}
            </div>
            
            <div style="border: 2px solid #dc3545; padding: 6px 8px; margin: 8px 0; background: #fff5f5;">
                <h4 style="color: #dc3545; margin: 0 0 5px 0; font-size: 0.85em;">Bank Details</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 0.75em;">
                    <p style="margin: 2px 0;"><strong>BANK:</strong> ${bankName}</p>
                    <p style="margin: 2px 0;"><strong>BRANCH:</strong> ${branchName}</p>
                    <p style="margin: 2px 0;"><strong>A/C NO:</strong> ${accountNo}</p>
                    <p style="margin: 2px 0;"><strong>IFSC:</strong> ${ifscCode}</p>
                </div>
            </div>
            
            <div class="signature-section">
                <p style="font-size: 0.85em;"><strong>For ${companyName}</strong></p>
                ${signatureImage ? `<img src="${signatureImage}" alt="Signature" style="max-width: 150px; height: auto; margin: 12px 0;">` : '<div style="height: 40px; margin: 12px 0;"></div>'}
                <div class="signature-line">${signatoryName || 'Authorized Signatory'}</div>
            </div>
        </div>        </div>    `;

    // Display invoice preview
    document.getElementById('invoiceDocument').innerHTML = invoiceHTML;
    document.getElementById('invoiceForm').style.display = 'none';
    document.getElementById('invoicePreview').style.display = 'block';

    // Scroll to top
    window.scrollTo(0, 0);
}

// Convert number to words (Indian Rupees)
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero Rupees Only';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = Math.floor(num % 100);
    const paise = Math.round((num - Math.floor(num)) * 100);

    let words = '';

    if (crore > 0) {
        words += convertTwoDigit(crore) + ' Crore ';
    }

    if (lakh > 0) {
        words += convertTwoDigit(lakh) + ' Lakh ';
    }

    if (thousand > 0) {
        words += convertTwoDigit(thousand) + ' Thousand ';
    }

    if (hundred > 0) {
        words += ones[hundred] + ' Hundred ';
    }

    if (remainder > 0) {
        if (remainder < 10) {
            words += ones[remainder] + ' ';
        } else if (remainder < 20) {
            words += teens[remainder - 10] + ' ';
        } else {
            words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10] + ' ';
        }
    }

    words += 'Rupees';

    if (paise > 0) {
        words += ' and ' + convertTwoDigit(paise) + ' Paise';
    }

    words += ' Only';

    return words.trim();
}

function convertTwoDigit(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num < 10) {
        return ones[num];
    } else if (num < 20) {
        return teens[num - 10];
    } else {
        return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
    }
}

// Edit invoice (go back to form)
function editInvoice() {
    document.getElementById('invoiceForm').style.display = 'block';
    document.getElementById('invoicePreview').style.display = 'none';
}

// Print invoice
function printInvoice() {
    window.print();
}

// Save as PDF
function saveAsPDF() {
    const buyerName = document.getElementById('buyerName').value.trim();
    const invoiceNo = document.getElementById('invoiceNo').value.trim();
    const invoiceDate = document.getElementById('invoiceDate').value;
    const grandTotal = document.getElementById('invoiceDocument').querySelector('.total-row .amount').textContent.replace('₹ ', '');

    // Save to localStorage
    saveInvoiceToHistory({
        invoiceNo,
        buyerName,
        invoiceDate,
        amount: grandTotal,
        html: document.getElementById('invoiceDocument').innerHTML
    });

    const safeFilename = `${buyerName.replace(/[^a-zA-Z0-9]/g, '_')}_${invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    // Auto-save to server
    fetch('/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            html: document.getElementById('invoiceDocument').innerHTML,
            filename: safeFilename
        })
    }).then(response => response.json())
        .then(data => console.log('Server response:', data))
        .catch(err => console.error('Error saving to server:', err));

    const filename = safeFilename;

    // Set document title to desired filename
    const originalTitle = document.title;
    document.title = filename.replace('.pdf', '');

    // Trigger print dialog
    window.print();

    // Restore original title after a delay
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
}

function saveInvoiceToHistory(invoiceData) {
    let history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
    // Check if invoice already exists to prevent duplicates
    const index = history.findIndex(inv => inv.invoiceNo === invoiceData.invoiceNo);
    if (index !== -1) {
        history[index] = invoiceData;
    } else {
        history.push(invoiceData);
    }
    localStorage.setItem('invoice_history', JSON.stringify(history));
}

// Reset form
function resetForm() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
        document.getElementById('invoiceForm').reset();
        document.getElementById('itemsBody').innerHTML = '';
        generateInvoiceNumber();
        setTodayDate();
        addItem();
    }
}
