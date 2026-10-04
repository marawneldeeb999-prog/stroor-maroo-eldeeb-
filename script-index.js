const defaultProducts = [
    { id: 101, title: "جاكيت كاجوال شتوي رجالي فخم", price: 45, category: "رجال", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500", description: "جاكيت جلدي عصري مبطن مريح للغاية للأجواء شديدة البرودة." },
    { id: 102, title: "هودي قطني مريح باللون الرمادي", price: 25, category: "رجال", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500", description: "هودي مصنوع من القطن الصافي 100% مناسب لليوميات والرياضة المفتوحة." },
    { id: 103, title: "قميص كتان صيفي مريح خفيف", price: 28, category: "رجال", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500", description: "قميص كلاسيكي صيفي رائع ماص للعرق متوفر بكافة المقاسات." },
    { id: 104, title: "بنطلون جينز كلاسيك سليم فيت الأزرق", price: 35, category: "رجال", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500", description: "بنطال جينز مرن جودة عالية ومقاوم للغسيل المتكرر." },
    { id: 105, title: "فستان صيفي أنيق بنقوش زهور الربيع", price: 55, category: "نساء", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500", description: "فستان نسائي ناعم خفيف الوزن، مثالي للنزهات والرحلات المصيفية." },
    { id: 106, title: "بلوزة كلاسيكية رسمية للعمل والمقابلات", price: 30, category: "نساء", image: "https://images.unsplash.com/photo-1548624149-f7b3160321b8?w=500", description: "بلوزة شيفون راقية جداً تناسب بيئات العمل والمناسبات الرسمية." },
    { id: 107, title: "طقم كاجوال عصري تنورة طويلة وقميص", price: 60, category: "نساء", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500", description: "طقم متناسق فريد ومريح جداً للمحجبات وغير المحجبات لإطلالة نهارية ساحرة." },
    { id: 108, title: "معطف شتوي صوف طويل أنيق", price: 85, category: "نساء", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500", description: "بالطو نسائي من الصوف الفاخر للمناسبات الرسمية والشتوية الراقية." },
    { id: 109, title: "طقم أطفال قطني مريح للنوم والبيت", price: 20, category: "أطفال", image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500", description: "طقم بيجامة قطعتين من القطن العضوي المضاد تماماً للحساسية." },
    { id: 110, title: "جاكيت جينز كاجوال عصري للأطفال", price: 35, category: "أطفال", image: "https://images.unsplash.com/photo-1519278470519-c684dd362cee?w=500", description: "جاكيت جينز متين يتحمل اللعب والعبث ويمنح طفلك مظهراً رائعاً." },
    { id: 111, title: "فستان أطفال بناتي للمناسبات والأعياد", price: 40, category: "أطفال", image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500", description: "فستان بناتي منفوش وجميل مبطن من الداخل لحماية بشرة الطفلة." },
    { id: 112, title: "سويت شيرت رياضي مبطن للأولاد", price: 22, category: "أطفال", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500", description: "سويت شيرت عملي بألوان حيوية ممتاز للمدرسة والتمرينات الرياضية." }
];

let products = JSON.parse(localStorage.getItem('products'));
if (!products || products.length === 0) {
    products = defaultProducts;
    localStorage.setItem('products', JSON.stringify(products));
}
let restoredDefaultMenProducts = false;
products.forEach(product => {
    if ([101, 102, 103, 104].includes(product.id) && product.category === "شبابي") {
        product.category = "رجال";
        restoredDefaultMenProducts = true;
    }
});
if (restoredDefaultMenProducts) localStorage.setItem('products', JSON.stringify(products));

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const productsGrid = document.getElementById('productsGrid');
const filterBtns = document.querySelectorAll('.btn-filter');
const cartToggleBtn = document.getElementById('cartToggleBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawerItems = document.getElementById('cartDrawerItems');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartBadge = document.getElementById('cartBadge');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const guestBtn = document.getElementById('guestBtn');
const adminNavLink = document.getElementById('adminNavLink');
const customerNavLink = document.getElementById('customerNavLink');

const validUsers = {
    marwan: '123',
    مروان: '123',
    عبير: '456',
    ايسل: '787'
};

let activeCategory = "الكل";
const categoryOrder = ["رجال", "شبابي", "نساء", "أطفال"];

function handleLoginSuccess(username, password) {
    if (validUsers[username] && validUsers[username] === password) {
        sessionStorage.setItem('storeUser', username);
        adminNavLink.style.display = 'inline';
        customerNavLink.style.display = 'inline';
        loginModal.classList.add('hidden');
    } else {
        const isStoreUserLoggedIn = Boolean(sessionStorage.getItem('storeUser'));
        adminNavLink.style.display = isStoreUserLoggedIn ? 'inline' : 'none';
        customerNavLink.style.display = isStoreUserLoggedIn ? 'inline' : 'none';
        loginModal.classList.toggle('hidden', isStoreUserLoggedIn);
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

sessionStorage.removeItem('storeUser');
adminNavLink.style.display = 'none';
customerNavLink.style.display = 'none';
const openProductsDirectly = new URLSearchParams(window.location.search).get('showProducts') === '1';
loginModal.classList.toggle('hidden', openProductsDirectly);

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();
    handleLoginSuccess(username, password);
});

guestBtn.addEventListener('click', function () {
    sessionStorage.removeItem('storeUser');
    adminNavLink.style.display = 'none';
    customerNavLink.style.display = 'none';
    loginModal.classList.add('hidden');
});

document.querySelectorAll('a[href="checkout.html"]').forEach(link => {
    link.addEventListener('click', () => {
        if (cart.length > 0) {
            sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
        } else {
            sessionStorage.removeItem('checkoutCart');
        }
    });
});

function renderProducts() {
    productsGrid.innerHTML = '';
    const sortedProducts = [...products].sort((a, b) => {
        const categoryA = categoryOrder.indexOf(a.category);
        const categoryB = categoryOrder.indexOf(b.category);
        return (categoryA === -1 ? categoryOrder.length : categoryA)
            - (categoryB === -1 ? categoryOrder.length : categoryB);
    });
    const filtered = sortedProducts.filter(p => {
        return activeCategory === "الكل" || p.category === activeCategory;
    });

    if(filtered.length === 0) {
        productsGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-muted);">عذراً، لم نجد أي قطع ملابس تطابق بحثك الحالي!</p>`;
        return;
    }

    filtered.forEach(p => {
        productsGrid.insertAdjacentHTML('beforeend', `
            <div class="product-card">
                <img src="${p.image}" class="product-img" alt="${p.title}" loading="lazy">
                <div class="product-info">
                    <div>
                        <span class="product-category">${p.category}</span>
                        <h3 class="product-title">${p.title}</h3>
                        <p class="product-desc">${p.description}</p>
                    </div>
                    <div class="product-meta">
                        <span class="product-price">$${p.price}</span>
                        <button class="btn-add-to-cart" onclick="addToCart(${p.id})"><i class="fas fa-cart-plus"></i> إضافة</button>
                    </div>
                </div>
            </div>
        `);
    });
}

filterBtns.forEach(btn => {
    btn.onclick = function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeCategory = this.getAttribute('data-cat');
        renderProducts();
    }
});

cartToggleBtn.onclick = () => { cartDrawer.classList.add('open'); cartOverlay.classList.add('show'); updateCartUI() };
closeCartBtn.onclick = () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('show'); };
cartOverlay.onclick = () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('show'); };

window.addToCart = function(id) {
    const prod = products.find(p => p.id === id);
    const exist = cart.find(item => item.id === id);
    if (exist) { exist.qty += 1; } else { cart.push({ id: prod.id, title: prod.title, price: prod.price, image: prod.image, qty: 1 }); }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('show');
};

window.changeQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if(item) {
        item.qty += delta;
        if(item.qty <= 0) { cart = cart.filter(i => i.id !== id); }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }
};

window.deleteCartItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    if (cart.length === 0) {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('show');
    }
};

function updateCartUI() {
    cartBadge.innerText = cart.reduce((acc, i) => acc + i.qty, 0);
    cartDrawerItems.innerHTML = '';
    if (cart.length === 0) {
        cartDrawerItems.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:40px;">حقيبتك فارغة تماماً الآن.</p>';
        cartSubtotal.innerText = "$0";
        return;
    }
    cart.forEach(item => {
        cartDrawerItems.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img" alt="${item.title}">
                <div class="cart-item-details">
                    <span class="cart-item-title">${item.title}</span>
                    <span class="cart-item-price">$${item.price}</span>
                    <div class="cart-qty-controls">
                        <button type="button" class="btn-qty" aria-label="تقليل الكمية" onclick="changeQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button type="button" class="btn-qty" aria-label="زيادة الكمية" onclick="changeQty(${item.id}, 1)">+</button>
                        <button type="button" class="btn-cart-delete" aria-label="حذف المنتج" onclick="deleteCartItem(${item.id})" style="margin-right:auto;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `);
    });
    cartSubtotal.innerText = "$" + cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
}

const darkModeToggle = document.getElementById('darkModeToggle');
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
darkModeToggle.onclick = function() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
};

renderProducts();
updateCartUI();