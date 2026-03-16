// api/dashboard.js — Vercel Serverless Function
// Proxy seguro entre el dashboard y la API de Loyverse (resuelve CORS)

const TOKEN = process.env.LOYVERSE_TOKEN;
const BASE  = "https://api.loyverse.com/v1.0";

async function lv(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Loyverse ${res.status}: ${await res.text()}`);
  return res.json();
}

// Paginación automática para traer todos los recibos (máx 250 por página)
async function getAllReceipts(params) {
  let all = [], cursor = null;
  do {
    const p = { ...params, limit: 250 };
    if (cursor) p.cursor = cursor;
    const data = await lv("/receipts", p);
    const page = data.receipts || [];
    all = all.concat(page);
    cursor = data.cursor || null;
    if (page.length < 250) break;
  } while (cursor);
  return all;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "Method not allowed" });

  if (!TOKEN) {
    return res.status(500).json({
      error: "LOYVERSE_TOKEN no configurado. Ve a Vercel → Settings → Environment Variables y agrégalo, luego redespliega."
    });
  }

  try {
    const now      = new Date();
    const todayISO = (() => { const d = new Date(now); d.setHours(0,0,0,0); return d.toISOString(); })();
    const weekISO  = (() => { const d = new Date(now); d.setDate(d.getDate()-6); d.setHours(0,0,0,0); return d.toISOString(); })();
    const monthISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yearISO  = new Date(now.getFullYear(), 0, 1).toISOString();
    const nowISO   = now.toISOString();

    // Peticiones en paralelo — todas con limit máx 250
    const [stores, rToday, rWeek, rMonth, items] = await Promise.all([
      lv("/stores"),
      lv("/receipts", { date_from: todayISO, date_to: nowISO, limit: 250 }),
      lv("/receipts", { date_from: weekISO,  date_to: nowISO, limit: 250 }),
      lv("/receipts", { date_from: monthISO, date_to: nowISO, limit: 250 }),
      lv("/items", { limit: 250 }),
    ]);

    // Año completo con paginación automática
    const rYearAll = await getAllReceipts({ date_from: yearISO, date_to: nowISO });

    let inventory = { inventory_levels: [] };
    try { inventory = await lv("/inventory", { limit: 250 }); } catch (_) {}

    return res.status(200).json({
      store:            stores.stores?.[0] || {},
      receipts_today:   rToday.receipts   || [],
      receipts_week:    rWeek.receipts    || [],
      receipts_month:   rMonth.receipts   || [],
      receipts_year:    rYearAll,
      items:            items.items       || [],
      inventory_levels: inventory.inventory_levels || [],
    });
  } catch (e) {
    console.error("Dashboard error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
