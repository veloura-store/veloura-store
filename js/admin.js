/* ============================================================
   admin.js — Veloura Admin Logic
   Handles auth, sidebar toggling, UI states, and toast notifications.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ── Global Auth Check ──
    const isAuthPage = location.pathname.includes('login.html') || location.pathname.includes('signup.html');
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

    // Protect admin routes
    if (!isAuthPage && !isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Redirect to dashboard if logged in and visiting auth pages
    if (isAuthPage && isLoggedIn) {
        window.location.href = 'dashboard.html';
        return;
    }

    // ── Update UI with Context ──
    const curName = localStorage.getItem('currentAdminName') || 'Admin';
    document.querySelectorAll('.admin-name-display').forEach(el => el.textContent = curName);
    document.querySelectorAll('.admin-initial').forEach(el => el.textContent = curName.charAt(0).toUpperCase());

    // ── Toast Notifications ──
    window.showToast = function(msg, type = 'info') {
        let wrap = document.querySelector('.toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'toast-wrap';
            document.body.appendChild(wrap);
        }

        const icons = {
            success: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            error:   '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            info:    '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };

        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.innerHTML = `${icons[type] || icons.info} <span>${msg}</span>`;
        wrap.appendChild(t);

        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateX(40px)';
            t.style.transition = 'all 0.3s ease';
            setTimeout(() => t.remove(), 300);
        }, 3000);
    };

    // ── Sidebar Mobile Toggle ──
    const menuToggle = document.getElementById('menuToggle');
    const sidebar    = document.getElementById('sidebar');
    const overlay    = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    // ── Auth Handling ──
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const em = document.getElementById('email').value.trim();
            const pw = document.getElementById('password').value;
            const btn = document.getElementById('loginSubmitBtn');
            const alertBox = document.getElementById('loginAlert');

            btn.disabled = true;
            btn.innerHTML = '<span style="opacity:0.7">Verifying...</span>';

            setTimeout(() => {
                const storedAdmins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
                const validAdmin = storedAdmins.find(u => u.email === em && u.password === pw);

                if ((em === 'admin@veloura.com' && pw === 'admin123') || validAdmin) {
                    localStorage.setItem('adminLoggedIn', 'true');
                    localStorage.setItem('currentAdminName', validAdmin ? validAdmin.name : 'Super Admin');
                    window.location.href = 'dashboard.html';
                } else {
                    alertBox.textContent = '❌ Invalid email or password.';
                    alertBox.className = 'alert error';
                    btn.disabled = false;
                    btn.innerHTML = 'Sign In';
                }
            }, 600);
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nm = document.getElementById('name').value.trim();
            const em = document.getElementById('email').value.trim();
            const pw = document.getElementById('password').value;
            const btn = document.getElementById('signupSubmitBtn');
            const alertBox = document.getElementById('signupAlert');

            btn.disabled = true;
            btn.innerHTML = '<span style="opacity:0.7">Creating account...</span>';

            setTimeout(() => {
                const storedAdmins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
                if (storedAdmins.some(u => u.email === em) || em === 'admin@veloura.com') {
                    alertBox.textContent = '❌ Email already registered.';
                    alertBox.className = 'alert error';
                    btn.disabled = false;
                    btn.innerHTML = 'Create Account';
                    return;
                }

                storedAdmins.push({ name: nm, email: em, password: pw, date: new Date().toISOString() });
                localStorage.setItem('adminUsers', JSON.stringify(storedAdmins));

                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('currentAdminName', nm);
                window.location.href = 'dashboard.html';
            }, 800);
        });
    }

    // ── Logout ──
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
                localStorage.removeItem('adminLoggedIn');
                localStorage.removeItem('currentAdminName');
                window.location.href = 'login.html';
            }
        });
    }
});
