// Script to clear authentication data and check current user
console.log('=== Current Authentication Data ===');

// Check what's currently stored
const currentToken = localStorage.getItem('ems_token');
const currentUser = localStorage.getItem('ems_user');

console.log('Current Token:', currentToken ? 'Present' : 'Not found');
console.log('Current User Data:', currentUser ? JSON.parse(currentUser) : 'Not found');

// Clear authentication data
localStorage.removeItem('ems_token');
localStorage.removeItem('ems_user');

console.log('=== Authentication Data Cleared ===');
console.log('Please refresh the page and login again with your credentials.');

// Reload the page to redirect to login
  window.location.href = '/auth/login';
