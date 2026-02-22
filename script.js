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

document.addEventListener('DOMContentLoaded', () => {
    populateInventoryDatalist();
});

// Populate the datalist from INVENTORY_LIST
function populateInventoryDatalist() {
    const datalist = document.getElementById('inventoryData');
    if (!datalist) return;

    INVENTORY_LIST.forEach(item => {
        // Option with Full String for matching
        const option = document.createElement('option');
        option.value = `${item.code} - ${item.description}`;
        datalist.appendChild(option);

        // Separate option for just code if needed for quick search
        const optionCode = document.createElement('option');
        optionCode.value = item.code;
        datalist.appendChild(optionCode);

        // Separate option for just description
        const optionDesc = document.createElement('option');
        optionDesc.value = item.description;
        datalist.appendChild(optionDesc);
    });
}

// Add new item row
function addItem() {
    const itemsBody = document.getElementById('itemsBody');
    const rowCount = itemsBody.rows.length + 1;

    const row = itemsBody.insertRow();
    row.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <input type="text" class="item-desc" list="inventoryData" placeholder="Search code or name..." oninput="handleItemSelection(this)">
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
                <td style="text-align: left;">${desc}</td>
                <td>${hsn}</td>
                <td>${qty}</td>
                <td class="amount">${rate}</td>
                <td class="amount">${amount}</td>
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
        <div class="invoice-header" style="background: white; color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
            <div style="display: flex; align-items: start; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="company-logo" style="width: 80px; height: 80px; border: 2px solid #dc3545;">
                        <img src="smart_logo.png" style="width: 100%; height: 100%; border-radius: 50%;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-weight: 900; color: #dc3545; flex-direction: column; line-height: 1;">
                            <span style="font-size: 24px;">S E</span>
                        </div>
                    </div>
                    <div>
                        <h1 style="margin: 0; font-size: 2.2em; color: #dc3545; font-weight: 900; letter-spacing: 2px;">${companyName}</h1>
                        <p style="margin: 2px 0; font-size: 0.9em; font-weight: 700; color: #333;">MANUFACTURING & SUPPLIERS</p>
                        <p style="margin: 0; font-size: 0.65em; font-weight: 600; line-height: 1.2; max-width: 450px;">${companyBusiness}</p>
                    </div>
                </div>
                <div style="text-align: right; font-size: 0.75em;">
                    <p style="margin: 2px 0;">411, Subhash Nagar, M.I.D.C. Road, Airoli, Navi Mumbai - 400 708.</p>
                    <p style="margin: 2px 0;">Mob.: ${companyMobile}</p>
                    <p style="margin: 2px 0;">E-mail : ${companyEmail}</p>
                    <p style="margin: 2px 0; font-weight: 700;">GSTIN : ${companyGSTIN}</p>
                </div>
            </div>
            <div style="text-align: center; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; margin-top: 10px; padding: 4px 0;">
                <h3 style="margin: 0; letter-spacing: 4px; font-weight: 900; font-size: 1.1em;">TAX INVOICE</h3>
            </div>
        </div>
        
        <div class="invoice-info-grid" style="margin-top: 10px;">
            <div class="info-box">
                <p><strong>M/s.</strong> ${buyerName}</p>
                <p>${buyerAddress.replace(/\n/g, '<br>')}</p>
                <p><strong>GSTIN:</strong> ${buyerGSTIN}</p>
                <p><strong>State:</strong> ${buyerState}</p>
            </div>
            <div class="info-box">
                <p><strong>Invoice No.:</strong> ${invoiceNo}</p>
                <p><strong>Invoice Date:</strong> ${formattedDate}</p>
                <p><strong>Challan No.:</strong> ${challanNumber}</p>
                ${referenceNo ? `<p><strong>P.O. Date:</strong> ${referenceNo}</p>` : ''}
            </div>
        </div>
        
        <div class="invoice-items" style="margin-top: 15px;">
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">Sr. No.</th>
                        <th>Product Description</th>
                        <th style="width: 80px;">HSN CODE</th>
                        <th style="width: 70px;">QUANTITY</th>
                        <th style="width: 100px;">RATE Rs.</th>
                        <th style="width: 120px;">TOTAL AMOUNT Rs.</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        
        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; margin-top: 15px;">
            <div>
                <p style="font-size: 0.75em; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment within................Days.</p>
                <div style="margin-top: 10px;">
                    <p style="font-size: 0.8em; margin-bottom: 5px;"><strong>Rs. in words:</strong> ${amountInWords}</p>
                </div>
                <div style="margin-top: 15px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; font-size: 0.75em;">
                    <h4 style="margin: 0 0 5px 0; color: #dc3545; border-bottom: 1px solid #eee;">Bank Details</h4>
                    <p><strong>BANK :</strong> ${bankName}</p>
                    <p><strong>BRANCH :</strong> ${branchName}</p>
                    <p><strong>Current A/c No.:</strong> ${accountNo}</p>
                    <p><strong>IFSC CODE:</strong> ${ifscCode}</p>
                </div>
                <div style="margin-top: 15px; font-size: 0.65em; line-height: 1.4;">
                    <strong style="text-decoration: underline; color: #dc3545;">Term & Conditions :</strong><br>
                    1) Responsibility ceases on delivery of goods at registration of.........in Mumbai.<br>
                    2) Interest @24% p.a. Added monthly to accounts unpaid on month after delivery.<br>
                    3) Goods once sold will not be taken back.<br>
                    4) GST tax will be charged extra if applicable.<br>
                    5) All rate are extra.<br>
                    6) Subject to Mumbai Jurisdiction.
                </div>
            </div>
            
            <div class="totals-table">
                <table>
                    <tr>
                        <td class="label">Total Amount before Tax</td>
                        <td class="amount">₹ ${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">SGST ${sgstRate}%</td>
                        <td class="amount">₹ ${sgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="label">CGST ${cgstRate}%</td>
                        <td class="amount">₹ ${cgstAmount.toFixed(2)}</td>
                    </tr>
                    ${igstRate > 0 ? `
                    <tr>
                        <td class="label">IGST ${igstRate}%</td>
                        <td class="amount">₹ ${igstAmount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row" style="background: #dc3545; color: white;">
                        <td class="label">Total Amount After Tax</td>
                        <td class="amount">₹ ${grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
                
                <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 40px; position: relative;">
                    ${signatureImage ? `<img src="${signatureImage}" style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); max-width: 120px;">` : ''}
                    <p style="font-size: 0.7em; font-weight: bold;">Certified that the particulars given above are true and correct.</p>
                    <p style="margin-top: 5px; font-weight: 900; font-size: 0.85em;">For ${companyName}</p>
                    <div style="margin-top: 30px; font-size: 0.75em; border-top: 1px dashed #333; display: inline-block; padding-top: 5px; min-width: 150px;">
                        ${signatoryName || 'Authorized Signatory'}
                    </div>
                </div>
            </div>
        </div>
    `;

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
        localStorage.setItem('invoice_history', JSON.stringify(history));
        loadHistory();
    }
}

// Handle auto-formatting when an item is selected from datalist
function handleItemSelection(input) {
    const val = input.value;
    const items = INVENTORY_LIST.filter(item =>
        item.code === val ||
        item.description === val ||
        `${item.code} - ${item.description}` === val
    );

    if (items.length > 0) {
        // Auto-format to "Code - Description" for clarity
        input.value = `${items[0].code} - ${items[0].description}`;
    }
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
