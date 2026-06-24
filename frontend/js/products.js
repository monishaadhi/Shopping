// Renders product cards into homepage grid
async function fetchAndRenderProducts(search = '', category = '') {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="grid-loading">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>
  `;

  try {
    const products = await getProducts(search, category);
    if (products.length === 0) {
      grid.innerHTML = `
        <div class="grid-empty">
          <h3>No products found</h3>
          <p>We couldn't find any products matching your search criteria. Try adjusting your filters or keywords.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      // Make entire card except buttons navigate to product details
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add-to-cart')) return;
        window.location.href = `product.html?id=${product.id}`;
      });

      const isOutOfStock = product.stock <= 0;
      card.innerHTML = `
        <div class="product-card-img-wrapper">
          <img src="${product.image_url}" alt="${product.name}" class="product-card-img" loading="lazy">
          <span class="product-card-category">${product.category}</span>
        </div>
        <div class="product-card-body">
          <h3 class="product-card-title">${product.name}</h3>
          <p class="product-card-desc">${product.description}</p>
          <div class="product-card-footer">
            <span class="product-card-price">$${product.price.toFixed(2)}</span>
            <span class="product-card-stock ${isOutOfStock ? 'out-of-stock' : ''}">
              ${isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
            </span>
          </div>
          <button class="btn btn-primary btn-add-to-cart" ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      `;

      // Wire up Add to Cart directly from card
      const addBtn = card.querySelector('.btn-add-to-cart');
      if (addBtn && !isOutOfStock) {
        addBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          
          if (!isLoggedIn()) {
            showToast('You must be logged in to add items to your cart.', 'error');
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 1000);
            return;
          }

          try {
            await addToCart(product.id, 1);
            showToast(`"${product.name}" added to cart!`, 'success');
            if (window.updateCartBadge) {
              window.updateCartBadge();
            }
          } catch (err) {
            // Errors automatically flagged via apiFetch toast
          }
        });
      }

      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `
      <div class="grid-error">
        <h3>Could not load products</h3>
        <p>There was a connection issue. Please check your API server and try refreshing.</p>
        <button class="btn btn-secondary" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
}

// Renders individual product details
async function fetchAndRenderProductDetail() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    container.innerHTML = `
      <div class="detail-error">
        <h3>No Product Specified</h3>
        <p>Go back to the homepage to select a product.</p>
        <a href="index.html" class="btn btn-secondary">&larr; Back to Shop</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="detail-loading">
      <div class="spinner"></div>
      <p>Loading product details...</p>
    </div>
  `;

  try {
    const product = await getProduct(productId);
    const isOutOfStock = product.stock <= 0;

    // Build quantity select options up to stock size (capped at 10)
    let qtyOptions = '';
    const maxQty = Math.min(10, product.stock);
    for (let i = 1; i <= maxQty; i++) {
      qtyOptions += `<option value="${i}">${i}</option>`;
    }

    container.innerHTML = `
      <div class="product-detail-view">
        <div class="detail-breadcrumb">
          <a href="index.html">&larr; Back to Products</a>
        </div>
        <div class="detail-grid">
          <div class="detail-image-box">
            <img src="${product.image_url}" alt="${product.name}" class="detail-image">
            <span class="detail-category-badge">${product.category}</span>
          </div>
          <div class="detail-content-box">
            <h1 class="detail-title">${product.name}</h1>
            <div class="detail-price">$${product.price.toFixed(2)}</div>
            <p class="detail-description">${product.description}</p>
            
            <div class="detail-inventory">
              <span class="inventory-dot ${isOutOfStock ? 'empty' : 'available'}"></span>
              <span>${isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)`}</span>
            </div>

            ${!isOutOfStock ? `
              <div class="detail-purchase-controls">
                <div class="qty-select-wrapper">
                  <label for="detail-qty">Quantity:</label>
                  <select id="detail-qty" class="form-control">
                    ${qtyOptions}
                  </select>
                </div>
                <button id="detail-add-btn" class="btn btn-primary btn-lg">Add to Cart</button>
              </div>
            ` : `
              <div class="detail-purchase-controls">
                <button class="btn btn-secondary btn-lg" disabled>Out of Stock</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    const addBtn = document.getElementById('detail-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) {
          showToast('You must be logged in to add items to your cart.', 'error');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1000);
          return;
        }

        const qtySelect = document.getElementById('detail-qty');
        const quantity = parseInt(qtySelect.value, 10);

        try {
          await addToCart(product.id, quantity);
          showToast(`Added ${quantity} x "${product.name}" to cart!`, 'success');
          if (window.updateCartBadge) {
            window.updateCartBadge();
          }
        } catch (err) {
          // Toast notifications handled by fetch wrapper
        }
      });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="detail-error">
        <h3>Product Not Found</h3>
        <p>The product you are trying to view does not exist or could not be loaded.</p>
        <a href="index.html" class="btn btn-secondary">&larr; Back to Shop</a>
      </div>
    `;
  }
}
