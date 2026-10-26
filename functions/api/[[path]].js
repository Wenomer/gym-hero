// Gym Hero API — Pages Function над D1. Вход по API-ключу проверяет auth-kit (service binding VAULT, проект 'gym-hero'):
// всю проверку, коды ответов и тело /api/me даёт эталонный ./auth-kit.js (копия server/auth-kit.js из auth-kit, без изменений).
// Маршруты (всё под /api):
//   GET    /api/me                 {user_id, name, role, readonly, impersonate, impersonatedBy:{userId,name}|null}
// Ключ имперсонации даёт данные того, под кем зашли (user_id = он). Если он ещё и readonly,
// допускаются только GET/HEAD, остальное 403 {error:'readonly'}.
//   GET    /api/{equipment|exercises|routines|workouts|sets}         (?date= для sets/workouts)
//   POST   /api/{table}            тело = одна запись (snake_case; user_id берётся из ключа, не из тела)
//   PATCH  /api/{table}/:id        тело = частичный патч
//   DELETE /api/{table}/:id        (workout сносит и свои sets)
//   POST   /api/import             тело = {equipment,exercises,routines,workouts,sets}
//   DELETE /api/all                очистить все данные пользователя

import { authenticate, meResponse, json } from './auth-kit.js';

const TABLES = {
  equipment: { cols: ['id','user_id','name','has_weight','default_weight','loading'], json: ['loading'] },
  exercises: { cols: ['id','user_id','name','equipment_id','bilateral','default_weight','notes'], json: [] },
  routines:  { cols: ['id','user_id','name','exercise_ids','created_at'], json: ['exercise_ids'] },
  workouts:  { cols: ['id','user_id','date','name','type','laps','started_at','ended_at','planned_exercise_ids','created_at'], json: ['laps','planned_exercise_ids'] },
  sets:      { cols: ['id','user_id','date','exercise_id','workout_id','weight','reps','reps_r','note','created_at'], json: [] },
};
const ORDERED = { sets: 'created_at', workouts: 'created_at' }; // ASC по created_at

const PROJECT_ID = 'gym-hero';   // константа в коде, не из запроса

// D1 -> наружу: JSON-колонки парсим обратно в объект/массив .
function rowOut(table, r) {
  if (!r) return r;
  for (const c of TABLES[table].json) {
    if (r[c] == null) continue;
    try { r[c] = JSON.parse(r[c]); } catch { /* оставить строкой */ }
  }
  return r;
}
// наружу -> D1: объекты/массивы в JSON-колонках сериализуем в строку.
function valueIn(table, col, v) {
  if (v === undefined) return undefined;
  if (TABLES[table].json.includes(col) && v != null && typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env.DB;
  if (!db) return json({ error: 'no_db_binding' }, 500);

  const parts = (params.path || []).filter(Boolean); // напр. ['sets'] или ['sets','abc123']
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // --- auth через auth-kit: 401 / 429 / 403 readonly / 503 / 500 возвращаем как есть ---
  const auth = await authenticate(request, env, PROJECT_ID);
  if (auth.response) return auth.response;
  const { who } = auth;
  const user = String(who.userId);   // в D1 user_id текстовый; Alex = 1 -> '1', как в уже лежащих данных

  // GET /api/me
  if (parts[0] === 'me') return meResponse(who);

  // POST /api/import
  if (parts[0] === 'import' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    let n = 0;
    for (const table of Object.keys(TABLES)) {
      for (const rec of (body[table] || [])) n += await upsert(db, table, rec, user);
    }
    return json({ imported: n });
  }

  // DELETE /api/all
  if (parts[0] === 'all' && method === 'DELETE') {
    for (const table of Object.keys(TABLES)) {
      await db.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(user).run();
    }
    return json({ ok: true });
  }

  const table = parts[0];
  if (!TABLES[table]) return json({ error: 'not_found' }, 404);
  const id = parts[1];

  if (method === 'GET') {
    let sql = `SELECT * FROM ${table} WHERE user_id=?`;
    const bind = [user];
    const date = url.searchParams.get('date');
    if (date && TABLES[table].cols.includes('date')) { sql += ' AND date=?'; bind.push(date); }
    if (ORDERED[table]) sql += ` ORDER BY ${ORDERED[table]} ASC`;
    const { results } = await db.prepare(sql).bind(...bind).all();
    return json(results.map(r => rowOut(table, r)));
  }

  if (method === 'POST') {
    const rec = await request.json().catch(() => ({}));
    const row = await insertRow(db, table, rec, user);
    return json([rowOut(table, row)]); // массив из 1: клиент берёт created_at из ответа
  }

  if (method === 'PATCH') {
    if (!id) return json({ error: 'id_required' }, 400);
    const patch = await request.json().catch(() => ({}));
    const def = TABLES[table];
    const sets = [], bind = [];
    for (const col of def.cols) {
      if (col === 'id' || col === 'user_id') continue;
      if (!(col in patch)) continue;
      sets.push(`${col}=?`); bind.push(valueIn(table, col, patch[col]) ?? null);
    }
    if (sets.length) {
      bind.push(id, user);
      await db.prepare(`UPDATE ${table} SET ${sets.join(',')} WHERE id=? AND user_id=?`).bind(...bind).run();
    }
    return json({ ok: true });
  }

  if (method === 'DELETE') {
    if (!id) return json({ error: 'id_required' }, 400);
    // каскады: тренировка сносит свои подходы, упражнение подходы, снаряд отвязывается от упражнений
    if (table === 'workouts') await db.prepare('DELETE FROM sets WHERE workout_id=? AND user_id=?').bind(id, user).run();
    if (table === 'exercises') await db.prepare('DELETE FROM sets WHERE exercise_id=? AND user_id=?').bind(id, user).run();
    if (table === 'equipment') await db.prepare('UPDATE exercises SET equipment_id=NULL WHERE equipment_id=? AND user_id=?').bind(id, user).run();
    await db.prepare(`DELETE FROM ${table} WHERE id=? AND user_id=?`).bind(id, user).run();
    return json({ ok: true });
  }

  return json({ error: 'method_not_allowed' }, 405);
}

async function insertRow(db, table, rec, user) {
  const def = TABLES[table];
  const row = { ...rec, user_id: user };
  if (def.cols.includes('created_at') && !row.created_at) row.created_at = new Date().toISOString();
  const cols = def.cols.filter(c => c in row);
  const vals = cols.map(c => valueIn(table, c, row[c]) ?? null);
  const ph = cols.map(() => '?').join(',');
  await db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${ph})`).bind(...vals).run();
  // вернуть то, что реально записали (created_at и т.п.)
  const out = {};
  for (const c of def.cols) out[c] = c in row ? row[c] : null;
  return out;
}

// import: вставка с заменой по id (merge-duplicates)
async function upsert(db, table, rec, user) {
  const def = TABLES[table];
  const row = { ...rec, user_id: user };
  if (def.cols.includes('created_at') && !row.created_at) row.created_at = new Date().toISOString();
  const cols = def.cols.filter(c => c in row);
  const vals = cols.map(c => valueIn(table, c, row[c]) ?? null);
  const ph = cols.map(() => '?').join(',');
  await db.prepare(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${ph})`).bind(...vals).run();
  return 1;
}
