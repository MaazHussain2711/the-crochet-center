const { DatabaseSync } = require('node:sqlite');
const { mkdirSync } = require('node:fs');
const { dirname } = require('node:path');
const { randomBytes, createHash } = require('node:crypto');
const hash = value => createHash('sha256').update(value).digest('hex');
function openStore(filename, seed) {
  if(filename !== ':memory:') mkdirSync(dirname(filename),{recursive:true});
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS enquiries(id TEXT PRIMARY KEY, customer TEXT NOT NULL, items TEXT NOT NULL, notes TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    INSERT OR IGNORE INTO migrations(version) VALUES(1);`);
  if(!db.prepare('SELECT count(*) AS n FROM products').get().n){
    const add=db.prepare('INSERT INTO products(id,slug,data) VALUES(?,?,?)');
    db.exec('BEGIN');try{for(const p of seed)add.run(p.id,p.slug,JSON.stringify(p));db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
  }
  return {
    db,
    products(all=false){return db.prepare('SELECT data FROM products ORDER BY id').all().map(r=>JSON.parse(r.data)).filter(p=>all||p.active)},
    saveProduct(p){db.prepare('INSERT INTO products(id,slug,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,data=excluded.data').run(p.id,p.slug,JSON.stringify(p));return p},
    request(customer,items,notes){const id='TCC-'+randomBytes(8).toString('hex').toUpperCase();db.prepare('INSERT INTO enquiries(id,customer,items,notes) VALUES(?,?,?,?)').run(id,JSON.stringify(customer),JSON.stringify(items),notes);return {id}},
    enquiries(){return db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all().map(r=>({...r,customer:JSON.parse(r.customer),items:JSON.parse(r.items)}))},
    close(){db.close()}
  };
}
module.exports={openStore,hash};
