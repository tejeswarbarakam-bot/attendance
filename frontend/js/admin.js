// Admin Portal Feature Logic & Chart Analytics
const AdminPortal = {
  async initDashboard() {
    Auth.checkRoleAccess(['admin']);

    try {
      const res = await API.get('/dashboard/admin');
      if (!res.success) return;

      const { totalStudents, totalFaculty, totalDepartments, totalSubjects, todayAttendance, overallAttendance, lowAttendanceCount, shortageStudents, departmentStats } = res.data;

      document.getElementById('stat-total-students').textContent = totalStudents || 0;
      document.getElementById('stat-total-faculty').textContent = totalFaculty || 0;
      document.getElementById('stat-total-depts').textContent = totalDepartments || 0;
      document.getElementById('stat-total-subjects').textContent = totalSubjects || 0;
      document.getElementById('stat-today-pct').textContent = `${todayAttendance?.percentage || 0}%`;
      document.getElementById('stat-shortage-count').textContent = lowAttendanceCount || 0;

      // Render Shortage Students List
      const shortageTbody = document.getElementById('shortage-students-tbody');
      if (shortageTbody) {
        if (!shortageStudents || shortageStudents.length === 0) {
          shortageTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No students currently below minimum percentage.</td></tr>`;
        } else {
          shortageTbody.innerHTML = shortageStudents.map(s => `
            <tr>
              <td><strong>${s.rollNumber}</strong></td>
              <td>${s.name}</td>
              <td>${s.present} / ${s.total}</td>
              <td><span class="badge badge-danger">${s.percentage}%</span></td>
            </tr>
          `).join('');
        }
      }

      // Render Department Performance Chart using Chart.js CDN if loaded
      this.renderDepartmentChart(departmentStats);

    } catch (err) {
      console.error('Admin Dashboard Error:', err);
      UI.showToast(err.message, 'danger');
    }
  },

  renderDepartmentChart(deptStats) {
    const canvas = document.getElementById('deptAttendanceChart');
    if (!canvas || !window.Chart) return;

    const labels = deptStats.map(d => d.code);
    const data = deptStats.map(d => d.percentage);

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['CSE', 'ECE', 'ME'],
        datasets: [{
          label: 'Department Attendance %',
          data: data.length > 0 ? data : [85, 78, 92],
          backgroundColor: ['#4f46e5', '#0ea5e9', '#8b5cf6'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  },

  // --- STUDENT MANAGEMENT ---
  async initStudentsPage() {
    Auth.checkRoleAccess(['admin']);

    const loadStudents = async () => {
      const search = document.getElementById('search-student')?.value || '';
      try {
        const res = await API.get(`/students?search=${search}`);
        const tbody = document.getElementById('students-table-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No students found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.data.map(s => `
          <tr>
            <td><strong>${s.studentId}</strong></td>
            <td>${s.rollNumber}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${s.department?.code || 'N/A'}</td>
            <td>${s.year} - ${s.semester} (${s.section?.name || ''})</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="AdminPortal.deleteStudent('${s._id}')">Deactivate</button>
            </td>
          </tr>
        `).join('');
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    // Load Department, Course, Section options into Add Modal
    try {
      const [deptRes, courseRes, secRes] = await Promise.all([
        API.get('/academic/departments'),
        API.get('/academic/courses'),
        API.get('/academic/sections')
      ]);

      const deptSelect = document.getElementById('add-student-dept');
      const courseSelect = document.getElementById('add-student-course');
      const secSelect = document.getElementById('add-student-sec');

      if (deptSelect && deptRes.data) {
        deptSelect.innerHTML = deptRes.data.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
      }
      if (courseSelect && courseRes.data) {
        courseSelect.innerHTML = courseRes.data.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
      }
      if (secSelect && secRes.data) {
        secSelect.innerHTML = secRes.data.map(s => `<option value="${s._id}">${s.name}</option>`).join('');
      }
    } catch (e) {}

    document.getElementById('search-student')?.addEventListener('input', loadStudents);

    // Add Student Form Submission
    document.getElementById('add-student-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        studentId: document.getElementById('add-student-id').value,
        rollNumber: document.getElementById('add-student-roll').value,
        name: document.getElementById('add-student-name').value,
        email: document.getElementById('add-student-email').value,
        phone: document.getElementById('add-student-phone').value,
        department: document.getElementById('add-student-dept').value,
        course: document.getElementById('add-student-course').value,
        year: document.getElementById('add-student-year').value,
        semester: document.getElementById('add-student-sem').value,
        section: document.getElementById('add-student-sec').value,
        academicYear: '2026-27',
        password: document.getElementById('add-student-pw').value || 'Student@123'
      };

      try {
        const res = await API.post('/students', payload);
        if (res.success) {
          UI.showToast('Student added successfully!', 'success');
          UI.closeModal('add-student-modal');
          loadStudents();
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });

    loadStudents();
  },

  async deleteStudent(id) {
    if (!confirm('Are you sure you want to deactivate this student?')) return;
    try {
      const res = await API.delete(`/students/${id}`);
      if (res.success) {
        UI.showToast('Student status updated.', 'success');
        this.initStudentsPage();
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  // --- FACULTY MANAGEMENT ---
  async initFacultyPage() {
    Auth.checkRoleAccess(['admin']);

    const loadFaculty = async () => {
      const search = document.getElementById('search-faculty')?.value || '';
      try {
        const res = await API.get(`/faculty?search=${search}`);
        const tbody = document.getElementById('faculty-table-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No faculty members found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.data.map(f => `
          <tr>
            <td><strong>${f.facultyId}</strong></td>
            <td>${f.name}</td>
            <td>${f.email}</td>
            <td>${f.department?.name || 'N/A'}</td>
            <td>${f.designation}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="AdminPortal.deleteFaculty('${f._id}')">Deactivate</button>
            </td>
          </tr>
        `).join('');
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    // Load Department into Add Modal
    try {
      const deptRes = await API.get('/academic/departments');
      const deptSelect = document.getElementById('add-fac-dept');
      if (deptSelect && deptRes.data) {
        deptSelect.innerHTML = deptRes.data.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
      }
    } catch (e) {}

    document.getElementById('search-faculty')?.addEventListener('input', loadFaculty);

    // Add Faculty Form Submission
    document.getElementById('add-faculty-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        facultyId: document.getElementById('add-fac-id').value,
        name: document.getElementById('add-fac-name').value,
        email: document.getElementById('add-fac-email').value,
        phone: document.getElementById('add-fac-phone').value,
        department: document.getElementById('add-fac-dept').value,
        designation: document.getElementById('add-fac-desig').value,
        password: document.getElementById('add-fac-pw').value || 'Faculty@123'
      };

      try {
        const res = await API.post('/faculty', payload);
        if (res.success) {
          UI.showToast('Faculty member added successfully!', 'success');
          UI.closeModal('add-faculty-modal');
          loadFaculty();
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });

    loadFaculty();
  },

  async deleteFaculty(id) {
    if (!confirm('Are you sure you want to deactivate this faculty member?')) return;
    try {
      const res = await API.delete(`/faculty/${id}`);
      if (res.success) {
        UI.showToast('Faculty status updated.', 'success');
        this.initFacultyPage();
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  // --- DEPARTMENT MANAGEMENT ---
  async initDepartmentsPage() {
    Auth.checkRoleAccess(['admin']);

    const loadDepts = async () => {
      try {
        const res = await API.get('/academic/departments');
        const tbody = document.getElementById('dept-table-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No departments found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.data.map(d => `
          <tr>
            <td><strong>${d.code}</strong></td>
            <td>${d.name}</td>
            <td>${new Date(d.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('');
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    document.getElementById('add-dept-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('add-dept-name').value,
        code: document.getElementById('add-dept-code').value
      };
      try {
        const res = await API.post('/academic/departments', payload);
        if (res.success) {
          UI.showToast('Department created successfully!', 'success');
          UI.closeModal('add-dept-modal');
          loadDepts();
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });

    loadDepts();
  },

  // --- SUBJECT MANAGEMENT ---
  async initSubjectsPage() {
    Auth.checkRoleAccess(['admin']);

    const loadSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        const tbody = document.getElementById('subjects-table-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No subjects found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.data.map(s => `
          <tr>
            <td><strong>${s.subjectCode}</strong></td>
            <td>${s.subjectName}</td>
            <td>${s.department?.name || 'N/A'}</td>
            <td>${s.semester}</td>
            <td>${s.credits}</td>
            <td><span class="badge badge-info">${s.subjectType}</span></td>
          </tr>
        `).join('');
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    // Load Department into Subject Add Modal
    try {
      const deptRes = await API.get('/academic/departments');
      const deptSelect = document.getElementById('add-sub-dept');
      if (deptSelect && deptRes.data) {
        deptSelect.innerHTML = deptRes.data.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
      }
    } catch (e) {}

    document.getElementById('add-subject-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        subjectCode: document.getElementById('add-sub-code').value,
        subjectName: document.getElementById('add-sub-name').value,
        department: document.getElementById('add-sub-dept').value,
        semester: document.getElementById('add-sub-sem').value,
        credits: Number(document.getElementById('add-sub-credits').value),
        subjectType: document.getElementById('add-sub-type').value
      };
      try {
        const res = await API.post('/academic/subjects', payload);
        if (res.success) {
          UI.showToast('Subject created successfully!', 'success');
          UI.closeModal('add-subject-modal');
          loadSubjects();
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });

    loadSubjects();
  },

  // --- FACULTY ASSIGNMENT MANAGEMENT ---
  async initAssignmentsPage() {
    Auth.checkRoleAccess(['admin']);

    const loadAssignments = async () => {
      try {
        const res = await API.get('/academic/assignments');
        const tbody = document.getElementById('assignments-table-tbody');
        if (!tbody) return;

        if (!res.data || res.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No faculty assignments found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.data.map(a => `
          <tr>
            <td><strong>${a.faculty?.name || ''}</strong> (${a.faculty?.facultyId || ''})</td>
            <td>${a.subject?.subjectCode || ''} - ${a.subject?.subjectName || ''}</td>
            <td>${a.class?.course?.name || ''} ${a.class?.year || ''} (${a.class?.section?.name || ''})</td>
            <td>${a.semester}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="AdminPortal.deleteAssignment('${a._id}')">Remove</button>
            </td>
          </tr>
        `).join('');
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    };

    // Populate dropdowns for assignment creation
    try {
      const [facRes, subRes, classRes] = await Promise.all([
        API.get('/faculty'),
        API.get('/academic/subjects'),
        API.get('/academic/classes')
      ]);

      const facSel = document.getElementById('assign-fac-select');
      const subSel = document.getElementById('assign-sub-select');
      const classSel = document.getElementById('assign-class-select');

      if (facSel && facRes.data) {
        facSel.innerHTML = facRes.data.map(f => `<option value="${f._id}">${f.name} (${f.facultyId})</option>`).join('');
      }
      if (subSel && subRes.data) {
        subSel.innerHTML = subRes.data.map(s => `<option value="${s._id}">${s.subjectCode} - ${s.subjectName}</option>`).join('');
      }
      if (classSel && classRes.data) {
        classSel.innerHTML = classRes.data.map(c => `<option value="${c._id}">${c.course?.name || ''} - ${c.year} (${c.section?.name || ''})</option>`).join('');
      }
    } catch (e) {}

    document.getElementById('add-assignment-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        faculty: document.getElementById('assign-fac-select').value,
        subject: document.getElementById('assign-sub-select').value,
        class: document.getElementById('assign-class-select').value,
        academicYear: '2026-27',
        semester: 'Semester 1'
      };

      try {
        const res = await API.post('/academic/assignments', payload);
        if (res.success) {
          UI.showToast('Faculty assignment created successfully!', 'success');
          UI.closeModal('add-assignment-modal');
          loadAssignments();
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });

    loadAssignments();
  },

  async deleteAssignment(id) {
    if (!confirm('Are you sure you want to remove this faculty assignment?')) return;
    try {
      const res = await API.delete(`/academic/assignments/${id}`);
      if (res.success) {
        UI.showToast('Assignment removed.', 'success');
        this.initAssignmentsPage();
      }
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  },

  // --- SETTINGS MANAGEMENT ---
  async initSettingsPage() {
    Auth.checkRoleAccess(['admin']);

    try {
      const res = await API.get('/settings');
      if (res.data) {
        document.getElementById('set-min-pct').value = res.data.minAttendancePercentage || 75;
        document.getElementById('set-college-name').value = res.data.collegeName || '';
        document.getElementById('set-allow-edit').checked = res.data.allowFacultyEdit !== false;
      }
    } catch (e) {}

    document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        minAttendancePercentage: Number(document.getElementById('set-min-pct').value),
        collegeName: document.getElementById('set-college-name').value,
        allowFacultyEdit: document.getElementById('set-allow-edit').checked
      };

      try {
        const res = await API.put('/settings', payload);
        if (res.success) {
          UI.showToast('System settings updated successfully!', 'success');
        }
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    });
  }
};
