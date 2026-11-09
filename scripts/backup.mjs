// Cópia do banco inteiro em um arquivo JSON comprimido, fora do repositório.
// Uso: DATABASE_URL=<conexão do papel dono> node scripts/backup.mjs
// A conexão vem do ambiente e nunca é gravada. O arquivo tem dados reais: não o versione.
import { neon } from '@neondatabase/serverless'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const KEEP = 30
// `session` e `verification` são tokens de curta vida: restaurá-los não serve e vazá-los é risco.
const SKIP = new Set(['session', 'verification'])

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL não definida')

const dir = resolve(process.env.BACKUP_DIR ?? '../rumo-backups')
const sql = neon(url)

const rows = await sql.query(
  "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name",
)
const names = rows.map((row) => row.table_name).filter((name) => !SKIP.has(name))

// Uma transação só, para as tabelas serem do mesmo instante (vínculos entre elas não quebram).
const results = await sql.transaction(names.map((name) => sql.query(`select * from "${name}"`)), {
  isolationLevel: 'RepeatableRead',
  readOnly: true,
})
const tables = Object.fromEntries(names.map((name, index) => [name, results[index]]))

mkdirSync(dir, { recursive: true })
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
const file = join(dir, `rumo-${stamp}.json.gz`)
writeFileSync(file, gzipSync(JSON.stringify({ takenAt: new Date().toISOString(), tables })))

const old = readdirSync(dir).filter((name) => /^rumo-\d{12}\.json\.gz$/.test(name)).sort().slice(0, -KEEP)
for (const name of old) rmSync(join(dir, name))

const counts = names.map((name) => `${name}=${tables[name].length}`).join(' ')
console.log(`Backup gravado em ${file}\n${counts}`)
