// Recalculates cart item count and updates standard badge in navbar
async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  if (!isLoggedIn()) {
    badge.textContent = '0';
    badge.classList.remove('active');
    return;
  }

  try {
    const items = await getCart();
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalCount;
    if (totalCount > 0) {
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
    }
  } catch (err) {
    badge.textContent = '0';
    badge.classList.remove('active');
  }
}
window.updateCartBadge = updateCartBadge;

// Setup listeners for cart layout row modifiers
function setupCartListeners() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  // Decrease quantity listener
  container.querySelectorAll('.btn-qty-dec').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('.cart-item-row');
      const cartItemId = row.dataset.id;
      const currentQty = parseInt(row.querySelector('.qty-val').textContent, 10);
      
      if (currentQty <= 1) return;

      try {
        await updateCart(cartItemId, currentQty - 1);
        showToast('Cart quantity decreased', 'success');
        await loadCart();
        await updateCartBadge();
      } catch (err) {
        // Handled automatically by apiFetch error catcher
      }
    });
  });

  // Increase quantity listener
  container.querySelectorAll('.btn-qty-inc').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('.cart-item-row');
      const cartItemId = row.dataset.id;
      const currentQty = parseInt(row.querySelector('.qty-val').textContent, 10);

      try {
        await updateCart(cartItemId, currentQty + 1);
        showToast('Cart quantity increased', 'success');
        await loadCart();
        await updateCartBadge();
      } catch (err) {
        // Handled automatically by apiFetch error catcher
      }
    });
  });

  // Remove cart item completely
  container.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('.cart-item-row');
      const cartItemId = row.dataset.id;

      try {
        await removeFromCart(cartItemId);
        showToast('Item removed from your cart', 'success');
        await loadCart();
        await updateCartBadge();
      } catch (err) {
        // Handled automatically by apiFetch error catcher
      }
    });
  });
}

// Loads and renders cart listing inside designated container
async function loadCart() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-icon-box">🛒</div>
        <h2>Sign in to view your cart</h2>
        <p>Add products to your cart and sign in to complete your checkout process.</p>
        <a href="login.html" class="btn btn-primary btn-lg">Log In Here</a>
      </div>
    `;
    return;
  }

  try {
    const items = await getCart();
    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <div class="empty-icon-box">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Check out our catalog to add amazing products to your cart.</p>
          <a href="index.html" class="btn btn-primary btn-lg">Shop Products Now</a>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    let listHTML = '';

    items.forEach(item => {
      const rowSubtotal = item.price * item.quantity;
      subtotal += rowSubtotal;
      const maxQty = Math.min(10, item.stock);
      
      listHTML += `
        <div class="cart-item-row" data-id="${item.id}" data-product-id="${item.product_id}">
          <div class="cart-item-info">
            <img src="${item.image_url}" alt="${item.name}" class="cart-item-img" loading="lazy">
            <div class="cart-item-details">
              <a href="product.html?id=${item.product_id}" class="cart-item-title">${item.name}</a>
              <span class="cart-item-category">${item.category}</span>
              <span class="cart-item-mobile-price">Price: $${item.price.toFixed(2)}</span>
            </div>
          </div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-qty">
            <div class="qty-adjuster">
              <button class="btn-qty-dec btn-qty" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="btn-qty-inc btn-qty" ${item.quantity >= maxQty ? 'disabled' : ''}>+</button>
            </div>
            <span class="stock-hint">Limit: ${maxQty}</span>
          </div>
          <div class="cart-item-subtotal">$${rowSubtotal.toFixed(2)}</div>
          <div class="cart-item-remove">
            <button class="btn-remove-item" title="Remove Item">&times;</button>
          </div>
        </div>
      `;
    });

    const shipping = 5.00;
    const total = subtotal + shipping;

    container.innerHTML = `
      <h1 class="cart-page-title">Shopping Cart</h1>
      <div class="cart-layout-grid">
        <div class="cart-items-section">
          <div class="cart-header-labels">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
            <span></span>
          </div>
          <div class="cart-items-list">
            ${listHTML}
          </div>
        </div>
        
        <div class="cart-summary-section">
          <div class="summary-card">
            <h3>Order Summary</h3>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Shipping Fee</span>
              <span>$${shipping.toFixed(2)}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
              <span>Total Price</span>
              <span>$${total.toFixed(2)}</span>
            </div>
            <a href="checkout.html" class="btn btn-primary btn-block btn-lg btn-checkout">Proceed to Checkout &rarr;</a>
            <div class="checkout-back-link">
              <a href="index.html">&larr; Continue Shopping</a>
            </div>
          </div>
        </div>
      </div>
    `;

    setupCartListeners();

  } catch (err) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-icon-box">⚠️</div>
        <h2>Couldn't fetch your cart</h2>
        <p>Something went wrong. Please check your backend connection and reload.</p>
        <button class="btn btn-primary" onclick="loadCart()">Reload Cart</button>
      </div>
    `;
  }
}

// Initialise navbar badge if available on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
