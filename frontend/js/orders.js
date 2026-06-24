// Render Order History on the orders.html page
async function renderOrderHistory() {
  const container = document.getElementById('orders-page-container');
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = `
      <div class="orders-empty-state">
        <div class="empty-icon-box">📦</div>
        <h2>Sign in to view order history</h2>
        <p>Please log in to see details of your past transactions.</p>
        <a href="login.html" class="btn btn-primary btn-lg">Log In Here</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="orders-loading">
      <div class="spinner"></div>
      <p>Retrieving your order history...</p>
    </div>
  `;

  try {
    const orders = await getOrders();
    if (orders.length === 0) {
      container.innerHTML = `
        <div class="orders-empty-state">
          <div class="empty-icon-box">📦</div>
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet. Start shopping to create one!</p>
          <a href="index.html" class="btn btn-primary btn-lg">Shop Products</a>
        </div>
      `;
      return;
    }

    let ordersHTML = '<h1>My Orders</h1><div class="orders-list-grid">';

    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let statusClass = 'status-pending';
      if (order.status === 'confirmed') statusClass = 'status-confirmed';
      if (order.status === 'shipped') statusClass = 'status-shipped';
      if (order.status === 'delivered') statusClass = 'status-delivered';

      ordersHTML += `
        <div class="order-card" data-order-id="${order.id}">
          <div class="order-card-header">
            <div class="header-meta">
              <span class="order-number">Order #${order.id}</span>
              <span class="order-date">${orderDate}</span>
            </div>
            <div class="header-status">
              <span class="status-badge ${statusClass}">${order.status.toUpperCase()}</span>
            </div>
          </div>
          <div class="order-card-body">
            <div class="body-info">
              <span>Items Total:</span>
              <strong class="order-total">$${order.total_price.toFixed(2)}</strong>
            </div>
            <button class="btn btn-secondary btn-sm btn-toggle-details">View Details</button>
          </div>
          <div class="order-card-details-drawer" style="display: none;">
            <div class="drawer-loading">
              <div class="spinner spinner-sm"></div>
              <span>Fetching items...</span>
            </div>
          </div>
        </div>
      `;
    });

    ordersHTML += '</div>';
    container.innerHTML = ordersHTML;

    // Attach listeners for accordion toggle details
    setupOrderHistoryListeners();

  } catch (err) {
    container.innerHTML = `
      <div class="orders-empty-state">
        <div class="empty-icon-box">⚠️</div>
        <h2>Couldn't fetch order history</h2>
        <p>There was a connection problem. Please verify that the API is running and try again.</p>
        <button class="btn btn-primary" onclick="renderOrderHistory()">Retry</button>
      </div>
    `;
  }
}

// Attach toggling listeners to historical order cards
function setupOrderHistoryListeners() {
  const container = document.getElementById('orders-page-container');
  if (!container) return;

  container.querySelectorAll('.order-card').forEach(card => {
    const toggleBtn = card.querySelector('.btn-toggle-details');
    const drawer = card.querySelector('.order-card-details-drawer');
    const orderId = card.dataset.orderId;

    toggleBtn.addEventListener('click', async () => {
      const isVisible = drawer.style.display !== 'none';
      if (isVisible) {
        drawer.style.display = 'none';
        toggleBtn.textContent = 'View Details';
      } else {
        drawer.style.display = 'block';
        toggleBtn.textContent = 'Hide Details';

        // Check if details are already loaded
        if (drawer.querySelector('.drawer-loading')) {
          try {
            const detail = await getOrderDetail(orderId);
            let itemsHTML = '<div class="drawer-items-list">';
            
            detail.items.forEach(item => {
              itemsHTML += `
                <div class="drawer-item-row">
                  <img src="${item.image_url}" alt="${item.name}" class="drawer-item-img">
                  <div class="drawer-item-meta">
                    <span class="drawer-item-name">${item.name}</span>
                    <span class="drawer-item-cat">${item.category}</span>
                  </div>
                  <div class="drawer-item-qty">Qty: ${item.quantity}</div>
                  <div class="drawer-item-price">$${item.unit_price.toFixed(2)}</div>
                </div>
              `;
            });
            
            const subtotal = detail.total_price - 5.00;
            itemsHTML += `
              </div>
              <div class="drawer-summary">
                <div class="summary-line"><span>Subtotal:</span> <span>$${subtotal.toFixed(2)}</span></div>
                <div class="summary-line"><span>Shipping (Flat):</span> <span>$5.00</span></div>
                <div class="summary-line total"><span>Total:</span> <span>$${detail.total_price.toFixed(2)}</span></div>
              </div>
            `;
            
            drawer.innerHTML = itemsHTML;
          } catch (err) {
            drawer.innerHTML = `<div class="drawer-error">Failed to load order items.</div>`;
          }
        }
      }
    });
  });
}

