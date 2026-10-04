const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
const dailyInvoices = invoices.filter(inv => inv.dayKey === todayKey);
const monthlyInvoices = invoices.filter(inv => inv.monthKey === currentMonthKey);

const orderList = document.getElementById('customerOrdersList');
const invoiceModal = document.getElementById('invoiceModal');
const invoicePaperContent = document.getElementById('invoicePaperContent');
const printCustomerInvoiceButton = document.getElementById('printCustomerInvoice');
const darkModeToggle = document.getElementById('darkModeToggle');
let selectedInvoice = null;

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderInvoiceStats() {
    const stats = [
        { list: invoices, count: 'allInvoiceCount', profit: 'allInvoiceProfit' },
        { list: dailyInvoices, count: 'dayInvoiceCount', profit: 'dayInvoiceProfit' },
        { list: monthlyInvoices, count: 'monthInvoiceCount', profit: 'monthInvoiceProfit' }
    ];
    stats.forEach(stat => {
        const total = stat.list.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
        document.getElementById(stat.count).innerText = `${stat.list.length} فاتورة`;
        document.getElementById(stat.profit).innerText = `$${total}`;
    });
}

function getPaymentMethodLabel(method) {
    if (!method) return 'غير محددة';
    if (method.includes('كاش')) return 'فودافون كاش';
    if (method.includes('فيزا') || method.includes('بطاقة')) return 'فيزا / ماستر كارد';
    return method;
}

function renderOrders(invoiceList) {
    orderList.innerHTML = '';
    if (invoiceList.length === 0) {
        orderList.innerHTML = '<p style="color:gray; text-align:center; padding:20px;">لا توجد فواتير في هذه الفترة.</p>';
        return;
    }

    invoiceList.forEach(inv => {
        const invoiceItems = inv.items || [];
        let itemsList = invoiceItems.map(i => `${i.title} (×${i.qty})`).join('، ');
        orderList.insertAdjacentHTML('beforeend', `
            <div class="past-order-item">
                <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:8px;">
                    <span>طلب رقم: #${inv.id}</span><span>${inv.date}</span>
                </div>
                <div style="font-size:14px; color:var(--text-muted);">الملابس: ${itemsList}</div>
                <div style="margin-top:8px; font-weight:bold; color:var(--accent);">إجمالي الطلب: $${inv.total}</div>
                <div style="margin-top:4px;">وسيلة الدفع: ${getPaymentMethodLabel(inv.method)}</div>
                <div style="margin-top:4px;">حالة الدفع: ${inv.paymentStatus || 'بانتظار التأكيد اليدوي'}</div>
                <button class="view-invoice-btn" type="button" onclick="showInvoice(${inv.id})"><i class="fas fa-receipt"></i> عرض الفاتورة</button>
            </div>
        `);
    });
}

if(invoices.length > 0) {
    const lastInv = invoices[invoices.length - 1];
    const customerName = document.getElementById('cName');
    const customerPhone = document.getElementById('cPhone');
    const customerAddress = document.getElementById('cAddress');
    if (customerName) customerName.innerText = lastInv.name;
    if (customerPhone) customerPhone.innerText = "الهاتف: " + lastInv.phone;
    if (customerAddress) customerAddress.innerText = "العنوان الافتراضي المسجل للشحن: " + lastInv.address;

    renderOrders(invoices);
} else {
    renderOrders([]);
}

if (invoiceModal && invoicePaperContent) {
    document.querySelectorAll('[data-close-invoice]').forEach(button => button.addEventListener('click', closeInvoice));
}

renderInvoiceStats();

document.querySelectorAll('.invoice-filter').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.invoice-filter').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        const lists = { all: invoices, day: dailyInvoices, month: monthlyInvoices };
        renderOrders(lists[button.dataset.filter] || []);
        orderList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});

window.showInvoice = function(id) {
    const invoice = invoices.find(item => item.id === id);
    if (!invoice) return;

    selectedInvoice = invoice;
    const rows = (invoice.items || []).map(item => `
        <tr>
            <td>${escapeHTML(item.title)}</td>
            <td>${item.qty}</td>
            <td>$${item.price}</td>
            <td>$${item.price * item.qty}</td>
        </tr>
    `).join('');

    invoicePaperContent.innerHTML = `
        <div class="invoice-paper-heading">
            <div>
                <p class="invoice-eyebrow">Alaa & Marwan Store</p>
                <h2 id="invoiceModalTitle">فاتورة شراء</h2>
            </div>
            <i class="fas fa-receipt invoice-paper-icon"></i>
        </div>
        <div class="invoice-meta">
            <span><strong>رقم الفاتورة:</strong> #${invoice.id}</span>
            <span><strong>التاريخ:</strong> ${invoice.date}</span>
            <span><strong>العميل:</strong> ${invoice.name}</span>
            <span><strong>الهاتف:</strong> ${invoice.phone}</span>
            <span class="invoice-address"><strong>العنوان:</strong> ${escapeHTML(invoice.address)}</span>
            <span><strong>وسيلة الدفع:</strong> ${escapeHTML(getPaymentMethodLabel(invoice.method))}</span>
            <span><strong>حالة الدفع:</strong> ${escapeHTML(invoice.paymentStatus || 'بانتظار التأكيد اليدوي')}</span>
            <span><strong>وسيلة التوصيل:</strong> ${escapeHTML(invoice.deliveryMethod || 'غير محددة')}</span>
            <span><strong>مسؤول التوصيل:</strong> ${escapeHTML(invoice.deliveryPerson || 'غير محدد')}</span>
        </div>
        <table class="invoice-paper-table">
            <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="invoice-breakdown">
            <div><span>المجموع الفرعي</span><strong>$${Number(invoice.subTotal || 0)}</strong></div>
            <div><span>الضريبة</span><strong>$${Number(invoice.tax || 0)}</strong></div>
            <div><span>رسوم التوصيل</span><strong>$${Number(invoice.shipping || 0)}</strong></div>
        </div>
        <div class="invoice-total-box">
            <span>الإجمالي النهائي</span>
            <strong>$${invoice.total}</strong>
        </div>
    `;
    invoiceModal.hidden = false;
    document.body.classList.add('invoice-open');
};

function closeInvoice() {
    invoiceModal.hidden = true;
    document.body.classList.remove('invoice-open');
    selectedInvoice = null;
}

document.querySelectorAll('[data-close-invoice]').forEach(button => button.addEventListener('click', closeInvoice));
printCustomerInvoiceButton.addEventListener('click', () => {
    if (selectedInvoice) window.print();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !invoiceModal.hidden) closeInvoice();
});

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
if (darkModeToggle) {
    darkModeToggle.onclick = function() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    };
}

if (sessionStorage.getItem('openLatestInvoice') === 'true') {
    sessionStorage.removeItem('openLatestInvoice');
    const latestInvoiceId = Number(sessionStorage.getItem('latestInvoiceId'));
    sessionStorage.removeItem('latestInvoiceId');
    const invoiceToOpen = invoices.find(inv => inv.id === latestInvoiceId) || invoices[invoices.length - 1];
    if (invoiceToOpen) window.showInvoice(invoiceToOpen.id);
}
