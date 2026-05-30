const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Database setup
const Database = require('better-sqlite3');
const DB_PATH = process.env.DB_PATH || '/tmp/autosocial.db';
const db = new Database(DB_PATH);

db.exec(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, business_name TEXT, business_type TEXT, password TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS business_profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, website TEXT, brand_voice TEXT, target_audience TEXT, platforms TEXT, content_style TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS content_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, platform TEXT, post_type TEXT, caption TEXT, hashtags TEXT, image_prompt TEXT, image_url TEXT, status TEXT DEFAULT 'draft', scheduled_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, plan TEXT, amount REAL, status TEXT, stripe_payment_intent_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, plan TEXT, amount REAL, status TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS signups (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

// Seed clients if empty
const count = db.prepare('SELECT COUNT(*) as c FROM clients').get();
if (count.c === 0) {
  db.prepare(`INSERT INTO clients (name, email, business_name, business_type, password) VALUES ('Sam', 'sam@fitlifecoaching.com', 'FitLife Coaching', 'Fitness Coaching', 'welcome2024')`).run();
  db.prepare(`INSERT INTO clients (name, email, business_name, business_type, password) VALUES ('Umami Admin', 'hello@umamiramen.com', 'Umami Ramen Bar', 'Restaurant', 'welcome2024')`).run();
  db.prepare(`INSERT INTO clients (name, email, business_name, business_type, password) VALUES ('Alex', 'alex@peakperformpt.com', 'Peak Performance PT', 'Physical Therapy', 'welcome2024')`).run();
  db.prepare(`INSERT INTO payments (client_id, plan, amount, status) VALUES (1, 'founder', 997, 'completed')`).run();
  db.prepare(`INSERT INTO payments (client_id, plan, amount, status) VALUES (2, 'founder', 997, 'completed')`).run();
  db.prepare(`INSERT INTO payments (client_id, plan, amount, status) VALUES (3, 'growth', 397, 'completed')`).run();
  db.prepare(`INSERT INTO invoices (client_id, plan, amount, status) VALUES (1, 'founder', 997, 'paid')`).run();
  db.prepare(`INSERT INTO invoices (client_id, plan, amount, status) VALUES (2, 'founder', 997, 'paid')`).run();
  db.prepare(`INSERT INTO invoices (client_id, plan, amount, status) VALUES (3, 'growth', 397, 'paid')`).run();
}

function q(sql) {
  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) return db.prepare(sql.replace(/'/g, "''")).all();
    else { db.prepare(sql.replace(/'/g, "''")).run(); return []; }
  } catch(e) { console.error('DB:', e.message); return []; }
}

app.post('/api/clients/login', (req, res) => {
  const c = q(`SELECT * FROM clients WHERE email='${req.body.email}' AND password='${req.body.password}'`);
  if (!c.length) return res.status(401).json({ error: 'Invalid' });
  res.json(c[0]);
});

app.get('/api/clients/:id/content', (req, res) => {
  res.json(q(`SELECT * FROM content_posts WHERE client_id=${req.params.id} ORDER BY created_at DESC`));
});

app.post('/api/clients/:id/generate-content', (req, res) => {
  const clients = q(`SELECT * FROM clients WHERE id=${req.params.id}`);
  if (!clients.length) return res.status(404).json({ error: 'Not found' });
  const { generateContent } = require('./content-generator');
  const profiles = q(`SELECT * FROM business_profiles WHERE client_id=${req.params.id}`);
  const posts = generateContent({
    business_name: clients[0].business_name,
    business_type: clients[0].business_type,
    platforms: profiles[0]?.platforms
  });
  for (const post of posts) {
    q(`INSERT INTO content_posts (client_id, platform, post_type, caption, hashtags, image_prompt, status) VALUES (${req.params.id}, '${post.platform}', '${post.post_type}', '${post.caption.replace(/'/g, "''")}', '${post.hashtags}', '${post.image_prompt}', 'draft')`);
  }
  res.json(q(`SELECT * FROM content_posts WHERE client_id=${req.params.id} ORDER BY created_at DESC`));
});

app.get('/api/clients/:id/profile', (req, res) => {
  res.json(q(`SELECT * FROM business_profiles WHERE client_id=${req.params.id}`)[0] || {});
});

app.post('/api/clients/:id/profile', (req, res) => {
  const b = req.body;
  const e = q(`SELECT id FROM business_profiles WHERE client_id=${req.params.id}`);
  if (e.length) q(`UPDATE business_profiles SET website='${b.website||''}',brand_voice='${b.brand_voice||''}',target_audience='${b.target_audience||''}',platforms='${b.platforms||''}',content_style='${b.content_style||''}' WHERE client_id=${req.params.id}`);
  else q(`INSERT INTO business_profiles (client_id,website,brand_voice,target_audience,platforms,content_style) VALUES (${req.params.id},'${b.website||''}','${b.brand_voice||''}','${b.target_audience||''}','${b.platforms||''}','${b.content_style||''}')`);
  res.json({ message: 'Saved' });
});

app.put('/api/content/:id', (req, res) => {
  if (req.body.status) q(`UPDATE content_posts SET status='${req.body.status}' WHERE id=${req.params.id}`);
  res.json({ message: 'Updated' });
});

app.delete('/api/content/:id', (req, res) => {
  q(`DELETE FROM content_posts WHERE id=${req.params.id}`);
  res.json({ message: 'Deleted' });
});

app.post('/api/signup', (req, res) => {
  q(`INSERT INTO signups (email) VALUES ('${req.body.email}')`);
  res.json({ message: 'Signup successful' });
});

app.post('/api/checkout', async (req, res) => {
  const { client_id, plan } = req.body;
  const prices = { starter: 197, growth: 397, founder: 997 };
  const amt = prices[plan] || 997;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith('sk_')) {
    try {
      const stripe = require('stripe')(stripeKey);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: plan }, unit_amount: amt * 100 }, quantity: 1 }],
        mode: 'payment',
        success_url: 'https://landing-page-eta-neon.vercel.app/portal?success=1',
        cancel_url: 'https://landing-page-eta-neon.vercel.app/pricing'
      });
      q(`INSERT INTO payments (client_id, plan, amount, status) VALUES (${client_id}, '${plan}', ${amt}, 'pending')`);
      return res.json({ url: session.url });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }
  q(`INSERT INTO payments (client_id, plan, amount, status) VALUES (${client_id}, '${plan}', ${amt}, 'completed')`);
  q(`INSERT INTO invoices (client_id, plan, amount, status) VALUES (${client_id}, '${plan}', ${amt}, 'paid')`);
  res.json({ success: true, message: `${plan} confirmed! $${amt}` });
});

app.get('/api/payments/:clientId', (req, res) => {
  res.json(q(`SELECT * FROM payments WHERE client_id=${req.params.clientId} ORDER BY created_at DESC`));
});

app.listen(port, '0.0.0.0', () => console.log(`AutoSocial AI on :${port}`));
