// Database migration runner for KeyBox
// Handles database schema creation and updates with proper error handling

import { DatabaseConnection } from './databaseService';
import fs from 'fs/promises';
import path from 'path';

export interface Migration {
  version: string;
  description: string;
  filename: string;
  appliedAt?: string;
}

export interface MigrationResult {
  success: boolean;
  migrationsApplied: string[];
  errors: string[];
  totalMigrations: number;
}

export class DatabaseMigrationRunner {
  private connection: DatabaseConnection;
  private migrationsPath: string;

  constructor(connection: DatabaseConnection, migrationsPath?: string) {
    this.connection = connection;
    this.migrationsPath = migrationsPath || path.join(__dirname, 'migrations');
  }

  // Run all pending migrations
  async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migrationsApplied: [],
      errors: [],
      totalMigrations: 0,
    };

    try {
      // Ensure migrations table exists
      await this.ensureMigrationsTable();

      // Get available migrations
      const availableMigrations = await this.getAvailableMigrations();
      result.totalMigrations = availableMigrations.length;

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));

      // Find pending migrations
      const pendingMigrations = availableMigrations.filter(
        m => !appliedVersions.has(m.version)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations found.');
        return result;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations.`);

      // Apply each pending migration
      for (const migration of pendingMigrations) {
        try {
          console.log(`Applying migration: ${migration.version} - ${migration.description}`);
          await this.applyMigration(migration);
          result.migrationsApplied.push(migration.version);
          console.log(`✓ Migration ${migration.version} applied successfully`);
        } catch (error) {
          const errorMsg = `Failed to apply migration ${migration.version}: ${error.message}`;
          console.error(`✗ ${errorMsg}`);
          result.errors.push(errorMsg);
          result.success = false;
          break; // Stop on first error
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration runner error: ${error.message}`);
    }

    return result;
  }

  // Create a new migration file
  async createMigration(description: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const version = timestamp.substring(0, 8) + '_' + timestamp.substring(8);
    const filename = `${version}_${description.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    const template = `-- Migration: ${description}
-- Version: ${version}
-- Created: ${new Date().toISOString()}

-- Add your SQL statements here
-- Example:
-- CREATE TABLE example (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     createdAt TEXT NOT NULL DEFAULT (datetime('now'))
-- );

-- Don't forget to add indexes if needed
-- CREATE INDEX idx_example_name ON example (name);

-- Record this migration
INSERT OR IGNORE INTO migrations (version, description, appliedAt) 
VALUES ('${version}', '${description}', datetime('now'));
`;

    await fs.writeFile(filepath, template, 'utf8');
    console.log(`Created migration file: ${filename}`);
    return filename;
  }

  // Get migration status
  async getMigrationStatus(): Promise<{
    applied: Migration[];
    pending: Migration[];
    total: number;
  }> {
    await this.ensureMigrationsTable();
    
    const available = await this.getAvailableMigrations();
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    const pending = available.filter(m => !appliedVersions.has(m.version));

    return {
      applied,
      pending,
      total: available.length,
    };
  }

  // Rollback last migration (if rollback script exists)
  async rollbackLastMigration(): Promise<boolean> {
    try {
      const applied = await this.getAppliedMigrations();
      if (applied.length === 0) {
        console.log('No migrations to rollback.');
        return true;
      }

      const lastMigration = applied[applied.length - 1];
      const rollbackFile = path.join(
        this.migrationsPath, 
        'rollbacks', 
        `${lastMigration.version}_rollback.sql`
      );

      try {
        const rollbackSql = await fs.readFile(rollbackFile, 'utf8');
        
        await this.connection.transaction(async (tx) => {
          // Execute rollback SQL
          const statements = this.splitSqlStatements(rollbackSql);
          for (const statement of statements) {
            if (statement.trim()) {
              await tx.execute(statement);
            }
          }
          
          // Remove migration record
          await tx.execute(
            'DELETE FROM migrations WHERE version = ?',
            [lastMigration.version]
          );
        });

        console.log(`✓ Rolled back migration: ${lastMigration.version}`);
        return true;
      } catch (fileError) {
        console.error(`Rollback file not found: ${rollbackFile}`);
        return false;
      }
    } catch (error) {
      console.error(`Rollback failed: ${error.message}`);
      return false;
    }
  }

  // Private methods

  private async ensureMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        appliedAt TEXT NOT NULL
      )
    `;
    await this.connection.execute(sql);
  }

  private async getAvailableMigrations(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const sqlFiles = files
        .filter(file => file.endsWith('.sql') && !file.includes('rollback'))
        .sort();

      return sqlFiles.map(filename => {
        const version = filename.split('_')[0];
        const description = filename
          .replace(/^\d+_/, '')
          .replace(/\.sql$/, '')
          .replace(/_/g, ' ');
        
        return {
          version,
          description,
          filename,
        };
      });
    } catch (error) {
      console.error(`Error reading migrations directory: ${error.message}`);
      return [];
    }
  }

  private async getAppliedMigrations(): Promise<Migration[]> {
    try {
      const results = await this.connection.query<Migration>(
        'SELECT version, description, appliedAt FROM migrations ORDER BY appliedAt ASC'
      );
      return results;
    } catch (error) {
      // If migrations table doesn't exist yet, return empty array
      return [];
    }
  }

  private async applyMigration(migration: Migration): Promise<void> {
    const filepath = path.join(this.migrationsPath, migration.filename);
    const sql = await fs.readFile(filepath, 'utf8');

    await this.connection.transaction(async (tx) => {
      const statements = this.splitSqlStatements(sql);
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed && !trimmed.startsWith('--')) {
          await tx.execute(trimmed);
        }
      }
    });
  }

  private splitSqlStatements(sql: string): string[] {
    // Simple SQL statement splitter
    // Note: This is basic and may not handle all edge cases
    return sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  }

  // Utility methods for database setup

  static async initializeDatabase(connection: DatabaseConnection): Promise<MigrationResult> {
    const runner = new DatabaseMigrationRunner(connection);
    return await runner.runMigrations();
  }

  static async createInitialMigration(migrationsPath: string): Promise<void> {
    // Ensure migrations directory exists
    try {
      await fs.access(migrationsPath);
    } catch {
      await fs.mkdir(migrationsPath, { recursive: true });
    }

    // Create rollbacks directory
    const rollbacksPath = path.join(migrationsPath, 'rollbacks');
    try {
      await fs.access(rollbacksPath);
    } catch {
      await fs.mkdir(rollbacksPath, { recursive: true });
    }

    console.log(`Migrations directory initialized: ${migrationsPath}`);
  }

  // Database health check
  async checkDatabaseHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    tableCount: number;
    indexCount: number;
  }> {
    const issues: string[] = [];
    let tableCount = 0;
    let indexCount = 0;

    try {
      // Check if all required tables exist
      const requiredTables = [
        'users', 'ciphers', 'folders', 'collections', 
        'organizations', 'devices', 'securityEvents', 'backups'
      ];

      const tables = await this.connection.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      const existingTables = new Set(tables.map(t => t.name));
      tableCount = existingTables.size;

      for (const table of requiredTables) {
        if (!existingTables.has(table)) {
          issues.push(`Missing required table: ${table}`);
        }
      }

      // Check indexes
      const indexes = await this.connection.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      );
      indexCount = indexes.length;

      // Check migrations table
      if (!existingTables.has('migrations')) {
        issues.push('Missing migrations table');
      }

    } catch (error) {
      issues.push(`Database health check failed: ${error.message}`);
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      tableCount,
      indexCount,
    };
  }
}
