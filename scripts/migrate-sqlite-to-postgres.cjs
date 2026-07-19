const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config();

const sqliteDbPath = path.join(__dirname, '../prisma/dev.db');
const postgresUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pte_db?schema=public';

async function migrateData() {
  console.log(`Extracting data from SQLite: ${sqliteDbPath}`);
  const sqliteDb = new Database(sqliteDbPath, { readonly: true });
  
  console.log(`Connecting to Postgres: ${postgresUrl}`);
  const pgClient = new Client({ connectionString: postgresUrl });
  await pgClient.connect();

  try {
    // 1. Get all tables in SQLite
    const tablesStmt = sqliteDb.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name != '_prisma_migrations'
    `);
    const tables = tablesStmt.all();

    for (const { name: tableName } of tables) {
      console.log(`\nMigrating table: ${tableName}`);
      
      const rows = sqliteDb.prepare(`SELECT * FROM "${tableName}"`).all();
      if (rows.length === 0) {
        console.log(`  -> 0 rows, skipping.`);
        continue;
      }
      
      console.log(`  -> Found ${rows.length} rows.`);
      
      const columns = Object.keys(rows[0]);
      
      // Clean up target table before inserting to prevent unique constraint violations on retry
      await pgClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
      
      // Insert in batches
const BOOLEAN_COLUMNS = new Map([
  ['User', new Set(['diagnosticDone', 'isPremium'])],
  ['Coupon', new Set(['active'])],
  ['FlashcardState', new Set(['mastered'])],
  ['Notification', new Set(['read'])],
]);

// ... (rest of existing code unchanged)

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        const placeholders = batch.map((_, rowIndex) => {
          return `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`;
        }).join(', ');
        
        const values = batch.flatMap(row => {
          return columns.map(col => {
            let val = row[col];
            // Convert only known boolean columns from SQLite 0/1 to postgres boolean
            const tableBooleans = BOOLEAN_COLUMNS.get(tableName);
            if (tableBooleans && tableBooleans.has(col)) {
              if (val === 1) return true;
              if (val === 0) return false;
            }
            return val;
          });
        });

        const query = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders}`;
        
        try {
          await pgClient.query(query, values);
        } catch (err) {
          console.error(`  -> Failed to insert batch into ${tableName}:`, err.message);
          throw err;
        }
      }
      console.log(`  -> Successfully migrated ${rows.length} rows to ${tableName}.`);
    }

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

migrateData();
