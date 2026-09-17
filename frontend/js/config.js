// API Configuration Settings
const CONFIG = {
  // Use relative path '/api' when hosted together, or explicit server URL if separate
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api',
  STORAGE_KEY_TOKEN: 'college_attendance_token',
  STORAGE_KEY_USER: 'college_attendance_user'
};
