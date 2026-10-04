const customerPageAdminLink = document.getElementById('adminNavLink');
if (customerPageAdminLink) {
    customerPageAdminLink.style.display = sessionStorage.getItem('storeUser') ? 'inline' : 'none';
}