// Token LocalStorage Keys
const TOKEN_KEY = 'token';

// JWT Decoder
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

// Token operations
const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const isLoggedIn = () => {
  const token = getToken();
  if (!token) return false;
  
  // Verify token is not expired
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp < currentTime) {
    removeToken(); // Token expired, clear it
    return false;
  }
  
  return true;
};

const getCurrentUser = () => {
  const token = getToken();
  return token ? decodeJWT(token) : null;
};

const logout = () => {
  removeToken();
  showToast('Logged out successfully.', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 500);
};

// Navbar dynamic authentication state synchronization
function setupNavbar() {
  const navAuthContainer = document.getElementById('nav-auth');
  if (!navAuthContainer) return;

  const currentPath = window.location.pathname;

  if (isLoggedIn()) {
    const user = getCurrentUser();
    const userName = user ? user.name : 'Customer';
    navAuthContainer.innerHTML = `
      <span class="nav-user-greeting">Welcome, <strong>${userName}</strong></span>
      <a href="orders.html" class="nav-link ${currentPath.includes('orders.html') ? 'active' : ''}">Orders</a>
      <a href="cart.html" class="nav-link nav-cart-icon ${currentPath.includes('cart.html') ? 'active' : ''}">
        <svg class="cart-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span id="cart-badge" class="badge">0</span>
      </a>
      <button id="logout-btn" class="btn btn-secondary btn-sm">Logout</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    navAuthContainer.innerHTML = `
      <a href="login.html" class="nav-link ${currentPath.includes('login.html') ? 'active' : ''}">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

// Ensure navbar initializes automatically when the script is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
});
