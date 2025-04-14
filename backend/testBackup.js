// backup-test-suite.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const assert = require("assert");
const { exec } = require("child_process");

// Configuration
const config = {
  apiUrl: "http://localhost:5000/api",
  testUsers: {
    admin: {
      email: "admin@example.com",
      password: "admin123",
    },
    standard: {
      email: "user@example.com",
      password: "user123",
    },
  },
  testPaths: {
    sourceFolder: path.join(__dirname, "test-data"),
    destinationFolder: path.join(__dirname, "test-backups"),
  },
};

// Ensure test directories exist
fs.ensureDirSync(config.testPaths.sourceFolder);
fs.ensureDirSync(config.testPaths.destinationFolder);

// Create test files
const setupTestFiles = () => {
  console.log("🔧 Setting up test files...");

  // Create main test directory with files
  const testDir = config.testPaths.sourceFolder;

  // Create subdirectories
  fs.ensureDirSync(path.join(testDir, "documents"));
  fs.ensureDirSync(path.join(testDir, "images"));
  fs.ensureDirSync(path.join(testDir, "data"));

  // Create test files with content
  fs.writeFileSync(path.join(testDir, "test1.txt"), "This is test file 1");
  fs.writeFileSync(path.join(testDir, "test2.txt"), "This is test file 2");
  fs.writeFileSync(
    path.join(testDir, "documents", "doc1.txt"),
    "This is document 1"
  );
  fs.writeFileSync(
    path.join(testDir, "images", "img1.txt"),
    "This is a placeholder for image 1"
  );
  fs.writeFileSync(
    path.join(testDir, "data", "data1.json"),
    JSON.stringify({ name: "Test Data", value: 123 })
  );

  console.log("✅ Test files created successfully");
};

// Clean up test backups
const cleanupTestBackups = () => {
  console.log("🧹 Cleaning up test backups...");
  fs.emptyDirSync(config.testPaths.destinationFolder);
  console.log("✅ Test backups cleaned up successfully");
};

