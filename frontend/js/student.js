// Student Dashboard & Feature Logic
const StudentPortal = {
  async initDashboard() {
    Auth.checkRoleAccess(['student']);
    
    try {
      const res = await API.get('/dashboard/student');
      if (!res.success) return;

      const { student, stats, recentHistory } = res.data;

      // Update Top Metrics Cards
      document.getElementById('stat-total-classes').textContent = stats.totalClasses || 0;
      document.getElementById('stat-present-count').textContent = stats.presentCount || 0;
      document.getElementById('stat-absent-count').textContent = stats.absentCount || 0;
      document.getElementById('stat-overall-pct').textContent = `${stats.percentage}%`;

      // Render Circular Chart
      UI.renderCircularProgress(stats.percentage, 'student-circle-chart');

      // Shortage Warning Display
      const warningBanner = document.getElementById('shortage-warning-box');
      if (warningBanner) {
        if (stats.isShortage) {
          warningBanner.style.display = 'flex';
          document.getElementById('shortage-pct-msg').textContent = `Your attendance (${stats.percentage}%) is below the required ${stats.minRequired}%. Please attend mandatory upcoming classes.`;
        } else {
          warningBanner.style.display = 'none';
        }
      }

      // Render Recent History Table
      const tbody = document.getElementById('recent-history-tbody');
      if (tbody) {
        if (!recentHistory || recentHistory.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No attendance records found.</td></tr>`;
        } else {
          tbody.innerHTML = recentHistory.map(rec => `
            <tr>
              <td>${rec.date}</td>
              <td>${rec.subject?.subjectCode || ''} - ${rec.subject?.subjectName || ''}</td>
              <td>${rec.period}</td>
              <td>${rec.faculty?.name || 'N/A'}</td>
              <td><span class="badge ${rec.status === 'Present' ? 'badge-success' : 'badge-danger'}">${rec.status}</span></td>
            </tr>
          `).join('');
        }
      }

    } catch (err) {
      console.error('Student Dashboard Init Error:', err);
      UI.showToast(err.message, 'danger');
    }
  },

  async initSubjectAttendance() {
    Auth.checkRoleAccess(['student']);

    try {
      const res = await API.get('/attendance/student/me');
      if (!res.success) return;

      const { subjectBreakdown, summary } = res.data;

      // Render Warning callout if any subject is shortage
      const warningBanner = document.getElementById('subject-shortage-warning');
      if (warningBanner) {
        if (summary.isShortage) {
          warningBanner.style.display = 'flex';
          document.getElementById('classes-needed-text').textContent = 
            `You need to attend at least ${summary.requiredClassesToReachMin} additional consecutive classes to reach ${summary.minPercentRequired}%.`;
        } else {
          warningBanner.style.display = 'none';
        }
      }

      const tbody = document.getElementById('subject-attendance-tbody');
      if (tbody) {
        if (!subjectBreakdown || subjectBreakdown.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No subject attendance data available.</td></tr>`;
        } else {
          tbody.innerHTML = subjectBreakdown.map(sub => `
            <tr>
              <td><strong>${sub.subjectCode}</strong></td>
              <td>${sub.subjectName}</td>
              <td>${sub.present}</td>
              <td>${sub.absent}</td>
              <td>${sub.total}</td>
              <td><strong>${sub.percentage}%</strong></td>
              <td>
                <span class="badge ${sub.status === 'Good' ? 'badge-success' : sub.status === 'Warning' ? 'badge-warning' : 'badge-danger'}">
                  ${sub.status}
                </span>
              </td>
            </tr>
          `).join('');
        }
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  async initAttendanceHistory() {
    Auth.checkRoleAccess(['student']);

    const loadHistory = async () => {
      const subject = document.getElementById('filter-subject')?.value || '';
      const date = document.getElementById('filter-date')?.value || '';
      const status = document.getElementById('filter-status')?.value || '';

      let query = `/attendance/history?`;
      if (subject) query += `subject=${subject}&`;
      if (date) query += `date=${date}&`;
      if (status) query += `status=${status}&`;

      try {
        const res = await API.get(query);
        const tbody = document.getElementById('history-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No history records match the filter.</td></tr>`;
        } else {
          tbody.innerHTML = res.data.map(rec => `
            <tr>
              <td>${rec.date}</td>
              <td>${rec.subject?.subjectName || ''} (${rec.subject?.subjectCode || ''})</td>
              <td>${rec.period}</td>
              <td>${rec.faculty?.name || ''}</td>
              <td><span class="badge ${rec.status === 'Present' ? 'badge-success' : 'badge-danger'}">${rec.status}</span></td>
            </tr>
          `).join('');
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    // Populate subject filter options
    try {
      const subRes = await API.get('/attendance/student/me');
      const filterSub = document.getElementById('filter-subject');
      if (filterSub && subRes.data?.subjectBreakdown) {
        subRes.data.subjectBreakdown.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.subjectId;
          opt.textContent = `${s.subjectCode} - ${s.subjectName}`;
          filterSub.appendChild(opt);
        });
      }
    } catch (e) {}

    document.getElementById('filter-btn')?.addEventListener('click', loadHistory);
    loadHistory();
  },

  async initNotifications() {
    Auth.checkRoleAccess(['student']);

    try {
      const res = await API.get('/notifications');
      const container = document.getElementById('notifications-list');
      if (!container) return;

      if (!res.data || res.data.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">No notifications found.</p>`;
      } else {
        container.innerHTML = res.data.map(n => `
          <div class="card" style="padding:1.25rem; margin-bottom:1rem; border-left:4px solid ${n.type === 'warning' ? '#f59e0b' : '#3b82f6'};">
            <div style="display:flex; justify-between; align-items:center;">
              <h4 style="font-size:1rem;">${n.title}</h4>
              <span style="font-size:0.75rem; color:var(--text-muted);">${new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
            <p style="margin-top:0.5rem; font-size:0.9rem; color:var(--text-main);">${n.message}</p>
          </div>
        `).join('');
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  async initProfile() {
    Auth.checkRoleAccess(['student']);
    const user = Auth.getUser();
    if (!user) return;

    try {
      const res = await API.get('/auth/me');
      const st = res.user.profile;
      if (!st) return;

      document.getElementById('prof-name').textContent = st.name;
      document.getElementById('prof-roll').textContent = st.rollNumber;
      document.getElementById('prof-email').textContent = st.email;
      document.getElementById('prof-phone').textContent = st.phone || 'N/A';
      document.getElementById('prof-dept').textContent = st.department?.name || 'N/A';
      document.getElementById('prof-course').textContent = st.course?.name || 'N/A';
      document.getElementById('prof-year-sem').textContent = `${st.year} / ${st.semester}`;
      document.getElementById('prof-section').textContent = st.section?.name || 'N/A';
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  }
};
