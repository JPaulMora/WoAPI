const express = require('express');
const dotenv = require('dotenv');
const wo = require('./wordops');

const cf = require('./cloudflare');

const app = express();

dotenv.config();
const DEV_DOMAIN = process.env.DEV_DOMAIN;
const CF_DEFAULT_ZONE = process.env.CF_DEFAULT_ZONE;

app.use(express.json())

// Testing
app.get('/tasks', (req, res) => {
  res.json({ hello: 'world' });
});

app.post('/website/create', async (req, res) => {
  const ws = req.body;
  const bgTasks = [];
  res.json(true);

  if (DEV_DOMAIN && ws.domain.includes(DEV_DOMAIN)) {
    bgTasks.push(cf.createDnsRecord(CF_DEFAULT_ZONE, ws.domain));
  }

  bgTasks.push(wo.createWordpress(ws.domain));

  await Promise.all(bgTasks);
});

app.post('/website/adminuser', async (req, res) => {
  const ws = req.body;
  res.json(true);
  wo.createAdminUser(ws.domain, ws.email);
});

app.post('/domain/create', async (req, res) => {
  const ws = req.body;

  res.json(true);
  if (DEV_DOMAIN && ws.domain.includes(DEV_DOMAIN)) {
    await cf.createDnsRecord(CF_DEFAULT_ZONE, ws.domain);
  }

  //TODO add generalized DNS + Zone creation logic

});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

