// end-to-end-tests.js
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const axios = require('axios');

// Config
const config = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:5000/api',
  users: {
    admin: {
      email: 'admin@example.com',
      password: 'admin123'
    },
    standard: {
      email: 'user@example.com',
      password: 'user123'
    }
  },
  testPaths: {
    sourceFolder: path.join(__dirname, 'e2e-test-data')
  }
};

// Setup test data
const setupTestData = () => {
  // Create test folder with files
  fs.ensureDirSync(config.testPaths.sourceFolder);
  fs.writeFileSync(path.join(config.testPaths.sourceFolder, 'test1.txt'), 'E2E test file 1');
  fs.writeFileSync(path.join(config.testPaths.sourceFolder, 'test2.txt'), 'E2E test file 2');

  // Create nested folders
  fs.ensureDirSync(path.join(config.testPaths.sourceFolder, 'documents'));
  fs.writeFileSync(
    path.join(config.testPaths.sourceFolder, 'documents', 'doc1.txt'),
    'E2E test document'
  );
};

// Clean up test data
const cleanupTestData = () => {
  fs.removeSync(config.testPaths.sourceFolder);
};

/**
 * End-to-end tests for the backup system
 */
const runEndToEndTests = async () => {
  console.log('🚀 Starting end-to-end tests for the backup system...');

  // Setup test data
  setupTestData();

  const browser = await puppeteer.launch({
    headless: false, // Set to true in CI environment
    defaultViewport: null,
    args: ['--window-size=1280,800']
  });

  try {
    // Create a new page
    const page = await browser.newPage();

    // 1. Test login flow
    console.log('🧪 Testing login flow...');
    await page.goto(`${config.baseUrl}/login`);

    // Login as standard user
    await page.type('[data-test="email-input"]', config.users.standard.email);
    await page.type('[data-test="password-input"]', config.users.standard.password);
    await page.click('[data-test="login-button"]');

    // Verify redirect to dashboard
    await page.waitForSelector('[data-test="user-dashboard"]');
    console.log('✅ Login successful');

    // 2. Test creating a manual backup
    console.log('🧪 Testing manual backup creation...');

    // Fill backup form
    await page.select('[data-test="backup-type-select"]', 'complete');
    await page.select('[data-test="destination-select"]', 'local');

    // Need to handle file system dialog for folder selection
    // This is a challenge in Puppeteer - we'll simulate this part by directly setting the value
    await page.evaluate(() => {
      document.querySelector('[data-test="source-path"]').value = '/simulated/path';
    });

    // Submit the form
    await page.click('[data-test="create-backup-button"]');

    // Wait for success message
    await page.waitForSelector('[data-test="success-message"]');
    console.log('✅ Manual backup created');

    // 3. Test backup filtering
    console.log('🧪 Testing backup filtering...');

    // Navigate to backup history if needed
    if (!(await page.$('[data-test="backup-list"]'))) {
      await page.click('[data-test="backup-history-tab"]');
      await page.waitForSelector('[data-test="backup-list"]');
    }

    // Apply filter
    await page.select('[data-test="status-filter"]', 'completed');
    await page.click('[data-test="apply-filters-button"]');

    // Verify filter applied
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('[data-test="backup-list-item"]');
      return Array.from(items).every(item => item.textContent.includes('Completed'));
    });

    console.log('✅ Backup filtering works');

    // 4. Test backup deletion
    console.log('🧪 Testing backup deletion...');

    // Get count of backups before deletion
    const beforeCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-test="backup-list-item"]').length;
    });

    // Delete the first backup
    await page.click('[data-test="delete-button"]');

    // Confirm deletion
    await page.waitForSelector('[data-test="confirm-delete-button"]');
    await page.click('[data-test="confirm-delete-button"]');

    // Wait for success message
    await page.waitForSelector('[data-test="success-message"]');

    // Verify count decreased
    await page.waitForFunction((beforeCount) => {
      return document.querySelectorAll('[data-test="backup-list-item"]').length < beforeCount;
    }, {}, beforeCount);

    console.log('✅ Backup deletion works');

    // 5. Test logout
    console.log('🧪 Testing logout...');
    await page.click('[data-test="logout-button"]');
    await page.waitForSelector('[data-test="login-form"]');
    console.log('✅ Logout successful');

    // 6. Test admin login and features
    console.log('🧪 Testing admin features...');

    // Login as admin
    await page.type('[data-test="email-input"]', config.users.admin.email);
    await page.type('[data-test="password-input"]', config.users.admin.password);
    await page.click('[data-test="login-button"]');

    // Verify admin dashboard
    await page.waitForSelector('[data-test="admin-dashboard"]');
    console.log('✅ Admin login successful');

    // Test user management
    await page.waitForSelector('[data-test="user-list"]');
    const hasUsers = await page.evaluate(() => {
      return document.querySelectorAll('[data-test="user-list-item"]').length > 0;
    });
    assert(hasUsers, 'Admin should see users in user management');
    console.log('✅ User management visible');

    // Test invite generation
    await page.click('[data-test="generate-invite-button"]');
    await page.waitForSelector('[data-test="invite-code"]');
    console.log('✅ Invite code generation works');

    // 7. Test scheduled backup creation
    console.log('🧪 Testing scheduled backup creation...');

    // Navigate to backup creation
    await page.click('[data-test="backup-creation-tab"]');

    // Select user (admin can select users)
    await page.select('[data-test="selected-user"]', config.users.standard.email);

    // Fill scheduled backup form
    await page.select('[data-test="backup-type-select"]', 'complete');
    await page.select('[data-test="destination-select"]', 'cloud');
    await page.select('[data-test="schedule-type"]', 'daily');

    // Set time (implementation depends on your date picker)
    await page.evaluate(() => {
      document.querySelector('[data-test="schedule-time"]').value = '10:00';
    });

    // Submit the form
    await page.click('[data-test="create-backup-button"]');

    // Wait for success message
    await page.waitForSelector('[data-test="success-message"]');
    console.log('✅ Scheduled backup created');

    // 8. Test advanced filtering
    console.log('🧪 Testing advanced backup filtering as admin...');

    // Navigate to backup history
    await page.click('[data-test="backup-history-tab"]');

    // Apply multiple filters
    await page.select('[data-test="user-filter"]', config.users.standard.email);
    await page.select('[data-test="type-filter"]', 'complete');
    await page.click('[data-test="apply-filters-button"]');

    // Verify filters applied (complex check - might need adjustment based on real UI)
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('[data-test="backup-list-item"]');
      return items.length > 0 &&
             Array.from(items).every(item =>
               item.textContent.includes('Complete') &&
               item.textContent.includes('user@example.com')
             );
    });

    console.log('✅ Advanced filtering works');

    // 9. Test force running a scheduled backup
    console.log('🧪 Testing force run of scheduled backup...');

    // Find the scheduled backup and click force run
    await page.click('[data-test="force-run-button"]');

    // Wait for success message
    await page.waitForSelector('[data-test="success-message"]');
    console.log('✅ Force run initiated');

    // 10. Test database integrity via API
    console.log('🧪 Testing database integrity via API...');

    // Get the token for API calls
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });

    // Use the token to make API calls
    const usersResponse = await axios.get(`${config.apiUrl}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert(Array.isArray(usersResponse.data), 'API should return user array');
    console.log('✅ API user endpoint integrity verified');

    const backupsResponse = await axios.get(`${config.apiUrl}/backups`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert(Array.isArray(backupsResponse.data.backups), 'API should return backups array');
    console.log('✅ API backups endpoint integrity verified');

    console.log('🎉 All end-to-end tests completed successfully!');

  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
    // Take screenshot of failure
    if (page) {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('📸 Error screenshot saved to error-screenshot.png');
    }
  } finally {
    // Close browser
    await browser.close();

    // Clean up test data
    cleanupTestData();
  }
};

// Run the end-to-end tests
runEndToEndTests();