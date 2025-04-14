// cypress/integration/backup_system_spec.js

describe("Backup System UI Tests", () => {
  // Login helper function
  const login = (email, password) => {
    cy.visit("/login");
    cy.get('[data-test="email-input"]').type(email);
    cy.get('[data-test="password-input"]').type(password);
    cy.get('[data-test="login-button"]').click();
    cy.url().should("include", "/dashboard");
  };

  describe("Authentication Tests", () => {
    it("should login as admin successfully", () => {
      login("admin@example.com", "admin123");
      cy.contains("Admin Dashboard").should("be.visible");
    });

    it("should login as standard user successfully", () => {
      login("user@example.com", "user123");
      cy.contains("User Dashboard").should("be.visible");
    });

    it("should show error with invalid credentials", () => {
      cy.visit("/login");
      cy.get('[data-test="email-input"]').type("wrong@example.com");
      cy.get('[data-test="password-input"]').type("wrongpassword");
      cy.get('[data-test="login-button"]').click();
      cy.contains("Invalid email or password").should("be.visible");
    });
  });

  describe("User Dashboard Tests", () => {
    beforeEach(() => {
      login("user@example.com", "user123");
    });

    it("should display the backup creation form", () => {
      cy.contains("Create New Backup").should("be.visible");
      cy.get('[data-test="backup-type-select"]').should("be.visible");
      cy.get('[data-test="destination-select"]').should("be.visible");
    });

    it("should create a complete backup", () => {
      cy.get('[data-test="backup-type-select"]').select("complete");
      cy.get('[data-test="destination-select"]').select("cloud");
      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Backup created successfully").should("be.visible");
    });

    it("should create a partial backup", () => {
      cy.get('[data-test="backup-type-select"]').select("partial");
      // Selecting files would require a file input mock
      cy.get('[data-test="destination-select"]').select("local");
      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Backup created successfully").should("be.visible");
    });

    it("should display backup history", () => {
      cy.contains("Backup History").should("be.visible");
      cy.get(".backup-list-item").should("have.length.at.least", 1);
    });

    it("should filter backups by status", () => {
      cy.get('[data-test="status-filter"]').select("completed");
      cy.get('[data-test="apply-filters-button"]').click();
      cy.get(".backup-list-item").each(($el) => {
        cy.wrap($el).contains("Completed");
      });
    });

    it("should filter backups by type", () => {
      cy.get('[data-test="type-filter"]').select("complete");
      cy.get('[data-test="apply-filters-button"]').click();
      cy.get(".backup-list-item").each(($el) => {
        cy.wrap($el).contains("Complete");
      });
    });

    it("should restore a backup", () => {
      cy.get(".backup-list-item:first").within(() => {
        cy.get('[data-test="restore-button"]').click();
      });
      cy.contains("Confirm Restoration").should("be.visible");
      cy.get('[data-test="confirm-restore-button"]').click();
      cy.contains("Backup restoration initiated").should("be.visible");
    });

    it("should delete a backup", () => {
      cy.get(".backup-list-item:first").within(() => {
        cy.get('[data-test="delete-button"]').click();
      });
      cy.contains("Confirm Deletion").should("be.visible");
      cy.get('[data-test="confirm-delete-button"]').click();
      cy.contains("Backup deleted successfully").should("be.visible");
    });
  });

  describe("Admin Dashboard Tests", () => {
    beforeEach(() => {
      login("admin@example.com", "admin123");
    });

    it("should display user management section", () => {
      cy.contains("User Management").should("be.visible");
      cy.get(".user-list-item").should("have.length.at.least", 1);
    });

    it("should display invite user section", () => {
      cy.contains("Invite Standard User").should("be.visible");
      cy.get('[data-test="generate-invite-button"]').should("be.visible");
    });

    it("should generate invite code", () => {
      cy.get('[data-test="generate-invite-button"]').click();
      cy.get('[data-test="invite-code"]').should("be.visible");
    });

    it("should display all users backups", () => {
      cy.contains("Backup History").should("be.visible");
      cy.get(".backup-list-item").should("have.length.at.least", 1);
    });

    it("should filter backups by user", () => {
      cy.get('[data-test="user-filter"]').select("user@example.com");
      cy.get('[data-test="apply-filters-button"]').click();
      cy.get(".backup-list-item").each(($el) => {
        cy.wrap($el).contains("user@example.com");
      });
    });

    it("should create backup for another user", () => {
      cy.get('[data-test="selected-user"]').select("user@example.com");
      cy.get('[data-test="backup-type-select"]').select("complete");
      cy.get('[data-test="destination-select"]').select("cloud");
      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Backup created successfully").should("be.visible");
    });
  });

  describe("Schedule Backup Tests", () => {
    beforeEach(() => {
      login("user@example.com", "user123");
    });

    it("should create daily scheduled backup", () => {
      cy.get('[data-test="backup-type-select"]').select("complete");
      cy.get('[data-test="destination-select"]').select("cloud");
      cy.get('[data-test="schedule-type"]').select("daily");

      // Set time (this will depend on how your date/time picker is implemented)
      cy.get('[data-test="schedule-time"]').click();
      cy.get(".time-picker-hour").contains("10").click();
      cy.get(".time-picker-minute").contains("00").click();

      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Scheduled backup created successfully").should("be.visible");
    });

    it("should create weekly scheduled backup", () => {
      cy.get('[data-test="backup-type-select"]').select("complete");
      cy.get('[data-test="destination-select"]').select("cloud");
      cy.get('[data-test="schedule-type"]').select("weekly");

      cy.get('[data-test="schedule-day"]').select("Monday");

      // Set time
      cy.get('[data-test="schedule-time"]').click();
      cy.get(".time-picker-hour").contains("10").click();
      cy.get(".time-picker-minute").contains("00").click();

      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Scheduled backup created successfully").should("be.visible");
    });

    it("should create monthly scheduled backup", () => {
      // cypress/integration/backup_system_spec.js (continued)

      cy.get('[data-test="backup-type-select"]').select("complete");
      cy.get('[data-test="destination-select"]').select("cloud");
      cy.get('[data-test="schedule-type"]').select("monthly");

      cy.get('[data-test="schedule-month-day"]').select("1");

      // Set time
      cy.get('[data-test="schedule-time"]').click();
      cy.get(".time-picker-hour").contains("10").click();
      cy.get(".time-picker-minute").contains("00").click();

      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Scheduled backup created successfully").should("be.visible");
    });
  });

  describe("Error Handling Tests", () => {
    beforeEach(() => {
      login("user@example.com", "user123");
    });

    it("should show error for invalid source path", () => {
      // This test assumes you have a way to input custom paths
      cy.get('[data-test="backup-type-select"]').select("partial");
      cy.get('[data-test="custom-source-input"]').type("/non/existent/path");
      cy.get('[data-test="destination-select"]').select("local");
      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Invalid source path").should("be.visible");
    });

    it("should show error for insufficient permissions", () => {
      // Simulate a permission error by attempting to backup a restricted location
      cy.get('[data-test="backup-type-select"]').select("partial");
      cy.get('[data-test="custom-source-input"]').type("/root/restricted");
      cy.get('[data-test="destination-select"]').select("local");
      cy.get('[data-test="create-backup-button"]').click();
      cy.contains("Permission denied").should("be.visible");
    });
  });

  describe("Responsive Design Tests", () => {
    beforeEach(() => {
      login("user@example.com", "user123");
    });

    it("should display correctly on mobile devices", () => {
      cy.viewport("iphone-x");
      cy.contains("User Dashboard").should("be.visible");
      cy.get(".mobile-menu-toggle").should("be.visible").click();
      cy.contains("Create New Backup").should("be.visible");
    });

    it("should display correctly on tablets", () => {
      cy.viewport("ipad-2");
      cy.contains("User Dashboard").should("be.visible");
      cy.contains("Create New Backup").should("be.visible");
      cy.contains("Backup History").should("be.visible");
    });

    it("should display correctly on desktop", () => {
      cy.viewport(1920, 1080);
      cy.contains("User Dashboard").should("be.visible");
      cy.contains("Create New Backup").should("be.visible");
      cy.contains("Backup History").should("be.visible");
    });
  });
});
