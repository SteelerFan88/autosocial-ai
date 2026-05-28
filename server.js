const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

function q(sql) {
  return new Promise(r => exec(`team-db "${sql.replace(/"/g, '\\"')}"`, (e, o) => {
    try { r(JSON.parse(o)); } catch (x) { r([]); }
  }));
}

app.post('/api/clients/login', async (req, res) => {
  const c = await q(`SELECT * FROM clients WHERE email='${req.body.email}' AND password='${req.body.password}'`);
  if (!c.length) return res.status(401).json({ error: 'Invalid' });
  res.json(c[0]);
});

app.get('/api/clients/:id/content', async (req, res) => {
  res.json(await q(`SELECT * FROM content_posts WHERE client_id=${req.params.id} ORDER BY created_at DESC`));
});

app.post('/api/clients/:id/generate-content', async (req, res) => {
  const { generateContent } = require('./content-generator');
  const clients = await q(`SELECT * FROM clients WHERE id=${req.params.id}`);
  if (!clients.length) return res.status(404).json({ error: 'Not found' });
  const posts = await generateContent(req.params.id, { business_name: clients[0].business_name, business_type: clients[0].business_type });
  res.json(posts);
});

app.get('/api/clients/:id/profile', async (req, res) => {
  const p = await q(`SELECT * FROM business_profiles WHERE client_id=${req.params.id}`);
  res.json(p[0] || {});
});

app.post('/api/clients/:id/profile', async (req, res) => {
  const b = req.body;
  const e = await q(`SELECT id FROM business_profiles WHERE client_id=${req.params.id}`);
  if (e.length) await q(`UPDATE business_profiles SET website='${b.website||''}',brand_voice='${b.brand_voice||''}',target_audience='${b.target_audience||''}',platforms='${b.platforms||''}',content_style='${b.content_style||''}' WHERE client_id=${req.params.id}`);
  else await q(`INSERT INTO business_profiles (client_id,website,brand_voice,target_audience,platforms,content_style) VALUES (${req.params.id},'${b.website||''}','${b.brand_voice||''}','${b.target_audience||''}','${b.platforms||''}','${b.content_style||''}')`);
  res.json({ message: 'Saved' });
});

app.put('/api/content/:id', async (req, res) => {
  if (req.body.status) await q(`UPDATE content_posts SET status='${req.body.status}' WHERE id=${req.params.id}`);
  res.json({ message: 'Updated' });
});

app.delete('/api/content/:id', async (req, res) => {
  await q(`DELETE FROM content_posts WHERE id=${req.params.id}`);
  res.json({ message: 'Deleted' });
});

app.post('/api/signup', async (req, res) => {
  await q(`INSERT INTO signups (email) VALUES ('${req.body.email}')`);
  res.json({ message: 'Signup successful' });
});

app.post('/api/checkout', async (req, res) => {
  const { client_id, plan } = req.body;
  const prices = { starter: 197, growth: 397, founder: 997 };
  const amt = prices[plan] || 997;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith('sk_')) {
    const stripe = require('stripe')(stripeKey);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: plan }, unit_amount: amt * 100 }, quantity: 1 }],
      mode: 'payment',
      success_url: 'https://landing-page-eta-neon.vercel.app/portal?success=1',
      cancel_url: 'https://landing-page-eta-neon.vercel.app/pricing'
    });
    await q(`INSERT INTO payments (client_id, plan, amount, status) VALUES (${client_id}, '${plan}', ${amt}, 'pending')`);
    return res.json({ url: session.url });
  }
  await q(`INSERT INTO payments (client_id, plan, amount, status) VALUES (${client_id}, '${plan}', ${amt}, 'completed')`);
  await q(`INSERT INTO invoices (client_id, plan, amount, status) VALUES (${client_id}, '${plan}', ${amt}, 'paid')`);
  res.json({ success: true, message: `${plan} confirmed! $${amt}` });
});

app.listen(port, '0.0.0.0', () => console.log(`Backend on :${port}`));
