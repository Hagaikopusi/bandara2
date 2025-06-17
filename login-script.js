document.addEventListener('DOMContentLoaded', () => {
    const adminBtn = document.getElementById('admin-btn');
    const tenantBtn = document.getElementById('tenant-btn');
    const roleInput = document.getElementById('role-input');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    function switchRole(activeBtn, inactiveBtn, role) {
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
        roleInput.value = role;
    }

    adminBtn.addEventListener('click', () => {
        switchRole(adminBtn, tenantBtn, 'admin');
    });

    tenantBtn.addEventListener('click', () => {
        switchRole(tenantBtn, adminBtn, 'tenant');
    });

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); 

        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        const username = loginForm.username.value.trim();
        const password = loginForm.password.value.trim();
        const role = loginForm.role.value;

        if (username === '' || password === '') {
            errorMessage.textContent = 'Username dan Password tidak boleh kosong.';
            errorMessage.style.display = 'block';
            return;
        }
        
        let loginSuccess = false;
        let redirectUrl = '';

        if (role === 'admin') {
            if (username === 'admin' && password === 'admin123') {
                loginSuccess = true;
                redirectUrl = 'admin/index.html'; // Arahkan ke dashboard admin
            }
        } else if (role === 'tenant') {
            // Contoh data login tenant, bisa lebih dari satu
            if (username === 'tenant' && password === 'tenant123') {
                loginSuccess = true;
                localStorage.setItem('loggedInTenant', username); // Simpan nama tenant yang login
                redirectUrl = 'tenant/index.html'; // Arahkan ke dashboard tenant
            }
        }

        if (loginSuccess) {
            alert(`Login berhasil sebagai ${role}!`);
            window.location.href = redirectUrl; 
        } else {
            errorMessage.textContent = 'Username atau Password salah. Silakan coba lagi.';
            errorMessage.style.display = 'block';
        }
    });
});