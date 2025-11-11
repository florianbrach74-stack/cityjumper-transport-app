// Test if employee-assignment route loads correctly
const express = require('express');
const app = express();

try {
  console.log('Testing employee-assignment route...');
  const employeeRoute = require('./server/routes/employee-assignment');
  console.log('✅ Route loaded successfully!');
  console.log('Route type:', typeof employeeRoute);
  console.log('Route stack:', employeeRoute.stack ? employeeRoute.stack.map(r => r.route?.path) : 'No stack');
} catch (error) {
  console.error('❌ Error loading route:', error.message);
  console.error('Stack:', error.stack);
}
