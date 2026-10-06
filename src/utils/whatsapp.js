/**
 * Utility to format and share invoice details via WhatsApp
 */

export function generateWhatsAppMessage({
    invoiceNo,
    companyName,
    buyerName,
    invoiceDate,
    amount,
    pdfUrl
}) {
    const formattedDate = invoiceDate
        ? new Date(invoiceDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
          })
        : 'N/A';

    return (
        `🧾 *TAX INVOICE: ${invoiceNo}*\n` +
        `🏢 *From:* ${companyName || 'SMART ENGINEERING'}\n` +
        `👤 *Buyer:* ${buyerName || 'Valued Customer'}\n` +
        `📅 *Date:* ${formattedDate}\n` +
        `💰 *Total Amount:* ₹ ${amount}\n\n` +
        `📄 *Download PDF:* ${pdfUrl}\n\n` +
        `Thank you for your business!`
    );
}

export function getWhatsAppShareUrl({
    phone,
    message
}) {
    let cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '') : '';
    // If standard 10 digit Indian number without country code, prepend 91
    if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(message);
    if (cleanPhone) {
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
    return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export async function shareOnWhatsApp({
    invoiceNo,
    companyName,
    buyerName,
    invoiceDate,
    amount,
    pdfUrl,
    phone
}) {
    const message = generateWhatsAppMessage({
        invoiceNo,
        companyName,
        buyerName,
        invoiceDate,
        amount,
        pdfUrl
    });

    const shareUrl = getWhatsAppShareUrl({ phone, message });

    // Open WhatsApp URL directly (works seamlessly on mobile Chrome and desktop)
    window.open(shareUrl, '_blank');
}
