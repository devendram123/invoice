function convertTwoDigit(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    num = Math.floor(num);
    if (num < 10) {
        return ones[num];
    } else if (num < 20) {
        return teens[num - 10];
    } else {
        const t = tens[Math.floor(num / 10)];
        const o = ones[num % 10];
        return (t + (o ? ' ' + o : '')).trim();
    }
}

export function numberToWords(num) {
    num = parseFloat(num) || 0;
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero Rupees Only';

    const integerPart = Math.floor(num);
    const crore = Math.floor(integerPart / 10000000);
    const lakh = Math.floor((integerPart % 10000000) / 100000);
    const thousand = Math.floor((integerPart % 100000) / 1000);
    const hundred = Math.floor((integerPart % 1000) / 100);
    const remainder = Math.floor(integerPart % 100);
    const paise = Math.round((num - integerPart) * 100);

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
            const t = tens[Math.floor(remainder / 10)];
            const o = ones[remainder % 10];
            words += (t + (o ? ' ' + o : '')) + ' ';
        }
    }

    words = words.trim() + ' Rupees';

    if (paise > 0) {
        words += ' and ' + convertTwoDigit(paise) + ' Paise';
    }

    words += ' Only';

    return words.replace(/\s+/g, ' ').trim();
}
