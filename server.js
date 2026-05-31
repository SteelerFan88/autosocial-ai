const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const DB = '/tmp/db.json';

function load() {
  try { return JSON.parse(fs.readFileSync(DB)); }
  catch(e) { return { clients: [], profiles: [], posts: [], payments: [], invoices: [], signups: [], nextId: 1 }; }
}

function save(data) { fs.writeFileSync(DB, JSON.stringify(data)); }

const data = load();
if (data.clients.length === 0) {
  data.clients.push({ id: 1, name: 'Sam', email: 'sam@fitlifecoaching.com', business_name: 'FitLife Coaching', business_type: 'Fitness Coaching', password: 'welcome2024' });
  data.clients.push({ id: 2, name: 'Umami Admin', email: 'hello@umamiramen.com', business_name: 'Umami Ramen Bar', business_type: 'Restaurant', password: 'welcome2024' });
  data.clients.push({ id: 3, name: 'Alex', email: 'alex@peakperformpt.com', business_name: 'Peak Performance PT', business_type: 'Physical Therapy', password: 'welcome2024' });
  data.nextId = 10;
  save(data);
}

app.post('/api/clients/login', (req, res) => {
  const d = load();
  const c = d.clients.find(x => x.email === req.body.email && x.password === req.body.password);
  if (!c) return res.status(401).json({ error: 'Invalid' });
  res.json(c);
});

app.get('/api/clients/:id/content', (req, res) => {
  res.json(load().posts.filter(p => p.client_id == req.params.id).sort((a, b) => b.id - a.id));
});

app.post('/api/clients/:id/generate-content', (req, res) => {
  const d = load();
  const client = d.clients.find(c => c.id == req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const { generateContent } = require('./content-generator');
  const posts = generateContent({ business_name: client.business_name, business_type: client.business_type });
  for (const post of posts) {
    d.posts.push({ id: d.nextId++, client_id: parseInt(req.params.id), ...post, status: 'draft' });
  }
  save(d);
  res.json(d.posts.filter(p => p.client_id == req.params.id).sort((a, b) => b.id - a.id));
});

app.get('/api/clients/:id/profile', (req, res) => {
  res.json(load().profiles.find(p => p.client_id == req.params.id) || {});
});

app.post('/api/clients/:id/profile', (req, res) => {
  const d = load();
  const idx = d.profiles.findIndex(p => p.client_id == req.params.id);
  const p = { client_id: parseInt(req.params.id), ...req.body };
  if (idx >= 0) d.profiles[idx] = p;
  else d.profiles.push({ id: d.nextId++, ...p });
  save(d);
  res.json({ message: 'Saved' });
});

app.put('/api/content/:id', (req, res) => {
  const d = load();
  const post = d.posts.find(p => p.id == req.params.id);
  if (post) { if (req.body.status) post.status = req.body.status; save(d); }
  res.json({ message: 'Updated' });
});

app.delete('/api/content/:id', (req, res) => {
  const d = load();
  d.posts = d.posts.filter(p => p.id != req.params.id);
  save(d);
  res.json({ message: 'Deleted' });
});

app.post('/api/signup', (req, res) => {
  const d = load();
  d.signups.push({ id: d.nextId++, email: req.body.email });
  save(d);
  res.json({ message: 'Signup successful' });
});

app.post('/api/checkout', async (req, res) => {
  const d = load();
  const amt = { starter: 197, growth: 397, founder: 997 }[req.body.plan] || 997;
  const sk = process.env.STRIPE_SECRET_KEY;
  if (sk && sk.startsWith('sk_')) {
    const stripe = require('stripe')(sk);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: req.body.plan }, unit_amount: amt * 100 }, quantity: 1 }],
      mode: 'payment',
      success_url: 'https://landing-page-eta-neon.vercel.app/portal?success=1',
      cancel_url: 'https://landing-page-eta-neon.vercel.app/pricing'
    });
    d.payments.push({ id: d.nextId++, client_id: req.body.client_id, plan: req.body.plan, amount: amt, status: 'pending' });
    save(d);
    return res.json({ url: session.url });
  }
  d.payments.push({ id: d.nextId++, client_id: req.body.client_id, plan: req.body.plan, amount: amt, status: 'completed' });
  d.invoices.push({ id: d.nextId++, client_id: req.body.client_id, plan: req.body.plan, amount: amt, status: 'paid' });
  save(d);
  res.json({ success: true, message: req.body.plan + ' confirmed! $' + amt });
});

app.listen(port, '0.0.0.0', () => console.log('Backend on :' + port));
