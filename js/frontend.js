/**
 * frontend.js
 * Handles dynamic rendering of products on the public-facing store
 * connecting to productStore.js (localStorage backend).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on
    const productGrid = document.getElementById('frontendProductGrid');
    const productDetailWrap = document.getElementById('frontendProductDetail');
    const homeProductGrid = document.getElementById('homeProductGrid');
    const relatedProductGrid = document.getElementById('relatedProductGrid');

    // Check navbar auth
    setupNavbarAuth();

    if (productGrid) {
        renderProducts(productGrid);
    } 
    
    if (homeProductGrid) {
        renderProducts(homeProductGrid, { limit: 4 });
    }

    if (productDetailWrap) {
        loadProductDetail();
        if (relatedProductGrid) {
            const urlParams = new URLSearchParams(window.location.search);
            const currentId = urlParams.get('id');
            renderProducts(relatedProductGrid, { limit: 4, excludeId: currentId });
        }
    }
});

function renderProducts(gridContainer, options = {}) {
    // Assuming ProductStore is loaded
    if (typeof ProductStore === 'undefined') {
        console.error("ProductStore is not loaded.");
        return;
    }

    let products = ProductStore.getProducts();

    if (options.excludeId) {
        products = products.filter(p => p.id !== options.excludeId);
    }

    // Handle empty state
    if (!products || products.length === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <h3 style="margin-bottom: 1rem;">No products available</h3>
                <p style="color: var(--text-secondary);">Check back later for new arrivals.</p>
            </div>
        `;
        // Also update the showing text if it exists
        const countDisplay = document.getElementById('productCountDisplay');
        if(countDisplay) countDisplay.textContent = "Showing 0 exclusive pieces";
        return;
    }

    // Update count display if it exists
    const countDisplay = document.getElementById('productCountDisplay');
    if(countDisplay) countDisplay.textContent = `Showing ${products.length} exclusive pieces`;

    // Render products
    gridContainer.innerHTML = '';
    
    // Sort array by newest first (assuming createdAt exists)
    let sortedProducts = [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (options.limit) {
        sortedProducts = sortedProducts.slice(0, options.limit);
    }

    sortedProducts.forEach(product => {
        // Handle image URL — check images array first, then image string
        const allImages = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);
        const rawImg  = allImages[0] || '';
        const rawImg2 = allImages[1] || '';

        const toUrl = (raw) => raw ? (raw.startsWith('http') || raw.startsWith('data:') ? raw : '../' + raw) : '';

        const imgUrl  = toUrl(rawImg)  || 'https://placehold.co/500x600?text=No+Image';
        const imgUrl2 = toUrl(rawImg2);

        // Truncate description for the card
        let shortDesc = product.description || '';
        if (shortDesc.length > 80) shortDesc = shortDesc.substring(0, 80) + '...';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrapper">
                <a href="product-detail.html?id=${product.id}">
                    <img src="${imgUrl}" alt="${product.name}" style="object-fit: contain; aspect-ratio: 4/5; transition: opacity 0.35s ease;">
                </a>
            </div>
            <div class="product-info">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h3 class="product-title" style="margin-bottom:0; flex: 1; min-width: 150px;">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                </div>
                <div class="product-reviews mb-sm" style="font-size: 0.8rem;">
                    <span class="stars">★★★★★</span>
                </div>
                <p class="t-small" style="color:var(--text-secondary); margin-bottom: 1rem; min-height: 2.5em;">
                    ${shortDesc}
                </p>
                <a href="product-detail.html?id=${product.id}" class="btn btn-outline" style="width:100%; border-radius: 4px; padding: 0.5rem; text-align: center;">View Product</a>
            </div>
        `;

        // Hover image swap — only if product has 2+ images
        if (imgUrl2) {
            const imgEl = card.querySelector('img');
            card.addEventListener('mouseenter', () => {
                imgEl.style.opacity = '0';
                setTimeout(() => {
                    imgEl.src = imgUrl2;
                    imgEl.style.opacity = '1';
                }, 175);
            });
            card.addEventListener('mouseleave', () => {
                imgEl.style.opacity = '0';
                setTimeout(() => {
                    imgEl.src = imgUrl;
                    imgEl.style.opacity = '1';
                }, 175);
            });
        }

        gridContainer.appendChild(card);
    });
}

function loadProductDetail() {
    if (typeof ProductStore === 'undefined') {
        console.error("ProductStore is not loaded.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.getElementById('productDetailTitle').textContent = "Product Not Found";
        return;
    }

    const product = ProductStore.getProductById(productId);

    if (!product) {
        document.getElementById('productDetailTitle').textContent = "Product Not Found";
        document.getElementById('frontendProductDetail').innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h3 style="margin-bottom: 1rem;">Product not found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">The product you are looking for might have been removed.</p>
                <a href="products.html" class="btn btn-outline">Back to Shop</a>
            </div>
        `;
        return;
    }

    // Populate Data
    document.title = `${product.name} | Veloura`;
    document.getElementById('productDetailTitle').textContent = product.name;
    document.getElementById('productDetailPrice').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('productDetailDesc').textContent = product.description || '';
    
    // Setup Main Image — check images array first, then image string
    const rawImg = (product.images && product.images.length > 0) ? product.images[0] : (product.image || '');
    const imgUrl = rawImg ? (rawImg.startsWith('http') || rawImg.startsWith('data:') ? rawImg : '../' + rawImg) : 'https://placehold.co/800x1000?text=No+Image';
    const mainImg = document.getElementById('productDetailImage');
    mainImg.src = imgUrl;
    mainImg.alt = product.name;

    // Show thumbnails if product has multiple images
    const thumbContainer = document.querySelector('.thumbnail-list');
    if (thumbContainer) {
        if (product.images && product.images.length > 1) {
            thumbContainer.style.display = '';
            thumbContainer.innerHTML = '';
            product.images.forEach((img, idx) => {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = 'thumb-item' + (idx === 0 ? ' active' : '');
                thumbDiv.onclick = function() {
                    mainImg.src = img;
                    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                };
                const thumbImg = document.createElement('img');
                thumbImg.src = img;
                thumbImg.alt = product.name + ' - image ' + (idx + 1);
                thumbDiv.appendChild(thumbImg);
                thumbContainer.appendChild(thumbDiv);
            });
        } else {
            thumbContainer.style.display = 'none';
        }
    }

    // Setup Affiliate Button
    const buyBtn = document.getElementById('productDetailBuyBtn');
    if (product.affiliateLink && product.affiliateLink.trim() !== '') {
        buyBtn.href = product.affiliateLink.trim();
        // Open affiliate links in new tab
        buyBtn.target = "_blank";
        buyBtn.rel = "noopener noreferrer";
    } else {
        // Fallback if no affiliate link
        buyBtn.href = "#";
        buyBtn.textContent = "Out of Stock / No Link";
        buyBtn.style.opacity = "0.5";
        buyBtn.style.pointerEvents = "none";
    }
}

// --- Authentication UI & Logic (Navbar + Login/Signup) ---

function setupNavbarAuth() {
    const navAuthBtn = document.getElementById('navAuthBtn');
    const navAuthDropdown = document.getElementById('navAuthDropdown');
    const navAuthMenu = document.getElementById('navAuthMenu');

    if (!navAuthBtn || !navAuthMenu) return;

    // Resolve relative path robustly regardless of current folder structure
    const isRoot = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/pages/');
    const pfx = isRoot ? './' : '../';

    // Check auth status
    let authSession = null;
    try { authSession = JSON.parse(localStorage.getItem('adminAuth')); } catch(_) {}
    const isLoggedIn = !!authSession;
    const displayName = authSession ? (authSession.name || authSession.email || 'Admin') : '';

    // Click handler based on Auth Status
    navAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            // Requirement: If user not logged in → redirect to /admin/login.html
            window.location.href = pfx + 'admin/login.html';
        } else {
            // Requirement: If logged in → show dropdown
            navAuthDropdown.classList.toggle('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!navAuthDropdown.contains(e.target)) {
            navAuthDropdown.classList.remove('active');
        }
    });

    // If logged in, build the dropdown. If not, the dropdown won't open anyway.
    if (isLoggedIn) {
        navAuthMenu.innerHTML = `
            <div class="dropdown-header">Welcome, ${displayName.split(' ')[0]}</div>
            <a href="${pfx}admin/dashboard.html" class="dropdown-item">Dashboard</a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item dropdown-logout" id="navLogoutBtn">Logout</a>
        `;

        document.getElementById('navLogoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            // Requirement: clear localStorage and redirect to home page
            localStorage.removeItem('adminAuth');
            window.location.href = pfx + 'pages/home.html';
        });
    }

    // Bind login form if it exists
    const loginForm = document.getElementById('frontendLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleFrontendLogin);
    }

    // Bind signup form if it exists
    const signupForm = document.getElementById('frontendSignupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleFrontendSignup);
    }
}

function showAuthAlert(alertEl, message, type) {
    alertEl.textContent = message;
    alertEl.className = `auth-alert ${type}`;
    // Optional: Hide after several seconds
    setTimeout(() => {
        alertEl.style.display = 'none';
        alertEl.className = 'auth-alert';
    }, 5000);
}

async function handleFrontendLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const alertEl = document.getElementById('loginAlert');

    if (!window.supabaseClient) {
        showAuthAlert(alertEl, 'Database connection is missing.', 'error');
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showAuthAlert(alertEl, error.message, 'error');
        } else {
            // Save adminAuth data to match existing format so navbar auth keeps working
            const user = data.user;
            const displayName = user.user_metadata?.name || 'Admin User';
            localStorage.setItem('adminAuth', JSON.stringify({ email: user.email, name: displayName }));
            
            // Redirect to dashboard
            window.location.href = '../admin/dashboard.html';
        }
    } catch (err) {
        showAuthAlert(alertEl, 'An unexpected error occurred.', 'error');
    }
}

async function handleFrontendSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const alertEl = document.getElementById('signupAlert');

    if (!window.supabaseClient) {
        showAuthAlert(alertEl, 'Database connection is missing.', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) {
            showAuthAlert(alertEl, error.message, 'error');
        } else {
            showAuthAlert(alertEl, 'Account created successfully! Switching to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    } catch (err) {
        showAuthAlert(alertEl, 'An unexpected error occurred.', 'error');
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}