//authenticate
const authenticate = async (userType = "admin") => {
  try {
    const user = config.testUsers[userType];
    console.log(`🔑 Authenticating as ${userType}...`);
    console.log(`Using credentials: ${user.email}`);

    const response = await axios.post(`${config.apiUrl}/auth/login`, {
      email: user.email,
      password: user.password,
    });

    console.log(`✅ Authentication successful as ${userType}`);
    return response.data.token;
  } catch (error) {
    console.error(`❌ Authentication failed for ${userType}:`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else if (error.request) {
      console.error(`No response received:`, error.message);
    } else {
      console.error(`Error setting up request:`, error.message);
    }
    throw error;
  }
};

// Test functions
const tests = {
  // 1. Test manual backup creation
  testManualBackup: async (token, backupType = "complete") => {
    try {
      console.log(`🧪 Testing manual ${backupType} backup creation...`);

      const testData = {
        backupType: backupType,
        source: config.testPaths.sourceFolder,
        destination: config.testPaths.destinationFolder,
        schedule: "manual",
        backupSource: backupType === "complete" ? "all" : "selected",
        filePaths: backupType === "partial" ? ["test1.txt"] : [],
        folderPaths: backupType === "partial" ? ["documents"] : [],
      };

      const response = await axios.post(
        `${config.apiUrl}/backups/create`,
        testData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(
        `✅ ${backupType} backup created successfully:`,
        response.data
      );

      // In a real scenario, we would check backup files here
      // For now we just verify the API response
      assert(response.data.backupId, "Backup ID should be present in response");

      return response.data.backupId;
    } catch (error) {
      console.error(
        "❌ Backup creation failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 2. Test scheduled backup creation
  testScheduledBackup: async (token, scheduleType = "daily") => {
    try {
      console.log(`🧪 Testing ${scheduleType} scheduled backup creation...`);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const testData = {
        backupType: "complete",
        source: config.testPaths.sourceFolder,
        destination: config.testPaths.destinationFolder,
        schedule: scheduleType,
        scheduledTime:
          scheduleType === "daily"
            ? tomorrow
            : scheduleType === "weekly"
            ? { day: "Monday", time: tomorrow }
            : { day: 1, time: tomorrow },
      };

      const response = await axios.post(
        `${config.apiUrl}/backups/create`,
        testData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(
        `✅ ${scheduleType} scheduled backup created successfully:`,
        response.data
      );
      assert(response.data.backupId, "Backup ID should be present in response");

      return response.data.backupId;
    } catch (error) {
      console.error(
        `❌ ${scheduleType} backup creation failed:`,
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 3. Test backup listing
  testBackupListing: async (token) => {
    try {
      console.log("🧪 Testing backup listing...");

      const response = await axios.get(`${config.apiUrl}/backups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        `✅ Retrieved ${response.data.backups.length} backups successfully`
      );
      assert(
        Array.isArray(response.data.backups),
        "Response should contain an array of backups"
      );

      return response.data.backups;
    } catch (error) {
      console.error(
        "❌ Backup listing failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 4. Test backup restoration
  testBackupRestore: async (token, backupId) => {
    try {
      console.log(`🧪 Testing backup restoration for backup ID ${backupId}...`);

      const response = await axios.post(
        `${config.apiUrl}/backups/restore`,
        { backupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(
        "✅ Backup restoration initiated successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Backup restoration failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 5. Test backup deletion
  testBackupDeletion: async (token, backupId) => {
    try {
      console.log(`🧪 Testing backup deletion for backup ID ${backupId}...`);

      const response = await axios.delete(
        `${config.apiUrl}/backups/${backupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Backup deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Backup deletion failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 6. Test admin functions - user listing
  testUserListing: async (token) => {
    try {
      console.log("🧪 Testing user listing (admin function)...");

      const response = await axios.get(`${config.apiUrl}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Retrieved ${response.data.length} users successfully`);
      assert(
        Array.isArray(response.data),
        "Response should contain an array of users"
      );

      return response.data;
    } catch (error) {
      console.error(
        "❌ User listing failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 7. Test invite generation (admin function)
  testInviteGeneration: async (token) => {
    try {
      console.log("🧪 Testing invite code generation...");

      const response = await axios.get(
        `${config.apiUrl}/auth/invite`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Invite code generated successfully:", response.data);
      assert(
        response.data.invitationLink,
        "Response should contain an invitation link"
      );

      return response.data.invitationLink;
    } catch (error) {
      console.error(
        "❌ Invite generation failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 8. Test error handling - invalid source path
  testErrorHandling: async (token) => {
    try {
      console.log("🧪 Testing error handling with invalid source path...");

      const testData = {
        backupType: "complete",
        source: "/path/that/does/not/exist",
        destination: config.testPaths.destinationFolder,
        schedule: "manual",
      };

      await axios.post(`${config.apiUrl}/backups/create`, testData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.error(
        "❌ Test failed: Expected error for invalid path but got success"
      );
      throw new Error("Expected error was not thrown");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(
          "✅ Error handling test passed: Server correctly rejected invalid path"
        );
        return true;
      } else {
        console.error(
          "❌ Unexpected error during error handling test:",
          error.message
        );
        throw error;
      }
    }
  },

  // 9. Test filtering of backups
  testBackupFiltering: async (token, filter) => {
    try {
      console.log(
        `🧪 Testing backup filtering with ${JSON.stringify(filter)}...`
      );

      const response = await axios.get(`${config.apiUrl}/backups`, {
        params: filter,
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        `✅ Retrieved ${response.data.backups.length} filtered backups successfully`
      );
      return response.data.backups;
    } catch (error) {
      console.error(
        "❌ Backup filtering failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  // 10. Test force running of scheduled backup (simulate cron job)
  testForceScheduledBackup: async (token, backupId) => {
    try {
      console.log(
        `🧪 Testing forced execution of scheduled backup ${backupId}...`
      );

      const response = await axios.post(
        `${config.apiUrl}/backups/force-run`,
        { backupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Scheduled backup forced successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Force scheduled backup failed:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
};

// Main test runner
const runAllTests = async () => {
  console.log("🚀 Starting backup system tests...");

  try {
    // Setup test environment
    setupTestFiles();

    // Get authentication tokens
    const adminToken = await authenticate("admin");
    const userToken = await authenticate("standard");

    // Run tests as admin
    console.log("\n📋 Running admin tests...");
    const users = await tests.testUserListing(adminToken);
    const inviteCode = await tests.testInviteGeneration(adminToken);

    // Run backup tests
    console.log("\n📋 Running backup tests...");
    const completeBackupId = await tests.testManualBackup(
      adminToken,
      "complete"
    );
    const partialBackupId = await tests.testManualBackup(adminToken, "partial");
    const scheduledBackupId = await tests.testScheduledBackup(
      adminToken,
      "daily"
    );

    // List all backups
    const backups = await tests.testBackupListing(adminToken);

    // Test filtering
    const filteredBackups = await tests.testBackupFiltering(adminToken, {
      status: "completed",
    });

    // Test restoration
    await tests.testBackupRestore(adminToken, completeBackupId);

    // Force a scheduled backup
    await tests.testForceScheduledBackup(adminToken, scheduledBackupId);

    // Test error handling
    await tests.testErrorHandling(adminToken);

    // Run tests as standard user
    console.log("\n📋 Running standard user tests...");
    await tests.testManualBackup(userToken, "complete");
    await tests.testBackupListing(userToken);

    // Delete test backups
    await tests.testBackupDeletion(adminToken, partialBackupId);

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
  } finally {
    // Clean up
    cleanupTestBackups();
  }
};

// Run all tests
runAllTests();
