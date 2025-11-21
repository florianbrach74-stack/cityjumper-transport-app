const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class DatabaseBackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.maxBackups = 30; // Keep last 30 backups
  }

  /**
   * Startet den Backup-Service (täglich um 2:00 Uhr)
   */
  startBackupService() {
    console.log('💾 [Database Backup] Service started - running daily at 2:00 AM');
    
    // Erstelle Backup-Verzeichnis
    this.ensureBackupDirectory();
    
    // Sofort einmal ausführen (für Testing)
    // this.createBackup(); // Auskommentiert für Production
    
    // Täglich um 2:00 Uhr
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      2, 0, 0, 0
    );
    
    const msUntilScheduled = scheduledTime - now;
    
    setTimeout(() => {
      this.createBackup();
      // Dann alle 24 Stunden wiederholen
      setInterval(() => {
        this.createBackup();
      }, 24 * 60 * 60 * 1000);
    }, msUntilScheduled);
  }

  /**
   * Erstellt Backup-Verzeichnis
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('✅ [Backup] Backup directory ready:', this.backupDir);
    } catch (error) {
      console.error('❌ [Backup] Error creating backup directory:', error);
    }
  }

  /**
   * Erstellt ein Datenbank-Backup
   */
  async createBackup() {
    try {
      console.log('💾 [Backup] Starting database backup...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Verwende DATABASE_URL aus Environment
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        console.error('❌ [Backup] DATABASE_URL not set');
        return;
      }

      // pg_dump Command
      const command = `pg_dump "${databaseUrl}" > "${filepath}"`;

      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ [Backup] Error creating backup:', error);
            reject(error);
            return;
          }
          
          if (stderr) {
            console.log('⚠️ [Backup] Warnings:', stderr);
          }
          
          resolve();
        });
      });

      // Prüfe Backup-Größe
      const stats = await fs.stat(filepath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`✅ [Backup] Backup created: ${filename} (${sizeMB} MB)`);

      // Cleanup alte Backups
      await this.cleanupOldBackups();

      return {
        success: true,
        filename,
        size: stats.size,
        sizeMB
      };

    } catch (error) {
      console.error('❌ [Backup] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Löscht alte Backups (behalte nur die letzten N)
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f)
        }));

      // Sortiere nach Datum (neueste zuerst)
      backupFiles.sort((a, b) => b.name.localeCompare(a.name));

      // Lösche alte Backups
      if (backupFiles.length > this.maxBackups) {
        const toDelete = backupFiles.slice(this.maxBackups);
        
        for (const file of toDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️ [Backup] Deleted old backup: ${file.name}`);
        }

        console.log(`✅ [Backup] Cleanup complete: ${toDelete.length} old backups deleted`);
      }

    } catch (error) {
      console.error('❌ [Backup] Error cleaning up old backups:', error);
    }
  }

  /**
   * Liste alle Backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = [];

      for (const file of files) {
        if (file.startsWith('backup_') && file.endsWith('.sql')) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          
          backupFiles.push({
            filename: file,
            size: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      // Sortiere nach Datum (neueste zuerst)
      backupFiles.sort((a, b) => b.created - a.created);

      return backupFiles;

    } catch (error) {
      console.error('❌ [Backup] Error listing backups:', error);
      return [];
    }
  }

  /**
   * Restore Backup (VORSICHT!)
   */
  async restoreBackup(filename) {
    try {
      console.log(`⚠️ [Backup] Restoring backup: ${filename}`);
      
      const filepath = path.join(this.backupDir, filename);
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error('DATABASE_URL not set');
      }

      // Prüfe ob Backup existiert
      await fs.access(filepath);

      // psql Command
      const command = `psql "${databaseUrl}" < "${filepath}"`;

      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ [Backup] Error restoring backup:', error);
            reject(error);
            return;
          }
          
          if (stderr) {
            console.log('⚠️ [Backup] Warnings:', stderr);
          }
          
          resolve();
        });
      });

      console.log(`✅ [Backup] Backup restored: ${filename}`);

      return {
        success: true,
        filename
      };

    } catch (error) {
      console.error('❌ [Backup] Error restoring backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseBackupService();