// Loads product items preview on checkout.html page
async function loadCheckoutSummary() {
  const summaryContainer = document.getElementById('checkout-items-list');
  if (!summaryContainer) return;

  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const items = await getCart();
    if (items.length === 0) {
      showToast('Your cart is empty. Please add items before checking out.', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      return;
    }

    let itemsHTML = '';
    let subtotal = 0;

    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      
      itemsHTML += `
        <div class="checkout-item-line">
          <div class="item-name-qty">
            <span class="item-title">${item.name}</span>
            <span class="item-quantity">x${item.quantity}</span>
          </div>
          <span class="item-subtotal">$${itemSubtotal.toFixed(2)}</span>
        </div>
      `;
    });

    const shipping = 5.00;
    const total = subtotal + shipping;

    summaryContainer.innerHTML = itemsHTML;
    document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;

  } catch (err) {
    summaryContainer.innerHTML = `<div class="error-text">Failed to retrieve items. Please reload.</div>`;
  }
}

// Perform client-side verification on checkout forms
function validateCheckoutForm(formData) {
  // Shipping details
  if (!formData.fullName.trim()) return 'Please enter your full name.';
  if (!formData.address.trim()) return 'Please enter your shipping address.';
  if (!formData.city.trim()) return 'Please enter your city.';
  if (!formData.state.trim()) return 'Please enter your state/province.';
  if (!formData.zip.trim()) return 'Please enter your ZIP/postal code.';
  if (!formData.country.trim()) return 'Please select or enter your country.';

  // Payment mock details
  if (!formData.cardName.trim()) return 'Please enter the name on your card.';
  
  const cardNumber = formData.cardNumber.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(cardNumber)) return 'Please enter a valid 16-digit credit card number.';
  
  if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(formData.cardExpiry)) {
    return 'Please enter a valid card expiry in MM/YY format.';
  }
  
  if (!/^\d{3}$/.test(formData.cardCvv)) {
    return 'Please enter a valid 3-digit CVV code.';
  }

  return null;
}

// Handles submitting the order
async function executeOrderPlacement(e) {
  e.preventDefault();

  const form = document.getElementById('checkout-form');
  if (!form) return;

  const formData = {
    fullName: form.querySelector('#fullName').value,
    address: form.querySelector('#address').value,
    city: form.querySelector('#city').value,
    state: form.querySelector('#state').value,
    zip: form.querySelector('#zip').value,
    country: form.querySelector('#country').value,
    cardName: form.querySelector('#cardName').value,
    cardNumber: form.querySelector('#cardNumber').value,
    cardExpiry: form.querySelector('#cardExpiry').value,
    cardCvv: form.querySelector('#cardCvv').value
  };

  const validationError = validateCheckoutForm(formData);
  if (validationError) {
    showToast(validationError, 'error');
    return;
  }

  try {
    const result = await placeOrder();
    
    // Hide layout, render success view
    const mainGrid = document.querySelector('.checkout-layout-grid');
    const header = document.querySelector('.checkout-page-title');
    if (mainGrid) {
      mainGrid.style.display = 'none';
    }
    if (header) {
      header.style.display = 'none';
    }

    const pageContainer = document.getElementById('checkout-page-container');
    const successBox = document.createElement('div');
    successBox.className = 'checkout-success-view';
    successBox.innerHTML = `
      <div class="success-icon-box">✓</div>
      <h2>Thank you for your order!</h2>
      <p>Your order has been placed successfully and is being processed.</p>
      <div class="success-order-details">
        <span>Order Reference:</span>
        <strong>#${result.orderId}</strong>
      </div>
      <p class="success-subtext">A confirmation email has been sent to your registered address.</p>
      <div class="success-actions">
        <a href="orders.html" class="btn btn-primary">View Order History</a>
        <a href="index.html" class="btn btn-secondary">Return to Shop</a>
      </div>
    `;
    pageContainer.appendChild(successBox);
    showToast('Order placed successfully!', 'success');
    
    // Reset navbar badge
    if (window.updateCartBadge) {
      window.updateCartBadge();
    }
  } catch (err) {
    // Error caught and displayed via apiFetch automatic notification
  }
}

// Register event bindings on window load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('checkout-items-list')) {
    loadCheckoutSummary();
    const form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', executeOrderPlacement);
    }
  }

  if (document.getElementById('orders-page-container')) {
    renderOrderHistory();
  }
});
