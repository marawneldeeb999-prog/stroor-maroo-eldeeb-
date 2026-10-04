let products = JSON.parse(localStorage.getItem('products')) || [];
let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
const categoryOrder = ['رجال', 'شبابي', 'نساء', 'أطفال'];

const loginOverlay = document.getElementById('loginOverlay');
const adminContent = document.getElementById('adminContent');
const validUsers = { marwan: '123', مروان: '123', عبير: '456', ايسل: '787' };

loginOverlay.style.display = 'flex';
adminContent.style.display = 'none';

document.getElementById('adminLoginForm').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;
    if (validUsers[username] && validUsers[username] === password) {
        loginOverlay.style.display = 'none'; adminContent.style.display = 'block'; updateDashboard();
    } else { alert('بيانات المدير خاطئة!'); }
};

document.getElementById('logoutBtn').onclick = function() { window.location.reload(); };

function updateDashboard() {
    document.getElementById('totalProducts').innerText = products.length;
    document.getElementById('totalOrders').innerText = invoices.length;
    document.getElementById('totalSales').innerText = '$' + invoices.reduce((acc, i) => acc + i.total, 0);

    const pTable = document.getElementById('adminProductsTable'); pTable.innerHTML = '';
    [...products]
        .sort((a, b) => {
            const categoryA = categoryOrder.indexOf(a.category);
            const categoryB = categoryOrder.indexOf(b.category);
            return (categoryA === -1 ? categoryOrder.length : categoryA)
                - (categoryB === -1 ? categoryOrder.length : categoryB);
        })
        .forEach(p => {
            pTable.insertAdjacentHTML('beforeend', `
                <tr>
                    <td data-label="المنتج"><strong>${p.title}</strong>
                    </td>
                    <td data-label="القسم">${p.category}</td>
                    <td data-label="السعر">$${p.price}</td>
                    <td data-label="التحكم">
                        <div class="product-actions">
                            <button class="btn-edit" onclick="editProduct(${p.id})">
                                <i class="fas fa-pen" aria-hidden="true"></i> تعديل
                            </button>
                            <button class="btn-delete" onclick="deleteProduct(${p.id})">
                                <i class="fas fa-trash-alt" aria-hidden="true"></i> حذف
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });

    const oTable = document.getElementById('adminOrdersTable'); oTable.innerHTML = '';
    if(invoices.length === 0) oTable.innerHTML = '<tr><td colspan="9" style="text-align:center; color:gray;">لا توجد طلبات مسجلة بعد.</td></tr>';
    [...invoices].reverse().forEach(inv => {
        const method = inv.method || '';
        const paymentMethod = method.includes('كاش') ? 'فودافون كاش' : method.includes('فيزا') || method.includes('بطاقة') ? 'فيزا' : 'غير محددة';
        const orderDate = Number.isFinite(Number(inv.timestamp))
            ? new Date(Number(inv.timestamp))
            : null;
        const dayText = orderDate && !Number.isNaN(orderDate.getTime())
            ? orderDate.toLocaleDateString('ar-EG', { weekday: 'long' })
            : 'غير محدد';
        const dateText = orderDate && !Number.isNaN(orderDate.getTime())
            ? orderDate.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : inv.date || 'غير محدد';
        const timeText = orderDate && !Number.isNaN(orderDate.getTime())
            ? orderDate.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })
            : 'الوقت غير متوفر';
        oTable.insertAdjacentHTML('beforeend', `<tr><td>#${inv.id}</td><td>${inv.name}</td><td>${inv.phone}</td><td class="admin-payment-cell"><strong>${paymentMethod}</strong><small>${inv.paymentStatus || 'بانتظار التأكيد اليدوي'}</small>
            </td><td>${inv.deliveryMethod || 'غير محددة'}</td><td>${dayText}</td><td>${dateText}</td><td class="admin-order-time">${timeText}</td><td>$${inv.total}</td></tr>`);
    });
}

const imgInput = document.getElementById('pImg');
const fileNameLabel = document.getElementById('fileNameLabel');
const imageDropZone = document.getElementById('imageDropZone');
const imagePreview = document.getElementById('pImgPreview');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const clearImageBtn = document.getElementById('clearImageBtn');
let imagePreviewUrl = '';

function clearImageSelection() {
    imgInput.value = '';
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    imagePreviewUrl = '';
    imagePreview.removeAttribute('src');
    imagePreview.hidden = true;
    imagePlaceholder.hidden = false;
    clearImageBtn.hidden = true;
    fileNameLabel.textContent = 'لم يتم اختيار صورة';
    imageDropZone.classList.remove('has-image', 'is-dragging');
}

function selectProductImage(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        clearImageSelection();
        fileNameLabel.textContent = 'الملف المختار ليس صورة صالحة';
        return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    imagePreviewUrl = URL.createObjectURL(file);
    imagePreview.src = imagePreviewUrl;
    imagePreview.hidden = false;
    imagePlaceholder.hidden = true;
    clearImageBtn.hidden = false;
    fileNameLabel.textContent = file.name;
    imageDropZone.classList.add('has-image');
}

imgInput.addEventListener('change', () => selectProductImage(imgInput.files[0]));
clearImageBtn.addEventListener('click', clearImageSelection);

imageDropZone.addEventListener('dragover', event => {
    event.preventDefault();
    imageDropZone.classList.add('is-dragging');
});
imageDropZone.addEventListener('dragleave', () => imageDropZone.classList.remove('is-dragging'));
imageDropZone.addEventListener('drop', event => {
    event.preventDefault();
    imageDropZone.classList.remove('is-dragging');
    const [file] = event.dataTransfer.files;
    if (!file) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    imgInput.files = transfer.files;
    selectProductImage(file);
});

document.getElementById('addProductForm').onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById('pTitle').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const imgFile = document.getElementById('pImg').files[0];
    const desc = document.getElementById('pDesc').value.trim();

    if (title.length < 3) { alert("اسم المنتج قصير!"); return; }
    if (isNaN(price) || price <= 0) { alert("أدخل سعر صحيح!"); return; }
    if (!imgFile) { alert("اختر صورة المنتج من الجهاز أولاً!"); return; }

    const reader = new FileReader();
    reader.onload = function () {
        products.push({
            id: Date.now(),
            title,
            price,
            category: document.getElementById('pCategory').value,
            image: reader.result,
            description: desc
        });

        localStorage.setItem('products', JSON.stringify(products));
        document.getElementById('addProductForm').reset();
        clearImageSelection();
        updateDashboard();
        alert("تم إضافة القطعة ومزامنتها بنجاح!");
    };

    reader.readAsDataURL(imgFile);
};

window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newTitle = prompt('أدخل الاسم الجديد للمنتج:', product.title);
    if (newTitle === null) return;


    const newDescription = prompt('أدخل وصف المنتج الجديد:', product.description || '');
    if (newDescription === null) return;

    const newPriceInput = prompt('أدخل السعر الجديد بالدولار:', product.price);
    if (newPriceInput === null) return;

    const newPrice = Number(newPriceInput);
    if (!newTitle.trim() || newTitle.trim().length < 2) {
        alert('اسم المنتج غير صحيح!');
        return;
    }

    if (Number.isNaN(newPrice) || newPrice <= 0) {
        alert('السعر غير صحيح!');
        return;
    }

    if (!newDescription.trim()) {
        alert('وصف المنتج لا يمكن أن يكون بدون وصف!');
        return;
    }

    product.title = newTitle.trim();
    product.price = newPrice;
    product.description = newDescription.trim();
    localStorage.setItem('products', JSON.stringify(products));
    updateDashboard();
    alert('تم تعديل اسم المنتج والسعر والوصف بنجاح!');
};

window.deleteProduct = function(id) {
    if(confirm("هل تريد حذف القطعة نهائياً؟")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        updateDashboard();
    }
};

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
document.getElementById('darkModeToggle').onclick = function() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
};