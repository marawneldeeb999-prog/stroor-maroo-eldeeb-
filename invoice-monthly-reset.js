const invoiceResetDate = new Date();
const invoiceResetDayKey = `${invoiceResetDate.getFullYear()}-${invoiceResetDate.getMonth() + 1}-${invoiceResetDate.getDate()}`;
const invoiceResetMonthKey = `${invoiceResetDate.getFullYear()}-${invoiceResetDate.getMonth() + 1}`;
const previousInvoiceMonthKey = localStorage.getItem('invoiceStorageMonth');

function getInvoiceMonthKey(invoice) {
    if (invoice.monthKey) return invoice.monthKey;
    if (Number.isFinite(invoice.timestamp)) {
        const date = new Date(invoice.timestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
    }
    return null;
}

function getInvoiceDayKey(invoice) {
    if (invoice.dayKey) return invoice.dayKey;
    if (Number.isFinite(invoice.timestamp)) {
        const date = new Date(invoice.timestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    return null;
}

const invoicesForReset = previousInvoiceMonthKey && previousInvoiceMonthKey !== invoiceResetMonthKey
    ? []
    : JSON.parse(localStorage.getItem('invoices') || '[]')
        .filter(invoice => getInvoiceMonthKey(invoice) === invoiceResetMonthKey)
        .map(invoice => ({
            ...invoice,
            items: Array.isArray(invoice.items) ? invoice.items.map(item => ({
                title: String(item.title || ''),
                qty: Number(item.qty) || 0,
                price: Number(item.price) || 0
            })) : []
        }));

localStorage.removeItem('dailyInvoices');
localStorage.removeItem('monthlyInvoices');
localStorage.setItem('invoices', JSON.stringify(invoicesForReset));
localStorage.setItem('invoiceDataVersion', '3');
localStorage.setItem('invoiceStorageMonth', invoiceResetMonthKey);
