// api/dashboard.js
// Vercel Serverless Function — llama a Loyverse y devuelve todos los datos al frontend

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

export default async function handler(req, res) {
  // CORS — permite que tu frontend (Vercel u otro) llame a esta función
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "Method not allowed" });

  if (!TOKEN) return res.status(500).json({ error: "LOYVERSE_TOKEN no configurado en Vercel → Settings → Environment Variables" });

  try {
    const now      = new Date();
    const todayISO = (() => { const d = new Date(now); d.setHours(0,0,0,0); return d.toISOString(); })();
    const weekISO  = (() => { const d = new Date(now); d.setDate(d.getDate()-6); d.setHours(0,0,0,0); return d.toISOString(); })();
    const monthISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yearISO  = new Date(now.getFullYear(), 0, 1).toISOString();
    const nowISO   = now.toISOString();

    // Todas las llamadas en paralelo
    const [stores, rToday, rWeek, rMonth, rYear, items] = await Promise.all([
      lv("/stores"),
      lv("/receipts", { date_from: todayISO,  date_to: nowISO, limit: 250 }),
      lv("/receipts", { date_from: weekISO,   date_to: nowISO, limit: 250 }),
      lv("/receipts", { date_from: monthISO,  date_to: nowISO, limit: 250 }),
      lv("/receipts", { date_from: yearISO,   date_to: nowISO, limit: 1000 }),
      lv("/items",    { limit: 250 }),
    ]);

    // Inventario (opcional — no falla si no está disponible)
    let inventory = { inventory_levels: [] };
    try { inventory = await lv("/inventory", { limit: 250 }); } catch {}

    res.status(200).json({
      store:            stores.stores?.[0] || {},
      receipts_today:   rToday.receipts  || [],
      receipts_week:    rWeek.receipts   || [],
      receipts_month:   rMonth.receipts  || [],
      receipts_year:    rYear.receipts   || [],
      items:            items.items      || [],
      inventory_levels: inventory.inventory_levels || [],
    });
  } catch (e) {
    console.error("Dashboard error:", e.message);
    res.status(500).json({ error: e.message });
  }
}
