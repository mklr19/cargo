const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'host.docker.internal',
    //host: 'localhost',
    database: 'cargo',
    password: 'postgres',
    port: 5433,
});

async function waitForDatabase() {
    let retries = 5;
    while (retries > 0) {
        try {
            await pool.query('SELECT NOW()');
            console.log('Erfolgreich mit der Datenbank verbunden');
            return;
        } catch (error) {
            console.error('Fehler bei der Verbindung zur Datenbank:', error.message);
            retries--;
            console.log(`Warte auf die Datenbank... (${retries} Versuche übrig)`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wartezeit: 3 Sekunden
        }
    }
    console.error('Konnte keine Verbindung zur Datenbank herstellen. Die Anwendung wird beendet.');
    process.exit(1);
}

// Starte die Wartezeit für die Datenbankverbindung
waitForDatabase();

module.exports = pool;