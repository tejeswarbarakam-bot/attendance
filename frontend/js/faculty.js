// Faculty Portal Feature Logic
const FacultyPortal = {
  async initDashboard() {
    Auth.checkRoleAccess(['faculty']);

    try {
      const res = await API.get('/dashboard/faculty');
      if (!res.success) return;

      const { faculty, assignedClassesCount, assignedSubjectsCount, todayClassesMarked, totalAttendanceSubmitted, assignments } = res.data;

      document.getElementById('stat-assigned-classes').textContent = assignedClassesCount || 0;
      document.getElementById('stat-assigned-subjects').textContent = assignedSubjectsCount || 0;
      document.getElementById('stat-today-marked').textContent = todayClassesMarked || 0;
      document.getElementById('stat-total-submitted').textContent = totalAttendanceSubmitted || 0;

      // Render assigned classes table
      const tbody = document.getElementById('assigned-classes-tbody');
      if (tbody) {
        if (!assignments || assignments.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No assigned classes found.</td></tr>`;
        } else {
          tbody.innerHTML = assignments.map(a => `
            <tr>
              <td><strong>${a.subject?.subjectCode || ''}</strong></td>
              <td>${a.subject?.subjectName || ''}</td>
              <td>${a.class?.course?.name || ''} - ${a.class?.year || ''} (${a.class?.section?.name || ''})</td>
              <td>${a.semester}</td>
              <td>
                <a href="mark-attendance.html?classId=${a.class?._id}&subjectId=${a.subject?._id}" class="btn btn-primary btn-sm">
                  Mark Attendance
                </a>
              </td>
            </tr>
          `).join('');
        }
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  async initMarkAttendance() {
    Auth.checkRoleAccess(['faculty', 'admin']);

    // Load Dropdown Options
    try {
      const [deptRes, classRes, subRes] = await Promise.all([
        API.get('/academic/departments'),
        API.get('/academic/classes'),
        API.get('/academic/subjects')
      ]);

      const deptSelect = document.getElementById('select-department');
      const classSelect = document.getElementById('select-class');
      const subjectSelect = document.getElementById('select-subject');

      if (deptSelect && deptRes.data) {
        deptSelect.innerHTML = `<option value="">Select Department</option>` +
          deptRes.data.map(d => `<option value="${d._id}">${d.name} (${d.code})</option>`).join('');
      }

      if (classSelect && classRes.data) {
        classSelect.innerHTML = `<option value="">Select Class</option>` +
          classRes.data.map(c => `<option value="${c._id}">${c.course?.name || ''} - ${c.year} (${c.section?.name || ''})</option>`).join('');
      }

      if (subjectSelect && subRes.data) {
        subjectSelect.innerHTML = `<option value="">Select Subject</option>` +
          subRes.data.map(s => `<option value="${s._id}">${s.subjectCode} - ${s.subjectName}</option>`).join('');
      }

      // Pre-fill today's date
      const dateInput = document.getElementById('input-date');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error loading mark-attendance dropdowns:', e);
    }

    // Load Students when Class selected
    const loadStudentsBtn = document.getElementById('load-students-btn');
    if (loadStudentsBtn) {
      loadStudentsBtn.addEventListener('click', async () => {
        const classId = document.getElementById('select-class').value;
        const subjectId = document.getElementById('select-subject').value;
        const date = document.getElementById('input-date').value;
        const period = document.getElementById('select-period').value;

        if (!classId || !subjectId || !date || !period) {
          UI.showToast('Please select Class, Subject, Date, and Period.', 'warning');
          return;
        }

        try {
          const res = await API.get(`/students?class=${classId}`);
          const tbody = document.getElementById('mark-attendance-tbody');
          const studentSection = document.getElementById('student-list-card');

          if (!res.data || res.data.length === 0) {
            UI.showToast('No students found for the selected class.', 'warning');
            studentSection.style.display = 'none';
            return;
          }

          studentSection.style.display = 'block';

          // Check if attendance already marked for this date & period to pre-select radio buttons
          const historyRes = await API.get(`/attendance/history?subject=${subjectId}&date=${date}`);
          const existingMap = {};
          if (historyRes.data) {
            historyRes.data.forEach(rec => {
              if (rec.period === period && rec.student) {
                existingMap[rec.student._id] = rec.status;
              }
            });
          }

          tbody.innerHTML = res.data.map(st => {
            const currentStatus = existingMap[st._id] || 'Present';
            return `
              <tr class="student-row" data-student-id="${st._id}">
                <td><strong>${st.rollNumber}</strong></td>
                <td>${st.name}</td>
                <td>
                  <div class="attendance-radio-group">
                    <label class="attendance-radio">
                      <input type="radio" name="status_${st._id}" value="Present" ${currentStatus === 'Present' ? 'checked' : ''} />
                      <span style="color:var(--success)">Present</span>
                    </label>
                    <label class="attendance-radio">
                      <input type="radio" name="status_${st._id}" value="Absent" ${currentStatus === 'Absent' ? 'checked' : ''} />
                      <span style="color:var(--danger)">Absent</span>
                    </label>
                  </div>
                </td>
              </tr>
            `;
          }).join('');

        } catch (err) {
          UI.showToast(err.message, 'danger');
        }
      });
    }

    // Toggle Mark All Present / Absent
    document.getElementById('btn-all-present')?.addEventListener('click', () => {
      document.querySelectorAll('input[type="radio"][value="Present"]').forEach(r => r.checked = true);
    });

    document.getElementById('btn-all-absent')?.addEventListener('click', () => {
      document.querySelectorAll('input[type="radio"][value="Absent"]').forEach(r => r.checked = true);
    });

    // Student Live Search Filter
    document.getElementById('search-student-input')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.student-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });

    // Submit Attendance Form
    document.getElementById('submit-attendance-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const departmentId = document.getElementById('select-department').value;
      const classId = document.getElementById('select-class').value;
      const subjectId = document.getElementById('select-subject').value;
      const date = document.getElementById('input-date').value;
      const period = document.getElementById('select-period').value;

      const rows = document.querySelectorAll('.student-row');
      const records = [];

      rows.forEach(row => {
        const studentId = row.dataset.studentId;
        const selected = row.querySelector(`input[name="status_${studentId}"]:checked`);
        if (selected) {
          records.push({ studentId, status: selected.value });
        }
      });

      if (records.length === 0) {
        UI.showToast('No student records selected.', 'warning');
        return;
      }

      if (!confirm(`Are you sure you want to submit attendance for ${records.length} students?`)) {
        return;
      }

      try {
        const payload = {
          departmentId,
          classId,
          subjectId,
          date,
          period,
          records
        };

        const res = await API.post('/attendance/mark', payload);
        if (res.success) {
          UI.showToast(res.message || 'Attendance submitted successfully!', 'success');
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });
  },

  async initFacultyHistory() {
    Auth.checkRoleAccess(['faculty']);
    
    const loadHistory = async () => {
      const date = document.getElementById('filter-date')?.value || '';
      const status = document.getElementById('filter-status')?.value || '';

      let query = `/attendance/history?`;
      if (date) query += `date=${date}&`;
      if (status) query += `status=${status}&`;

      try {
        const res = await API.get(query);
        const tbody = document.getElementById('faculty-history-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No records found.</td></tr>`;
        } else {
          tbody.innerHTML = res.data.map(rec => `
            <tr>
              <td>${rec.date}</td>
              <td>${rec.student?.rollNumber || ''} - ${rec.student?.name || ''}</td>
              <td>${rec.subject?.subjectCode || ''} (${rec.subject?.subjectName || ''})</td>
              <td>${rec.period}</td>
              <td><span class="badge ${rec.status === 'Present' ? 'badge-success' : 'badge-danger'}">${rec.status}</span></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="FacultyPortal.editStatusModal('${rec._id}', '${rec.status}')">
                  Edit
                </button>
              </td>
            </tr>
          `).join('');
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    document.getElementById('filter-btn')?.addEventListener('click', loadHistory);
    loadHistory();
  },

  async editStatusModal(recordId, currentStatus) {
    const newStatus = prompt(`Change attendance status (Present / Absent):`, currentStatus);
    if (!newStatus || (newStatus !== 'Present' && newStatus !== 'Absent')) return;

    try {
      const res = await API.put(`/attendance/${recordId}`, { status: newStatus });
      if (res.success) {
        UI.showToast('Attendance updated successfully.', 'success');
        this.initFacultyHistory();
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  async initReports() {
    Auth.checkRoleAccess(['faculty', 'admin']);

    const generateBtn = document.getElementById('generate-report-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        const type = document.getElementById('report-type').value;
        const date = document.getElementById('report-date').value;

        try {
          const res = await API.get(`/reports?type=${type}&date=${date}`);
          const tbody = document.getElementById('report-tbody');
          const thRow = document.getElementById('report-thead-row');

          if (!res.data || res.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No report data available.</td></tr>`;
            return;
          }

          if (type === 'student') {
            thRow.innerHTML = `
              <th>Roll Number</th><th>Student Name</th><th>Dept</th><th>Total Classes</th><th>Present</th><th>Absent</th><th>Percentage</th><th>Status</th>
            `;
            tbody.innerHTML = res.data.map(r => `
              <tr>
                <td>${r.rollNumber}</td>
                <td>${r.name}</td>
                <td>${r.department}</td>
                <td>${r.totalClasses}</td>
                <td>${r.present}</td>
                <td>${r.absent}</td>
                <td><strong>${r.percentage}%</strong></td>
                <td><span class="badge ${r.status === 'Good' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
              </tr>
            `).join('');
          } else if (type === 'subject') {
            thRow.innerHTML = `
              <th>Subject Code</th><th>Subject Name</th><th>Dept</th><th>Total Classes</th><th>Present</th><th>Absent</th><th>Percentage</th>
            `;
            tbody.innerHTML = res.data.map(r => `
              <tr>
                <td>${r.subjectCode}</td>
                <td>${r.subjectName}</td>
                <td>${r.department}</td>
                <td>${r.totalClasses}</td>
                <td>${r.present}</td>
                <td>${r.absent}</td>
                <td><strong>${r.percentage}%</strong></td>
              </tr>
            `).join('');
          }
        } catch (err) {
          UI.showToast(err.message, 'danger');
        }
      });
    }

    // Export CSV Listener
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
      const rows = [];
      const table = document.querySelector('.custom-table');
      table.querySelectorAll('tr').forEach(tr => {
        const rowData = [];
        tr.querySelectorAll('th, td').forEach(cell => rowData.push(cell.innerText.trim()));
        rows.push(rowData);
      });
      UI.exportToCSV('Attendance_Report', rows);
    });

    // Print Listener
    document.getElementById('print-report-btn')?.addEventListener('click', () => {
      window.print();
    });
  },

  async initProfile() {
    Auth.checkRoleAccess(['faculty']);
    try {
      const res = await API.get('/auth/me');
      const fac = res.user.profile;
      if (!fac) return;

      document.getElementById('prof-name').textContent = fac.name;
      document.getElementById('prof-id').textContent = fac.facultyId;
      document.getElementById('prof-email').textContent = fac.email;
      document.getElementById('prof-phone').textContent = fac.phone || 'N/A';
      document.getElementById('prof-dept').textContent = fac.department?.name || 'N/A';
      document.getElementById('prof-desig').textContent = fac.designation || 'N/A';
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  }
};
