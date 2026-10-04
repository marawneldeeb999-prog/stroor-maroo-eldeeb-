
function readStoredArray(storage, key) {
    const rawValue = storage.getItem(key);
    if (!rawValue) return [];

    try {
        const value = JSON.parse(rawValue);
        if (Array.isArray(value)) return value;
        console.error(`Stored value "${key}" is not an array.`);
    } catch (error) {
        console.error(`Could not parse stored value "${key}".`, error);
    }
    return [];
}

function compactInvoice(invoice) {
    return {
        ...invoice,
        items: Array.isArray(invoice.items) ? invoice.items.map(item => ({
            title: String(item.title || ''),
            qty: Number(item.qty) || 0,
            price: Number(item.price) || 0
        })) : []
    };
}

let cart = readStoredArray(localStorage, 'cart');
const checkoutCartSnapshot = readStoredArray(sessionStorage, 'checkoutCart');
if (cart.length === 0 &&
    Array.isArray(checkoutCartSnapshot) && checkoutCartSnapshot.length > 0) {
    cart = checkoutCartSnapshot;
    localStorage.setItem('cart', JSON.stringify(cart));
}
sessionStorage.removeItem('checkoutCart');
let invoices = readStoredArray(localStorage, 'invoices').map(compactInvoice);
localStorage.removeItem('dailyInvoices');
localStorage.removeItem('monthlyInvoices');
try {
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('invoiceDataVersion', '3');
} catch (error) {
    console.error('Could not compact saved invoices:', error);
}
let selectedMethod = "Visa";

const paymentOptions = document.querySelectorAll('.payment-option');
const visaFields = document.getElementById('visaFields');
const vodafoneFields = document.getElementById('vodafoneFields');
const checkoutSummaryList = document.getElementById('checkoutSummaryList');
const subTotalEl = document.getElementById('subTotal');
const taxTotalEl = document.getElementById('taxTotal');
const checkoutTotal = document.getElementById('checkoutTotal');
const deliveryFeeEl = document.getElementById('deliveryFee');
const checkoutForm = document.getElementById('checkoutForm');
const submitOrderButton = document.getElementById('submitOrderButton');
const checkoutSteps = document.querySelectorAll('.checkout-step');
const invoiceResult = document.getElementById('invoiceResult');
const checkoutInvoiceContent = document.getElementById('checkoutInvoiceContent');
const checkoutFeedback = document.getElementById('checkoutFeedback');
const printCheckoutInvoiceButton = document.getElementById('printCheckoutInvoice');
const closeCheckoutInvoiceButton = document.getElementById('closeCheckoutInvoice');
const contactFrameForCheckout = document.getElementById('contactFrame');
const deliveryMethodFrame = document.getElementById('deliveryMethodFrame');
const paymentCardFrameForCheckout = document.getElementById('paymentCardFrame');
let selectedDeliveryPerson = 'مروان';
let selectedDeliveryMethod = 'سيارة';
let selectedDeliveryRate = 7;
let cardNumberValue = '';
let cardExpiryValue = '';
let cardCvvValue = '';
const vfPhoneInput = document.getElementById('vfPhone');
const customerNavLink = document.getElementById('customerNavLink');
const adminNavLink = document.getElementById('adminNavLink');

const safeFrameSource = frame => (frame && frame.contentWindow ? frame.contentWindow : null);

