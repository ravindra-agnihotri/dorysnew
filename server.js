'use strict';
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dfcoc7qqq',
  api_key:    process.env.CLOUDINARY_API_KEY    || '845566563795258',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'CgNWzBpLXmWUARc6-uDaBtrAKzM',
});

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists (kept for legacy/video local fallback)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));

// ── DATABASE ──────────────────────────────────────────────────────────────────
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'dorys_bakes.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    category TEXT DEFAULT '',
    price TEXT DEFAULT '',
    desc TEXT DEFAULT '',
    image TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    rating INTEGER DEFAULT 5,
    text TEXT DEFAULT '',
    event TEXT DEFAULT '',
    approved INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    desc TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT DEFAULT '',
    url TEXT DEFAULT '',
    desc TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT DEFAULT '',
    answer TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    type TEXT DEFAULT 'image',
    size TEXT DEFAULT '',
    data TEXT DEFAULT '',
    added_at TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    date TEXT DEFAULT '',
    cake_type TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    submitted_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS homepage (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings_json TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS flavours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    category TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    desc TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );
`);

// ── MIGRATE: add new columns if upgrading from old schema ─────────────────────
try { db.exec(`ALTER TABLE homepage ADD COLUMN settings_json TEXT DEFAULT '{}'`); } catch(e) {}
try { db.exec(`CREATE TABLE IF NOT EXISTS flavours (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT DEFAULT '', category TEXT DEFAULT '', icon TEXT DEFAULT '', desc TEXT DEFAULT '', sort_order INTEGER DEFAULT 0)`); } catch(e) {}

// ── SEED DEFAULT DATA ─────────────────────────────────────────────────────────
function seed() {
  if (db.prepare('SELECT COUNT(*) as c FROM products').get().c === 0) {
    const ins = db.prepare('INSERT INTO products (name,category,price,desc,image) VALUES (?,?,?,?,?)');
    [
      ['Duchess Rose','Designer Cake','$180','Four-layer vanilla bean cake, strawberry compote, Swiss meringue buttercream, edible rose petals.',''],
      ['Velvet Noir','Designer Cake','$195','Dark chocolate ganache cake with espresso cream, salted caramel drip, and gold leaf finish.',''],
      ['Lemon Reverie','Cheesecake','$95','Burnt Basque cheesecake with lemon curd swirl, graham cracker base, fresh blueberry compote.',''],
      ['Garden Party','Cupcakes','$48/doz','Vanilla sponge cupcakes with seasonal flower buttercream piping. Perfect for any celebration.',''],
      ['Midnight Truffle','Designer Cake','$220','Belgian dark chocolate mousse cake, hazelnut praline crunch, mirror glaze finish.',''],
      ['Peach Blossom','Cheesecake','$110','Classic New York cheesecake with roasted peach topping and almond shortbread crust.',''],
    ].forEach(p => ins.run(...p));
  }
  if (db.prepare('SELECT COUNT(*) as c FROM reviews').get().c === 0) {
    const ins = db.prepare('INSERT INTO reviews (name,rating,text,event,approved) VALUES (?,?,?,?,?)');
    [
      ['Amelia R.',5,"Dory's made our wedding cake and it was absolutely breathtaking. Every single guest asked for the recipe. Perfection!",'Wedding',1],
      ['James T.',5,'The Velvet Noir is my birthday tradition now. Three years running. It gets better every single time.','Birthday',1],
      ['Sofia M.',5,'Ordered the Garden Party cupcakes for my daughter\'s baby shower. The presentation was stunning and they tasted even better.','Baby Shower',1],
      ['Priya K.',4,'Beautiful cakes and wonderful service. The cheesecake was heavenly — will definitely order again!','Anniversary',0],
    ].forEach(r => ins.run(...r));
  }
  if (db.prepare('SELECT COUNT(*) as c FROM ingredients').get().c === 0) {
    const ins = db.prepare('INSERT INTO ingredients (name,icon,desc) VALUES (?,?,?)');
    [
      ['Single-Origin Flour','🌾','Stone-ground from a family mill in Vermont. Lower gluten, more flavour.'],
      ['Cultured Butter','🧈','84% fat European-style butter, churned from pasture-raised cream.'],
      ['Raw Cane Sugar','✦','Unrefined cane sugar that adds a subtle molasses depth to every bake.'],
      ['Free-Range Eggs','🥚','Sourced from a local farm. Richer yolks mean a more golden, flavourful crumb.'],
      ['Valrhona Chocolate','◆','Our preferred couverture for ganaches, mousses, and chocolate sponges.'],
      ['Real Vanilla','◇','Tahitian vanilla pods steeped in our house-made extract. No artificial flavours, ever.'],
    ].forEach(i => ins.run(...i));
  }
  if (db.prepare('SELECT COUNT(*) as c FROM videos').get().c === 0) {
    const ins = db.prepare('INSERT INTO videos (title,url,desc) VALUES (?,?,?)');
    [
      ['Making the Duchess Rose','','Watch a four-layer cake come together from scratch.'],
      ['The Art of Mirror Glaze','','A mesmerizing pour that turns a cake into a masterpiece.'],
    ].forEach(v => ins.run(...v));
  }
  if (db.prepare('SELECT COUNT(*) as c FROM faq').get().c === 0) {
    const ins = db.prepare('INSERT INTO faq (question,answer) VALUES (?,?)');
    [
      ['How far in advance should I place my order?','We recommend placing custom cake orders at least 2–3 weeks in advance. For wedding cakes, 2–3 months is ideal to secure your date and allow time for a detailed consultation.'],
      ['Do you offer gluten-free or vegan options?','Yes! We can accommodate most dietary requirements including gluten-free and vegan. Please mention your needs in the order form and we\'ll tailor the recipe accordingly.'],
      ['Can I schedule a tasting?','Absolutely. We offer complimentary tasting sessions by appointment on Tuesdays and Thursdays. Simply send us a message through the order form and we\'ll arrange a time.'],
      ['How is pricing determined?','Custom cake pricing depends on size, design complexity, flavour combinations, and ingredients. After reviewing your request, we\'ll send a detailed quote within 24 hours. A 50% deposit confirms your order.'],
      ['Do you deliver?','We offer local delivery within a 20-mile radius for an additional fee. For orders outside this area, collection from our kitchen is available Tuesday through Sunday during opening hours.'],
      ['How many people does a cake serve?','Our standard 6\" round serves 10–12, an 8\" serves 20–24, and a 10\" serves 35–40. We also create multi-tiered cakes for larger celebrations.'],
    ].forEach(f => ins.run(...f));
  }
  if (db.prepare('SELECT COUNT(*) as c FROM homepage').get().c === 0) {
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
    db.prepare('INSERT INTO homepage (id, settings_json) VALUES (1, ?)').run(JSON.stringify(defaults));
  } else {
    const row = db.prepare('SELECT settings_json FROM homepage WHERE id=1').get();
    if (row && (!row.settings_json || row.settings_json === '{}')) {
      try {
        const old = db.prepare('SELECT * FROM homepage WHERE id=1').get();
        const migrated = {
          tagline: old.tagline||'', sub: old.sub||'', about1: old.about1||'', about2: old.about2||'',
          years: old.years||'5+', ribbonBg: old.ribbon_bg||'#2A1A0E',
          ribbonTextColor: old.ribbon_text_color||'rgba(253,246,236,0.48)',
          ribbonAccentColor: old.ribbon_accent_color||'#C4883A',
          marqueeItems: old.marquee_items||'', contactAddress: old.contact_address||'',
          instagramHandle: old.instagram_handle||'@dorysbakes', instagramUrl: old.instagram_url||''
        };
        db.prepare('UPDATE homepage SET settings_json=? WHERE id=1').run(JSON.stringify(migrated));
      } catch(e) {}
    }
  }
  if (db.prepare('SELECT COUNT(*) as c FROM flavours').get().c === 0) {
    const ins = db.prepare('INSERT INTO flavours (name,category,icon,desc) VALUES (?,?,?,?)');
    [
      ['Vanilla Bean','Cake Bases','◇','Light, fragrant sponge using real Tahitian vanilla pods.'],
      ['Dark Chocolate','Cake Bases','◆','Rich Belgian Valrhona chocolate sponge — dense, moist, and deeply satisfying.'],
      ['Lemon Zest','Cake Bases','✦','Bright, citrusy sponge with fresh lemon zest and juice.'],
      ['Strawberry Compote','Fillings','◆','House-made fresh strawberry compote — slightly tart, bright, and never overly sweet.'],
      ['Salted Caramel','Fillings','◇','Slow-cooked caramel with fleur de sel — rich, buttery, and utterly addictive.'],
      ['Swiss Meringue','Buttercreams','◇','Impossibly silky buttercream, less sweet than American style. Our signature finish.'],
      ['Mirror Glaze','Finishes','✦','The showstopper pour — a hyper-reflective glaze that creates a perfect mirror finish.'],
      ['Edible Gold Leaf','Finishes','◆','Real 24ct gold leaf applied by hand for an unmistakably luxurious finish.'],
    ].forEach(f => ins.run(...f));
  }
}
seed();

// ── ERROR WRAPPER ─────────────────────────────────────────────────────────────
const w = fn => (req, res) => {
  try { fn(req, res); }
  catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
app.get('/api/products', w((req,res) =>
  res.json(db.prepare('SELECT * FROM products ORDER BY sort_order,id').all())
));
app.post('/api/products', w((req,res) => {
  const {name,category,price,desc,image} = req.body;
  const r = db.prepare('INSERT INTO products (name,category,price,desc,image) VALUES (?,?,?,?,?)').run(name,category,price,desc||'',image||'');
  res.json({id:r.lastInsertRowid,name,category,price,desc,image:image||''});
}));
app.put('/api/products/:id', w((req,res) => {
  const {name,category,price,desc,image} = req.body;
  db.prepare('UPDATE products SET name=?,category=?,price=?,desc=?,image=? WHERE id=?').run(name,category,price,desc||'',image||'',req.params.id);
  res.json({success:true});
}));
app.delete('/api/products/:id', w((req,res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── REVIEWS ───────────────────────────────────────────────────────────────────
app.get('/api/reviews', w((req,res) =>
  res.json(db.prepare('SELECT * FROM reviews ORDER BY id').all().map(r=>({...r,approved:r.approved===1})))
));
app.post('/api/reviews', w((req,res) => {
  const {name,rating,text,event,approved} = req.body;
  const r = db.prepare('INSERT INTO reviews (name,rating,text,event,approved) VALUES (?,?,?,?,?)').run(name,rating||5,text||'',event||'',approved?1:0);
  res.json({id:r.lastInsertRowid,name,rating,text,event,approved:!!approved});
}));
app.put('/api/reviews/:id', w((req,res) => {
  const {name,rating,text,event,approved} = req.body;
  db.prepare('UPDATE reviews SET name=?,rating=?,text=?,event=?,approved=? WHERE id=?').run(name,rating||5,text||'',event||'',approved?1:0,req.params.id);
  res.json({success:true});
}));
app.delete('/api/reviews/:id', w((req,res) => {
  db.prepare('DELETE FROM reviews WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── INGREDIENTS ───────────────────────────────────────────────────────────────
app.get('/api/ingredients', w((req,res) =>
  res.json(db.prepare('SELECT * FROM ingredients ORDER BY sort_order,id').all())
));
app.post('/api/ingredients', w((req,res) => {
  const {name,icon,desc} = req.body;
  const r = db.prepare('INSERT INTO ingredients (name,icon,desc) VALUES (?,?,?)').run(name,icon||'',desc||'');
  res.json({id:r.lastInsertRowid,name,icon,desc});
}));
app.put('/api/ingredients/:id', w((req,res) => {
  const {name,icon,desc} = req.body;
  db.prepare('UPDATE ingredients SET name=?,icon=?,desc=? WHERE id=?').run(name,icon||'',desc||'',req.params.id);
  res.json({success:true});
}));
app.delete('/api/ingredients/:id', w((req,res) => {
  db.prepare('DELETE FROM ingredients WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── VIDEOS ────────────────────────────────────────────────────────────────────
app.get('/api/videos', w((req,res) =>
  res.json(db.prepare('SELECT * FROM videos ORDER BY id').all())
));
app.post('/api/videos', w((req,res) => {
  const {title,url,desc} = req.body;
  const r = db.prepare('INSERT INTO videos (title,url,desc) VALUES (?,?,?)').run(title,url||'',desc||'');
  res.json({id:r.lastInsertRowid,title,url,desc});
}));
app.put('/api/videos/:id', w((req,res) => {
  const {title,url,desc} = req.body;
  db.prepare('UPDATE videos SET title=?,url=?,desc=? WHERE id=?').run(title,url||'',desc||'',req.params.id);
  res.json({success:true});
}));
app.delete('/api/videos/:id', w((req,res) => {
  db.prepare('DELETE FROM videos WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── FAQ ───────────────────────────────────────────────────────────────────────
app.get('/api/faq', w((req,res) =>
  res.json(db.prepare('SELECT id, question as q, answer as a FROM faq ORDER BY sort_order,id').all())
));
app.post('/api/faq', w((req,res) => {
  const {q,a} = req.body;
  const r = db.prepare('INSERT INTO faq (question,answer) VALUES (?,?)').run(q,a||'');
  res.json({id:r.lastInsertRowid,q,a});
}));
app.put('/api/faq/:id', w((req,res) => {
  const {q,a} = req.body;
  db.prepare('UPDATE faq SET question=?,answer=? WHERE id=?').run(q,a||'',req.params.id);
  res.json({success:true});
}));
app.delete('/api/faq/:id', w((req,res) => {
  db.prepare('DELETE FROM faq WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── MEDIA ─────────────────────────────────────────────────────────────────────
app.get('/api/media', w((req,res) =>
  res.json(db.prepare('SELECT id,name,type,size,data,added_at as addedAt FROM media ORDER BY id DESC').all())
));
app.post('/api/media', w((req,res) => {
  const {name,type,size,data,addedAt} = req.body;
  const r = db.prepare('INSERT INTO media (name,type,size,data,added_at) VALUES (?,?,?,?,?)').run(name,type||'image',size||'',data||'',addedAt||new Date().toLocaleDateString());
  res.json({id:r.lastInsertRowid,name,type,size,data,addedAt});
}));
app.delete('/api/media/:id', w((req,res) => {
  db.prepare('DELETE FROM media WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── ORDERS ────────────────────────────────────────────────────────────────────
app.get('/api/orders', w((req,res) =>
  res.json(db.prepare('SELECT id,name,email,date,cake_type as cakeType,notes,submitted_at as submittedAt FROM orders ORDER BY id DESC').all())
));
app.post('/api/orders', w((req,res) => {
  const {name,email,date,cakeType,notes} = req.body;
  const submittedAt = new Date().toISOString();
  const r = db.prepare('INSERT INTO orders (name,email,date,cake_type,notes,submitted_at) VALUES (?,?,?,?,?,?)').run(name,email,date,cakeType,notes||'',submittedAt);
  res.json({id:r.lastInsertRowid,name,email,date,cakeType,notes,submittedAt});
}));
app.delete('/api/orders/:id', w((req,res) => {
  db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── HOMEPAGE ──────────────────────────────────────────────────────────────────
app.get('/api/homepage', w((req,res) => {
  const row = db.prepare('SELECT settings_json FROM homepage WHERE id=1').get();
  if (!row) return res.json({});
  try { res.json(JSON.parse(row.settings_json || '{}')); }
  catch(e) { res.json({}); }
}));
app.put('/api/homepage', w((req,res) => {
  const current = db.prepare('SELECT settings_json FROM homepage WHERE id=1').get();
  let existing = {};
  try { existing = JSON.parse(current && current.settings_json || '{}'); } catch(e) {}
  const merged = { ...existing, ...req.body };
  db.prepare('UPDATE homepage SET settings_json=? WHERE id=1').run(JSON.stringify(merged));
  res.json({success:true});
}));

// ── FLAVOURS ──────────────────────────────────────────────────────────────────
app.get('/api/flavours', w((req,res) =>
  res.json(db.prepare('SELECT * FROM flavours ORDER BY sort_order,id').all())
));
app.post('/api/flavours', w((req,res) => {
  const {name,category,icon,desc} = req.body;
  const r = db.prepare('INSERT INTO flavours (name,category,icon,desc) VALUES (?,?,?,?)').run(name,category||'',icon||'',desc||'');
  res.json({id:r.lastInsertRowid,name,category,icon,desc});
}));
app.put('/api/flavours/:id', w((req,res) => {
  const {name,category,icon,desc} = req.body;
  db.prepare('UPDATE flavours SET name=?,category=?,icon=?,desc=? WHERE id=?').run(name,category||'',icon||'',desc||'',req.params.id);
  res.json({success:true});
}));
app.delete('/api/flavours/:id', w((req,res) => {
  db.prepare('DELETE FROM flavours WHERE id=?').run(req.params.id);
  res.json({success:true});
}));

// ── FILE UPLOAD → CLOUDINARY ──────────────────────────────────────────────────
// Images & files go to Cloudinary for permanent storage (survives Railway redeploys).
// Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Railway Variables.
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

app.get('/', (req,res) => res.sendFile(path.join(__dirname,'Dorys Bakes.dc.html')));
app.get('/about', (req,res) => res.sendFile(path.join(__dirname,'About.dc.html')));
app.get('/admin', (req,res) => res.sendFile(path.join(__dirname,'Admin Panel.dc.html')));
app.get('/flavours', (req,res) => res.sendFile(path.join(__dirname,'Flavours.dc.html')));
app.get('/reviews', (req,res) => res.sendFile(path.join(__dirname,'Reviews.dc.html')));

app.listen(PORT, () => console.log(`✦ Dory's Bakes running → http://localhost:${PORT}`));
