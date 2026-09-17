// Auth Handler Utility
const Auth = {
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEY_TOKEN);
  },

  getUser() {
    const userStr = localStorage.getItem(CONFIG.STORAGE_KEY_USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  saveSession(token, user) {
    localStorage.setItem(CONFIG.STORAGE_KEY_TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEY_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEY_USER);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Route Guard: Ensures user is logged in and has required role for page access
  checkRoleAccess(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }

    const user = this.getUser();
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      alert(`Unauthorized access! Redirecting to your dashboard.`);
      this.redirectToDashboard(user.role);
      return false;
    }
    return true;
  },

  redirectToDashboard(role) {
    if (role === 'admin') {
      window.location.href = '/admin/dashboard.html';
    } else if (role === 'faculty') {
      window.location.href = '/faculty/dashboard.html';
    } else if (role === 'student') {
      window.location.href = '/student/dashboard.html';
    } else {
      window.location.href = '/login.html';
    }
  },

  async logout() {
    try {
      if (this.getToken()) {
        await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (e) {
      console.warn('Logout API call failed:', e);
    } finally {
      this.clearSession();
      window.location.href = '/login.html';
    }
  }
};