window.addEventListener('message', event => {
    if (!event.data) return;
    const contactSource = safeFrameSource(contactFrameForCheckout);
    const deliverySource = safeFrameSource(deliveryMethodFrame);
    const paymentCardSource = safeFrameSource(paymentCardFrameForCheckout);

    if (event.source === contactSource &&
        event.data.type === 'selected-delivery-person' &&
        ['مروان', 'عبير', 'ايسل', 'المحل'].includes(event.data.value)) {
        selectedDeliveryPerson = event.data.value;
    } else if (event.source === deliverySource &&
        event.data.type === 'delivery-method-selected' &&
        ['سيارة', 'دراجة نارية'].includes(event.data.value) &&
        [5, 7].includes(event.data.fee)) {
        selectedDeliveryMethod = event.data.value;
        selectedDeliveryRate = event.data.fee;
        renderSummary();
    } else if (event.source === deliverySource &&
        event.data.type === 'delivery-method-frame-height' &&
        Number.isFinite(event.data.height)) {
        if (deliveryMethodFrame) deliveryMethodFrame.style.height = `${event.data.height}px`;
    } else if (event.source === paymentCardSource &&
        event.data.type === 'payment-card-data' &&
        typeof event.data.cardNumber === 'string' &&
        typeof event.data.expiry === 'string' &&
        typeof event.data.cvv === 'string') {
        cardNumberValue = event.data.cardNumber;
        cardExpiryValue = event.data.expiry;
        cardCvvValue = event.data.cvv;
    } else if (event.source === paymentCardSource &&
        event.data.type === 'payment-card-frame-height' &&
        Number.isFinite(event.data.height)) {
        if (paymentCardFrameForCheckout) paymentCardFrameForCheckout.style.height = `${event.data.height}px`;
    }
});

if (sessionStorage.getItem('storeUser')) {
    if (customerNavLink) customerNavLink.style.display = 'inline';
    if (adminNavLink) adminNavLink.style.display = 'inline';
}

function updatePaymentFields() {
    if (!visaFields || !vodafoneFields || !vfPhoneInput) return;
    const isVisa = selectedMethod === 'Visa';
    visaFields.style.display = isVisa ? 'block' : 'none';
    vodafoneFields.style.display = isVisa ? 'none' : 'block';
    vfPhoneInput.required = !isVisa;
}

function showCheckoutFeedback(message) {
    if (!checkoutFeedback) return;
    checkoutFeedback.textContent = message;
    checkoutFeedback.hidden = false;
}

