'use strict';
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dfcoc7qqq',
  api_key:    process.env.CLOUDINARY_API_KEY    || '845566563795258',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'CgNWzBpLXmWUARc6-uDaBtrAKzM',
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));

// ── DATABASE (Supabase / Postgres) ────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper: run a query
const q = (sql, params = []) => pool.query(sql, params);

// ── INIT TABLES ───────────────────────────────────────────────────────────────
async function initDB() {
  await q(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      category TEXT DEFAULT '',
      price TEXT DEFAULT '',
      "desc" TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      rating INTEGER DEFAULT 5,
      text TEXT DEFAULT '',
      event TEXT DEFAULT '',
      approved BOOLEAN DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS ingredients (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      "desc" TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title TEXT DEFAULT '',
      url TEXT DEFAULT '',
      "desc" TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS faq (
      id SERIAL PRIMARY KEY,
      question TEXT DEFAULT '',
      answer TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS media (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      type TEXT DEFAULT 'image',
      size TEXT DEFAULT '',
      data TEXT DEFAULT '',
      added_at TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      date TEXT DEFAULT '',
      cake_type TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS homepage (
      id INTEGER PRIMARY KEY DEFAULT 1,
      settings_json TEXT DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS flavours (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      category TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      "desc" TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
  `);
  await seed();
}

// ── SEED DEFAULT DATA ─────────────────────────────────────────────────────────
async function seed() {
  const { rows: [{ c }] } = await q('SELECT COUNT(*) as c FROM products');
  if (parseInt(c) === 0) {
    const products = [
      ['Duchess Rose','Designer Cake','$180','Four-layer vanilla bean cake, strawberry compote, Swiss meringue buttercream, edible rose petals.',''],
      ['Velvet Noir','Designer Cake','$195','Dark chocolate ganache cake with espresso cream, salted caramel drip, and gold leaf finish.',''],
      ['Lemon Reverie','Cheesecake','$95','Burnt Basque cheesecake with lemon curd swirl, graham cracker base, fresh blueberry compote.',''],
      ['Garden Party','Cupcakes','$48/doz','Vanilla sponge cupcakes with seasonal flower buttercream piping. Perfect for any celebration.',''],
      ['Midnight Truffle','Designer Cake','$220','Belgian dark chocolate mousse cake, hazelnut praline crunch, mirror glaze finish.',''],
      ['Peach Blossom','Cheesecake','$110','Classic New York cheesecake with roasted peach topping and almond shortbread crust.',''],
    ];
    for (const p of products) {
      await q('INSERT INTO products (name,category,price,"desc",image) VALUES ($1,$2,$3,$4,$5)', p);
    }
  }

  const { rows: [{ c: rc }] } = await q('SELECT COUNT(*) as c FROM reviews');
  if (parseInt(rc) === 0) {
    const reviews = [
      ['Amelia R.',5,"Dory's made our wedding cake and it was absolutely breathtaking. Every single guest asked for the recipe. Perfection!",'Wedding',true],
      ['James T.',5,'The Velvet Noir is my birthday tradition now. Three years running. It gets better every single time.','Birthday',true],
      ['Sofia M.',5,"Ordered the Garden Party cupcakes for my daughter's baby shower. The presentation was stunning and they tasted even better.",'Baby Shower',true],
      ['Priya K.',4,'Beautiful cakes and wonderful service. The cheesecake was heavenly — will definitely order again!','Anniversary',false],
    ];
    for (const r of reviews) {
      await q('INSERT INTO reviews (name,rating,text,event,approved) VALUES ($1,$2,$3,$4,$5)', r);
    }
  }

  const { rows: [{ c: ic }] } = await q('SELECT COUNT(*) as c FROM ingredients');
  if (parseInt(ic) === 0) {
    const ingredients = [
      ['Single-Origin Flour','🌾','Stone-ground from a family mill in Vermont. Lower gluten, more flavour.'],
      ['Cultured Butter','🧈','84% fat European-style butter, churned from pasture-raised cream.'],
      ['Raw Cane Sugar','✦','Unrefined cane sugar that adds a subtle molasses depth to every bake.'],
      ['Free-Range Eggs','🥚','Sourced from a local farm. Richer yolks mean a more golden, flavourful crumb.'],
      ['Valrhona Chocolate','◆','Our preferred couverture for ganaches, mousses, and chocolate sponges.'],
      ['Real Vanilla','◇','Tahitian vanilla pods steeped in our house-made extract. No artificial flavours, ever.'],
    ];
    for (const i of ingredients) {
      await q('INSERT INTO ingredients (name,icon,"desc") VALUES ($1,$2,$3)', i);
    }
  }

  const { rows: [{ c: vc }] } = await q('SELECT COUNT(*) as c FROM videos');
  if (parseInt(vc) === 0) {
    await q('INSERT INTO videos (title,url,"desc") VALUES ($1,$2,$3)', ['Making the Duchess Rose','','Watch a four-layer cake come together from scratch.']);
    await q('INSERT INTO videos (title,url,"desc") VALUES ($1,$2,$3)', ['The Art of Mirror Glaze','','A mesmerizing pour that turns a cake into a masterpiece.']);
  }

  const { rows: [{ c: fc }] } = await q('SELECT COUNT(*) as c FROM faq');
  if (parseInt(fc) === 0) {
    const faqs = [
      ['How far in advance should I place my order?','We recommend placing custom cake orders at least 2–3 weeks in advance. For wedding cakes, 2–3 months is ideal to secure your date and allow time for a detailed consultation.'],
      ['Do you offer gluten-free or vegan options?',"Yes! We can accommodate most dietary requirements including gluten-free and vegan. Please mention your needs in the order form and we'll tailor the recipe accordingly."],
      ['Can I schedule a tasting?','Absolutely. We offer complimentary tasting sessions by appointment on Tuesdays and Thursdays. Simply send us a message through the order form and we\'ll arrange a time.'],
      ['How is pricing determined?','Custom cake pricing depends on size, design complexity, flavour combinations, and ingredients. After reviewing your request, we\'ll send a detailed quote within 24 hours. A 50% deposit confirms your order.'],
      ['Do you deliver?','We offer local delivery within a 20-mile radius for an additional fee. For orders outside this area, collection from our kitchen is available Tuesday through Sunday during opening hours.'],
      ['How many people does a cake serve?','Our standard 6" round serves 10–12, an 8" serves 20–24, and a 10" serves 35–40. We also create multi-tiered cakes for larger celebrations.'],
    ];
    for (const f of faqs) {
      await q('INSERT INTO faq (question,answer) VALUES ($1,$2)', f);
    }
  }

  const { rows: [{ c: hc }] } = await q('SELECT COUNT(*) as c FROM homepage');
  if (parseInt(hc) === 0) {
    const defaults = {
      brandName:"Dory's Bakes", brandSubtitle:"Artisan Patisserie",
      tagline:"Artisan · Handcrafted · Bespoke",
      sub:"Where every cake tells a story — baked with love, crafted for your most special moments.",
      about1:"Dory's Bakes was born from a deep love of pastry and a desire to create something truly personal.",
      about2:"From towering designer layer cakes to delicate cheesecakes and seasonal cupcakes — we believe dessert should be an experience, not just an afterthought.",
      aboutHeading:"Baked with\nintention.", aboutTagLabel:"Our Story", years:"5+", yearsLabel:"Years Baking", aboutPhoto:"",
      menuTagLabel:"Our Creations", menuHeading:"The Menu",
      galleryTagLabel:"Our Portfolio", galleryHeading:"Gallery", galleryDesc:"Every cake is a one-of-a-kind creation, made for a moment that matters.",
      ingTagLabel:"What Goes In", ingHeading:"Our Ingredients",
      studioTagLabel:"Behind The Scenes", studioHeading:"The Studio",
      reviewsTagLabel:"What They Say", reviewsHeading:"Reviews",
      faqTagLabel:"Common Questions", faqHeading:"Things you might\nwonder.", faqSubtext:"Can't find your answer? We'd love to hear from you directly.", faqCta:"Ask Us Anything",
      orderTagLabel:"Reserve Yours", orderHeading:"Order a Custom Cake", orderDesc:"Tell us about your dream cake and we'll bring it to life.",
      socialTagLabel:"Follow Along", socialHeading:"On Instagram",
      footerTagline:"Artisan cakes crafted with love, made for your most cherished moments.", footerCopyright:"© 2025 Dory's Bakes. All rights reserved.",
      ribbonBg:"#2A1A0E", ribbonTextColor:"rgba(253,246,236,0.48)", ribbonAccentColor:"#C4883A",
      marqueeItems:"Designer Cakes,✦,Cheesecakes,✦,Cupcakes,✦,Custom Orders,✦,Bespoke Creations,✦,Made From Scratch",
      contactAddress:"123 Baker Street\nSweet City, SC 10001\n\nhello@dorysbakes.com\n+1 (555) 123 4567",
      instagramHandle:"@dorysbakes", instagramUrl:"https://instagram.com/dorysbakes",
      accentColor:"#C4883A", darkColor:"#2A1A0E", bgColor:"#FDF6EC", fontPair:"classic",
      whatsappNumber:"", whatsappMessage:"Hi Dory! Custom cake enquiry:\n\nName: {name}\nEmail: {email}\nEvent Date: {date}\nCake Type: {cakeType}\n\nNotes: {notes}",
      workingHours:"Tuesday – Friday\n9am – 6pm\n\nSaturday – Sunday\n9am – 4pm"
    };
    await q('INSERT INTO homepage (id, settings_json) VALUES (1, $1)', [JSON.stringify(defaults)]);
  }

  const { rows: [{ c: flc }] } = await q('SELECT COUNT(*) as c FROM flavours');
  if (parseInt(flc) === 0) {
    const flavours = [
      ['Vanilla Bean','Cake Bases','◇','Light, fragrant sponge using real Tahitian vanilla pods.'],
      ['Dark Chocolate','Cake Bases','◆','Rich Belgian Valrhona chocolate sponge — dense, moist, and deeply satisfying.'],
      ['Lemon Zest','Cake Bases','✦','Bright, citrusy sponge with fresh lemon zest and juice.'],
      ['Strawberry Compote','Fillings','◆','House-made fresh strawberry compote — slightly tart, bright, and never overly sweet.'],
      ['Salted Caramel','Fillings','◇','Slow-cooked caramel with fleur de sel — rich, buttery, and utterly addictive.'],
      ['Swiss Meringue','Buttercreams','◇','Impossibly silky buttercream, less sweet than American style. Our signature finish.'],
      ['Mirror Glaze','Finishes','✦','The showstopper pour — a hyper-reflective glaze that creates a perfect mirror finish.'],
      ['Edible Gold Leaf','Finishes','◆','Real 24ct gold leaf applied by hand for an unmistakably luxurious finish.'],
    ];
    for (const f of flavours) {
      await q('INSERT INTO flavours (name,category,icon,"desc") VALUES ($1,$2,$3,$4)', f);
    }
  }
}

// ── ERROR WRAPPER ─────────────────────────────────────────────────────────────
const w = fn => async (req, res) => {
  try { await fn(req, res); }
  catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
app.get('/api/products', w(async (req,res) => {
  const { rows } = await q('SELECT id,name,category,price,"desc",image,sort_order FROM products ORDER BY sort_order,id');
  res.json(rows);
}));
app.post('/api/products', w(async (req,res) => {
  const {name,category,price,desc,image} = req.body;
  const { rows: [r] } = await q('INSERT INTO products (name,category,price,"desc",image) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name,category,price,desc||'',image||'']);
  res.json({id:r.id,name,category,price,desc,image:image||''});
}));
app.put('/api/products/:id', w(async (req,res) => {
  const {name,category,price,desc,image} = req.body;
  await q('UPDATE products SET name=$1,category=$2,price=$3,"desc"=$4,image=$5 WHERE id=$6', [name,category,price,desc||'',image||'',req.params.id]);
  res.json({success:true});
}));
app.delete('/api/products/:id', w(async (req,res) => {
  await q('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── REVIEWS ───────────────────────────────────────────────────────────────────
app.get('/api/reviews', w(async (req,res) => {
  const { rows } = await q('SELECT * FROM reviews ORDER BY id');
  res.json(rows);
}));
app.post('/api/reviews', w(async (req,res) => {
  const {name,rating,text,event,approved} = req.body;
  const { rows: [r] } = await q('INSERT INTO reviews (name,rating,text,event,approved) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name,rating||5,text||'',event||'',!!approved]);
  res.json({id:r.id,name,rating,text,event,approved:!!approved});
}));
app.put('/api/reviews/:id', w(async (req,res) => {
  const {name,rating,text,event,approved} = req.body;
  await q('UPDATE reviews SET name=$1,rating=$2,text=$3,event=$4,approved=$5 WHERE id=$6', [name,rating||5,text||'',event||'',!!approved,req.params.id]);
  res.json({success:true});
}));
app.delete('/api/reviews/:id', w(async (req,res) => {
  await q('DELETE FROM reviews WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── INGREDIENTS ───────────────────────────────────────────────────────────────
app.get('/api/ingredients', w(async (req,res) => {
  const { rows } = await q('SELECT id,name,icon,"desc",sort_order FROM ingredients ORDER BY sort_order,id');
  res.json(rows);
}));
app.post('/api/ingredients', w(async (req,res) => {
  const {name,icon,desc} = req.body;
  const { rows: [r] } = await q('INSERT INTO ingredients (name,icon,"desc") VALUES ($1,$2,$3) RETURNING id', [name,icon||'',desc||'']);
  res.json({id:r.id,name,icon,desc});
}));
app.put('/api/ingredients/:id', w(async (req,res) => {
  const {name,icon,desc} = req.body;
  await q('UPDATE ingredients SET name=$1,icon=$2,"desc"=$3 WHERE id=$4', [name,icon||'',desc||'',req.params.id]);
  res.json({success:true});
}));
app.delete('/api/ingredients/:id', w(async (req,res) => {
  await q('DELETE FROM ingredients WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── VIDEOS ────────────────────────────────────────────────────────────────────
app.get('/api/videos', w(async (req,res) => {
  const { rows } = await q('SELECT id,title,url,"desc" FROM videos ORDER BY id');
  res.json(rows);
}));
app.post('/api/videos', w(async (req,res) => {
  const {title,url,desc} = req.body;
  const { rows: [r] } = await q('INSERT INTO videos (title,url,"desc") VALUES ($1,$2,$3) RETURNING id', [title,url||'',desc||'']);
  res.json({id:r.id,title,url,desc});
}));
app.put('/api/videos/:id', w(async (req,res) => {
  const {title,url,desc} = req.body;
  await q('UPDATE videos SET title=$1,url=$2,"desc"=$3 WHERE id=$4', [title,url||'',desc||'',req.params.id]);
  res.json({success:true});
}));
app.delete('/api/videos/:id', w(async (req,res) => {
  await q('DELETE FROM videos WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── FAQ ───────────────────────────────────────────────────────────────────────
app.get('/api/faq', w(async (req,res) => {
  const { rows } = await q('SELECT id, question as q, answer as a FROM faq ORDER BY sort_order,id');
  res.json(rows);
}));
app.post('/api/faq', w(async (req,res) => {
  const {q: question, a: answer} = req.body;
  const { rows: [r] } = await q('INSERT INTO faq (question,answer) VALUES ($1,$2) RETURNING id', [question,answer||'']);
  res.json({id:r.id,q:question,a:answer});
}));
app.put('/api/faq/:id', w(async (req,res) => {
  const {q: question, a: answer} = req.body;
  await q('UPDATE faq SET question=$1,answer=$2 WHERE id=$3', [question,answer||'',req.params.id]);
  res.json({success:true});
}));
app.delete('/api/faq/:id', w(async (req,res) => {
  await q('DELETE FROM faq WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── MEDIA ─────────────────────────────────────────────────────────────────────
app.get('/api/media', w(async (req,res) => {
  const { rows } = await q('SELECT id,name,type,size,data,added_at as "addedAt" FROM media ORDER BY id DESC');
  res.json(rows);
}));
app.post('/api/media', w(async (req,res) => {
  const {name,type,size,data,addedAt} = req.body;
  const { rows: [r] } = await q('INSERT INTO media (name,type,size,data,added_at) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name,type||'image',size||'',data||'',addedAt||new Date().toLocaleDateString()]);
  res.json({id:r.id,name,type,size,data,addedAt});
}));
app.delete('/api/media/:id', w(async (req,res) => {
  await q('DELETE FROM media WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── ORDERS ────────────────────────────────────────────────────────────────────
app.get('/api/orders', w(async (req,res) => {
  const { rows } = await q('SELECT id,name,email,date,cake_type as "cakeType",notes,submitted_at as "submittedAt" FROM orders ORDER BY id DESC');
  res.json(rows);
}));
app.post('/api/orders', w(async (req,res) => {
  const {name,email,date,cakeType,notes} = req.body;
  const { rows: [r] } = await q('INSERT INTO orders (name,email,date,cake_type,notes) VALUES ($1,$2,$3,$4,$5) RETURNING id,submitted_at', [name,email,date,cakeType,notes||'']);
  res.json({id:r.id,name,email,date,cakeType,notes,submittedAt:r.submitted_at});
}));
app.delete('/api/orders/:id', w(async (req,res) => {
  await q('DELETE FROM orders WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── HOMEPAGE ──────────────────────────────────────────────────────────────────
app.get('/api/homepage', w(async (req,res) => {
  const { rows } = await q('SELECT settings_json FROM homepage WHERE id=1');
  if (!rows.length) return res.json({});
  try { res.json(JSON.parse(rows[0].settings_json || '{}')); }
  catch(e) { res.json({}); }
}));
app.put('/api/homepage', w(async (req,res) => {
  const { rows } = await q('SELECT settings_json FROM homepage WHERE id=1');
  let existing = {};
  try { existing = JSON.parse(rows[0]?.settings_json || '{}'); } catch(e) {}
  const merged = { ...existing, ...req.body };
  await q('UPDATE homepage SET settings_json=$1 WHERE id=1', [JSON.stringify(merged)]);
  res.json({success:true});
}));

// ── FLAVOURS ──────────────────────────────────────────────────────────────────
app.get('/api/flavours', w(async (req,res) => {
  const { rows } = await q('SELECT id,name,category,icon,"desc",sort_order FROM flavours ORDER BY sort_order,id');
  res.json(rows);
}));
app.post('/api/flavours', w(async (req,res) => {
  const {name,category,icon,desc} = req.body;
  const { rows: [r] } = await q('INSERT INTO flavours (name,category,icon,"desc") VALUES ($1,$2,$3,$4) RETURNING id', [name,category||'',icon||'',desc||'']);
  res.json({id:r.id,name,category,icon,desc});
}));
app.put('/api/flavours/:id', w(async (req,res) => {
  const {name,category,icon,desc} = req.body;
  await q('UPDATE flavours SET name=$1,category=$2,icon=$3,"desc"=$4 WHERE id=$5', [name,category||'',icon||'',desc||'',req.params.id]);
  res.json({success:true});
}));
app.delete('/api/flavours/:id', w(async (req,res) => {
  await q('DELETE FROM flavours WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

// ── FILE UPLOAD → CLOUDINARY ──────────────────────────────────────────────────
app.post('/api/upload', express.raw({ type: '*/*', limit: '500mb' }), (req, res) => {
  const raw = (req.headers['x-filename'] || ('file_' + Date.now())).replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicId = 'dorys/' + Date.now() + '_' + raw;

  cloudinary.uploader.upload_stream(
    { public_id: publicId, resource_type: 'auto' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Upload failed: ' + error.message });
      }
      res.json({ url: result.secure_url });
    }
  ).end(req.body);
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'Dorys Bakes.dc.html')));
app.get('/about', (req,res) => res.sendFile(path.join(__dirname,'About.dc.html')));
app.get('/admin', (req,res) => res.sendFile(path.join(__dirname,'Admin Panel.dc.html')));
app.get('/flavours', (req,res) => res.sendFile(path.join(__dirname,'Flavours.dc.html')));
app.get('/reviews', (req,res) => res.sendFile(path.join(__dirname,'Reviews.dc.html')));

// ── START ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✦ Dory's Bakes running → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
