let products = [];
let cart = [];

const API_BASE_URL = 'http://192.168.0.100:3000/api';

// Initialize
fetchProducts();

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    products = await response.json();
    loadProducts();
  } catch (error) {
    console.error("Error fetching products:", error);
    alert("Failed to load products. Is the backend server running?");
  }
}

// Show pages
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const targetPage = document.getElementById(id);
  if (targetPage) {
    targetPage.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Display products
function loadProducts() {
  const list = document.getElementById('product-list');
  if (!list) return;
  list.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
      if (e.target.tagName !== 'BUTTON') {
        showProductDetails(p.id);
      }
    };
    card.innerHTML = `
      <div class="image-container">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" class="product-image">` : `<div class="image-placeholder"></div>`}
      </div>
      <div>
        <h3>${p.name}</h3>
        <p class="price">৳${p.price.toLocaleString()}</p>
      </div>
      <button class="primary-btn" onclick="addToCart(${p.id})">Add to Cart</button>
    `;
    list.appendChild(card);
  });
}

// Product Details Logic
function showProductDetails(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById('details-name').innerText = product.name;
  document.getElementById('details-price').innerText = `৳${product.price.toLocaleString()}`;
  document.getElementById('details-description').innerText = product.description || "No description available.";

  const visual = document.querySelector('.product-visual');
  if (visual) {
    visual.innerHTML = product.image
      ? `<img src="${product.image}" alt="${product.name}" class="product-image-large">`
      : `<div class="image-placeholder" style="height: 400px;"></div>`;
  }

  const addBtn = document.getElementById('details-add-btn');
  addBtn.onclick = () => addToCart(product.id);

  showPage('product-details');
}

// Cart functions
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    cart.push(product);
    updateCart();

    // Show visual feedback on the button
    const btn = event.target;
    if (btn && btn.tagName === 'BUTTON') {
      const originalText = btn.innerText;
      btn.innerText = "Added! ✓";
      btn.classList.add('success-btn');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('success-btn');
      }, 1000);
    }
  }
}

function updateCart() {
  const countElement = document.getElementById('count');
  const itemsList = document.getElementById('items');
  const totalElement = document.getElementById('total');

  if (countElement) countElement.innerText = cart.length;

  if (itemsList) {
    itemsList.innerHTML = "";
    let total = 0;
    cart.forEach((p, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${p.name}</span>
        <span>৳${p.price.toLocaleString()}</span>
      `;
      itemsList.appendChild(li);
      total += p.price;
    });
    if (totalElement) totalElement.innerText = total.toLocaleString();
  }
}

async function checkout() {
  if (cart.length === 0) return alert("Your cart is empty!");

  const payment = document.getElementById('payment').value;
  const orderData = {
    items: cart,
    total: cart.reduce((sum, p) => sum + p.price, 0),
    payment: payment
  };

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const result = await response.json();
    if (result.success) {
      alert(`Order Confirmed! Order ID: ${result.orderId}. Thank you for shopping with Fit Bazaar.`);
      cart = [];
      updateCart();
      showPage('shop');
    }
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("Failed to place order. Please try again.");
  }
}

// Auth functions
let isLoginMode = true;

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const btn = document.getElementById('auth-btn');
  const toggle = document.getElementById('auth-toggle');

  if (isLoginMode) {
    title.innerText = "User Login";
    subtitle.innerText = "Welcome back to Fit Bazaar.";
    btn.innerText = "Login";
    toggle.innerText = "Don't have an account? Register here";
  } else {
    title.innerText = "Create Account";
    subtitle.innerText = "Join the Fit Bazaar community.";
    btn.innerText = "Register";
    toggle.innerText = "Already have an account? Login here";
  }
}

async function handleAuth() {
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    return alert("Please fill in both fields.");
  }

  const endpoint = isLoginMode ? '/login' : '/register';
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.success) {
      alert(result.message);
      if (isLoginMode) {
        emailInput.value = '';
        passwordInput.value = '';
        showPage('shop');
      } else {
        toggleAuthMode();
      }
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error("Auth error:", error);
    alert("An error occurred. Check if the server is running.");
  }
}

async function applySeller() {
  const boutiqueName = document.querySelector('#seller input[placeholder="Boutique Name"]').value.trim();
  const tradeLicense = document.querySelector('#seller input[placeholder="Trade License"]').value.trim();
  const description = document.querySelector('#seller textarea').value.trim();

  if (!boutiqueName || !tradeLicense || !description) {
    return alert("Please fill in all fields to apply.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/apply-seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boutiqueName, tradeLicense, description })
    });
    const result = await response.json();
    if (result.success) {
      alert("Application Submitted! Your ID: " + result.applicationId);
      // Reset form
      document.querySelector('#seller input[placeholder="Boutique Name"]').value = '';
      document.querySelector('#seller input[placeholder="Trade License"]').value = '';
      document.querySelector('#seller textarea').value = '';
      showPage('shop');
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Seller application error:", error);
    alert("Failed to submit application.");
  }
}