function focusCheckoutStep(step) {
    const target = document.getElementById(step.dataset.target);
    checkoutSteps.forEach(item => {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
    });
    step.classList.add('active');
    step.setAttribute('aria-current', 'step');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

checkoutSteps.forEach(step => {
    step.addEventListener('click', () => focusCheckoutStep(step));
});

paymentOptions.forEach(opt => {
    opt.onclick = function() {
        paymentOptions.forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        selectedMethod = this.getAttribute('data-method');
        updatePaymentFields();
    }
});

function renderSummary() {
    checkoutSummaryList.innerHTML = '';
    if(cart.length === 0) {
        checkoutSummaryList.innerHTML = `
            <div class="empty-cart-message">
                <p>لا توجد منتجات في السلة حاليًا.</p>
                <a class="btn-return-store" href="index.html?showProducts=1#productsGrid">اذهب إلى المعرض لشراء المنتجات</a>
            </div>
        `;
        submitOrderButton.disabled = false;
        submitOrderButton.title = 'يجب إضافة منتج أولاً';
        subTotalEl.innerText = '$0';
        deliveryFeeEl.innerText = '$0';
        taxTotalEl.innerText = '$0';
        checkoutTotal.innerText = '0';
        return;
    }
    submitOrderButton.disabled = false;
    submitOrderButton.title = 'تسجيل الطلب';
    cart.forEach(item => {
        checkoutSummaryList.insertAdjacentHTML('beforeend', `<div class="checkout-summary-item"><span>${item.title} (×${item.qty})</span><span>$${item.price * item.qty}</span></div>`);
    });
    const sub = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const tax = Math.round(sub * 0.14);
    const deliveryCost = Math.round((sub * selectedDeliveryRate) / 100);
    subTotalEl.innerText = "$" + sub;
    deliveryFeeEl.innerText = "$" + deliveryCost;
    taxTotalEl.innerText = "$" + tax;
    checkoutTotal.innerText = sub + tax + 5 + deliveryCost;
}

function escapeInvoiceText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function showCheckoutInvoice(invoice) {
    const items = invoice.items.map(item => `
        <tr>
            <td>${escapeInvoiceText(item.title)}</td>
            <td>${Number(item.qty)}</td>
            <td>$${Number(item.price)}</td>
            <td>$${Number(item.price) * Number(item.qty)}</td>
        </tr>
    `).join('');

    checkoutInvoiceContent.innerHTML = `
        <div class="checkout-invoice-card">
            <div class="checkout-invoice-heading">
                <div>
                    <p class="checkout-invoice-brand">Alaa &amp; Marwan Store</p>
                    <h3>فاتورة شراء</h3>
                </div>
                <i class="fas fa-receipt checkout-invoice-icon" aria-hidden="true"></i>
            </div>

            <div class="checkout-invoice-meta">
                <div><strong>رقم الفاتورة:</strong> #${invoice.id}</div>
                <div><strong>التاريخ:</strong> ${escapeInvoiceText(invoice.date)}</div>
                <div><strong>العميل:</strong> ${escapeInvoiceText(invoice.name)}</div>
                <div><strong>الهاتف:</strong> ${escapeInvoiceText(invoice.phone)}</div>
                <div class="full"><strong>العنوان:</strong> ${escapeInvoiceText(invoice.address)}</div>
                <div><strong>وسيلة الدفع:</strong> ${escapeInvoiceText(invoice.method)}</div>
                <div><strong>حالة الدفع:</strong> ${escapeInvoiceText(invoice.paymentStatus)}</div>
                <div><strong>وسيلة التوصيل:</strong> ${escapeInvoiceText(invoice.deliveryMethod)}</div>
                <div><strong>مسؤول التوصيل:</strong> ${escapeInvoiceText(invoice.deliveryPerson || 'غير محدد')}</div>
            </div>

            <div class="checkout-invoice-table-wrap">
                <table class="checkout-invoice-table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>${items}</tbody>
                </table>
            </div>

            <div class="checkout-invoice-summary">
                <div><span>مجموع المنتجات</span><strong>$${Number(invoice.subTotal || 0)}</strong></div>
                <div><span>الضريبة</span><strong>$${Number(invoice.tax || 0)}</strong></div>
                <div><span>رسوم الشحن والتوصيل</span><strong>$${Number(invoice.shipping || 0)}</strong></div>
                <div class="checkout-invoice-total-row"><span>الإجمالي النهائي</span><strong>$${Number(invoice.total || 0)}</strong></div>
            </div>
        </div>
    `;
    invoiceResult.hidden = false;
    invoiceResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function submitCheckoutOrder() {
    if (checkoutFeedback) checkoutFeedback.hidden = true;
    if(cart.length === 0) {
        showCheckoutFeedback("السلة فارغة! أضف منتجًا أولاً قبل تسجيل الطلب.");
        return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const governorate = document.getElementById('custGovernorate').value;
    const city = document.getElementById('custCity').value.trim();
    const street = document.getElementById('custStreet').value.trim();
    const buildingNumber = document.getElementById('custBuilding').value;
    const floorNumber = document.getElementById('custFloor').value;
    const apartmentNumber = document.getElementById('custApartment').value;

    if(name.split(' ').length < 2) { showCheckoutFeedback("يرجى كتابة اسم ثنائي أو ثلاثي."); return; }
    if(!/^01[0125]\d{8}$/.test(phone)) { showCheckoutFeedback("رقم الهاتف المحمول المصري غير صحيح."); return; }
    if(!governorate || city.length < 2 || street.length < 3 || !/^\d+$/.test(buildingNumber) || !/^\d+$/.test(floorNumber) || !/^\d+$/.test(apartmentNumber)) {
        showCheckoutFeedback("يرجى استكمال المحافظة والمدينة والشارع وأرقام المبنى والدور والشقة.");
        return;
    }
    const floorAddress = floorNumber === '0' ? 'الدور الأرضي' : `الدور ${floorNumber}`;
    const address = `محافظة ${governorate}، مدينة ${city}، شارع ${street}، مبنى ${buildingNumber}، ${floorAddress}، شقة ${apartmentNumber}`;

    if(selectedMethod === "Visa") {
        const cardNum = cardNumberValue.replace(/\s/g, '');
        const expiry = cardExpiryValue.trim();
        const cvv = cardCvvValue.trim();
        if(!/^\d{16}$/.test(cardNum)) { showCheckoutFeedback("رقم البطاقة يجب أن يتكون من 16 رقماً."); return; }
        const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
        if(!expiryMatch) { showCheckoutFeedback("تاريخ الانتهاء يجب أن يكون بصيغة MM/YY."); return; }
        const expiryMonth = Number(expiryMatch[1]);
        const expiryYear = 2000 + Number(expiryMatch[2]);
        const now = new Date();
        if(expiryYear < now.getFullYear() || (expiryYear === now.getFullYear() && expiryMonth < now.getMonth() + 1)) {
            showCheckoutFeedback("البطاقة منتهية الصلاحية."); return;
        }
        if(!/^\d{3}$/.test(cvv)) { showCheckoutFeedback("رمز CVV يجب أن يتكون من 3 أرقام."); return; }
    } else {
        const vfPhone = document.getElementById('vfPhone').value.trim();
        if(!/^01[0125]\d{8}$/.test(vfPhone)) { showCheckoutFeedback("رقم محفظة فودافون كاش المحول منها غير صحيح."); return; }
    }

    const sub = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const tax = Math.round(sub * 0.14);
    const deliveryCost = Math.round((sub * selectedDeliveryRate) / 100);
    const selectedPerson = selectedDeliveryPerson;

    const invoiceDate = new Date();
    const dayKey = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth() + 1}-${invoiceDate.getDate()}`;
    const monthKey = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth() + 1}`;
    const newInv = {
        id: Math.floor(100000 + Math.random() * 900000),
        name: name, phone: phone, address: address,
        method: selectedMethod === "Visa" ? "بطاقة (تجريبي)" : "فودافون كاش (بانتظار التأكيد)",
        paymentStatus: 'بانتظار التأكيد اليدوي',
        subTotal: sub, tax: tax, shipping: 5 + deliveryCost, total: (sub + tax + 5 + deliveryCost),
        deliveryPerson: selectedPerson,
        deliveryMethod: selectedDeliveryMethod,
        date: invoiceDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: invoiceDate.getTime(),
        dayKey,
        monthKey,
        items: cart.map(item => ({
            title: String(item.title || ''),
            qty: Number(item.qty) || 0,
            price: Number(item.price) || 0
        }))
    };

    const updatedInvoices = [...invoices, newInv];
    try {
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    } catch (error) {
        console.error('Could not save the order invoice:', error);
        showCheckoutFeedback('تعذر حفظ الفاتورة بسبب امتلاء مساحة المتصفح. احذف بيانات الموقع غير الضرورية ثم حاول مرة أخرى.');
        return;
    }
    invoices = updatedInvoices;
    sessionStorage.setItem('openLatestInvoice', 'true');
    sessionStorage.setItem('latestInvoiceId', String(newInv.id));
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.removeItem('checkoutCart');
    checkoutSteps.forEach(step => step.classList.remove('active'));
    document.querySelector('.step-green').classList.add('active', 'completed');
    checkoutForm.reset();
    renderSummary();
    showCheckoutInvoice(newInv);
}

window.submitCheckoutOrder = submitCheckoutOrder;
window.handleCheckoutButtonClick = function() {
    if (checkoutFeedback) {
        checkoutFeedback.textContent = 'تم الضغط على الزر، جارٍ التحقق من البيانات...';
        checkoutFeedback.hidden = false;
    }
    try {
        submitCheckoutOrder();
    } catch (error) {
        console.error('Checkout order submission failed:', error);
        showCheckoutFeedback(`تعذر إتمام الطلب: ${error.message || 'حدث خطأ غير معروف'}`);
    }
};

checkoutForm.addEventListener('submit', function(e) {
    e.preventDefault();
    submitCheckoutOrder();
});

if (printCheckoutInvoiceButton) {
    printCheckoutInvoiceButton.addEventListener('click', () => window.print());
}
if (closeCheckoutInvoiceButton) {
    closeCheckoutInvoiceButton.addEventListener('click', () => {
        invoiceResult.hidden = true;
    });
}

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.onclick = function() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    };
}

renderSummary();
updatePaymentFields();