const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

// Centered Toast Notification Utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const textNode = document.createElement('span');
  textNode.className = 'toast-text';
  textNode.textContent = message;
  toast.appendChild(textNode);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Automatically fade out and remove the toast after 4 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 4000);
}

// Global loader controllers
let activeRequestsCount = 0;

function showLoader() {
  activeRequestsCount++;
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('active');
  }
}

function hideLoader() {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  if (activeRequestsCount === 0) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.remove('active');
    }
  }
}

// Centralized Fetch Wrapper
async function apiFetch(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  showLoader();

  try {
    const response = await fetch(`${API}${endpoint}`, config);
    
    // Attempt parsing response as JSON. In case of 204 No Content, body might be empty.
    let data = {};
    if (response.status !== 204) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data.error || 'Server returned an error response.');
    }

    return data;
  } catch (error) {
    console.error(`API Fetch Failure: ${method} ${endpoint}`, error);
    // Trigger toast notification for errors automatically
    showToast(error.message || 'A network error occurred. Please check your connection.', 'error');
    throw error;
  } finally {
    hideLoader();
  }
}

// Product Mappings
const getProducts = async (search = '', category = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/products${query}`);
};

const getProduct = async (id) => {
  return apiFetch(`/products/${id}`);
};

// Cart Mappings
const getCart = async () => {
  return apiFetch('/cart');
};

const addToCart = async (productId, quantity = 1) => {
  return apiFetch('/cart', 'POST', { product_id: productId, quantity });
};

const updateCart = async (cartItemId, quantity) => {
  return apiFetch(`/cart/${cartItemId}`, 'PUT', { quantity });
};

const removeFromCart = async (cartItemId) => {
  return apiFetch(`/cart/${cartItemId}`, 'DELETE');
};

// Order Mappings
const placeOrder = async () => {
  return apiFetch('/orders', 'POST');
};

const getOrders = async () => {
  return apiFetch('/orders');
};

const getOrderDetail = async (orderId) => {
  return apiFetch(`/orders/${orderId}`);
};
