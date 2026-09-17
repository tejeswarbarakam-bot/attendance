// Common UI Utilities
const UI = {
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `
      <span>${icon}</span>
      <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  initSidebarToggle() {
    const btn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    if (btn && sidebar) {
      btn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  },

  renderUserBadge() {
    const user = Auth.getUser();
    if (!user) return;
    
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar');

    const name = user.profile?.name || user.username || 'User';
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  },

  renderCircularProgress(percentage, containerId = 'circle-progress-container') {
    const el = document.getElementById(containerId);
    if (!el) return;

    let color = '#10b981'; // green
    if (percentage < 75) color = '#ef4444'; // red
    else if (percentage < 80) color = '#f59e0b'; // amber

    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    el.innerHTML = `
      <div class="svg-circle-container">
        <svg width="140" height="140">
          <circle cx="70" cy="70" r="${radius}" stroke="#e2e8f0" stroke-width="12" fill="transparent" />
          <circle cx="70" cy="70" r="${radius}" stroke="${color}" stroke-width="12" fill="transparent"
            stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" />
        </svg>
        <div class="percentage-label">
          <span>${percentage}%</span>
        </div>
      </div>
    `;
  },

  exportToCSV(filename, rows) {
    let csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(row => {
      csvContent += row.map(e => `"${e}"`).join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UI.initSidebarToggle();
  UI.renderUserBadge();
});
