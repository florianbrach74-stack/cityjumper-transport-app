const cron = require('node-cron');
const { cleanupExpiredUnverifiedAccounts } = require('./emailVerificationTokenService');

/**
 * Starte Cleanup-Service
 * Läuft alle 30 Minuten und löscht abgelaufene unverifizierte Accounts
 */
function startCleanupService() {
  // Läuft alle 30 Minuten
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('🧹 [Cleanup] Starte Cleanup von abgelaufenen Accounts...');
      const result = await cleanupExpiredUnverifiedAccounts();
      
      if (result.deleted > 0) {
        console.log(`🧹 [Cleanup] ${result.deleted} abgelaufene Accounts gelöscht`);
      } else {
        console.log('🧹 [Cleanup] Keine abgelaufenen Accounts gefunden');
      }
    } catch (error) {
      console.error('❌ [Cleanup] Fehler beim Cleanup:', error);
    }
  });
  
  console.log('✅ [Cleanup] Service gestartet - läuft alle 30 Minuten');
  console.log('🧹 [Cleanup] Löscht unverifizierte Accounts älter als 2 Stunden');
}

module.exports = { startCleanupService };
