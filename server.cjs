const express = require('express');
const helmet = require('helmet');
const {rateLimit} = require('express-rate-limit');
const {randomBytes,scryptSync,timingSafeEqual} = require('node:crypto');
const path = require('node:path');
const {existsSync} = require('node:fs');
const {openStore,hash} = require('./lib/store.cjs');
const CATEGORIES=['Bags','Keychains','Little things'];
const clean=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
function createApp(options={}) {
 const env=options.env||process.env;const production=env.NODE_ENV==='production';
 if(production&&(!env.PUBLIC_URL?.startsWith('https://')||!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.length<16))throw Error('Production needs HTTPS PUBLIC_URL and ADMIN_PASSWORD of at least 16 characters.');
 const seed=require('./catalogue.json');const store=openStore(options.database||env.DATABASE_PATH||path.join(__dirname,'data/crochet.sqlite'),seed);
 const app=express();app.disable('x-powered-by');app.set('trust proxy',env.TRUST_PROXY==='1'?1:false);
 app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'"],imgSrc:["'self'","data:"],fontSrc:["'self'"],connectSrc:["'self'"],formAction:["'self'"],frameAncestors:["'none'"],upgradeInsecureRequests:production?[]:null}},strictTransportSecurity:production?undefined:false}));
 app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next()});
 app.use('/api',rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-8',legacyHeaders:false,handler:(_q,r)=>r.status(429).json({error:'Too many requests. Please try again shortly.'})}));
 app.use(express.json({limit:'24kb'}));
 app.use('/api',(req,res,next)=>{
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   const origin=req.get('origin');const allowed=env.PUBLIC_URL||'http://127.0.0.1:5174';
   if(origin&&origin!==new URL(allowed).origin)return res.status(403).json({error:'Request origin not allowed.'});
   if(!req.is('application/json'))return res.status(415).json({error:'JSON required.'});
  }next();
 });
 app.get('/api/health',(_q,r)=>{store.db.prepare('SELECT 1').get();r.json({ok:true})});
 app.get('/api/config',(_q,r)=>r.json({instagram:'https://www.instagram.com/'+(env.INSTAGRAM_HANDLE||'the_crochet_center_')+'/',whatsapp:/^\d{8,15}$/.test(env.WHATSAPP_NUMBER||'')?env.WHATSAPP_NUMBER:null,email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.CONTACT_EMAIL||'')?env.CONTACT_EMAIL:null}));
 app.get('/api/products',(_q,r)=>r.json(store.products()));
 const enquiriesLimit=rateLimit({windowMs:3600000,limit:12,standardHeaders:'draft-8',legacyHeaders:false,handler:(_q,r)=>r.status(429).json({error:'You have sent several enquiries. Please contact us on Instagram or try again later.'})});
 app.post('/api/enquiries',enquiriesLimit,(req,res)=>{
  const b=req.body||{};if(b.website)return res.status(400).json({error:'Unable to send this request.'});
  const customer={name:clean(b.name,100),contact:clean(b.contact,180),channel:clean(b.channel,20)};
  if(customer.name.length<2||!['Email','Instagram','WhatsApp'].includes(customer.channel)||customer.contact.length<3||b.consent!==true)return res.status(400).json({error:'Please add your name, contact details and permission to reply.'});
  if(customer.channel==='Email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.contact))return res.status(400).json({error:'Enter a valid email address.'});
  if(customer.channel==='WhatsApp'&&!/^\+?[\d\s()-]{8,24}$/.test(customer.contact))return res.status(400).json({error:'Enter a valid phone number including country code.'});
  const notes=clean(b.notes,2000);if(!Array.isArray(b.items)||b.items.length>30)return res.status(400).json({error:'Invalid selection.'});
  const products=store.products();const seen=new Set();const items=[];
  for(const v of b.items){const p=products.find(p=>p.id===v.id);if(!p||!Number.isInteger(v.quantity)||v.quantity<1||v.quantity>20||seen.has(v.id))return res.status(400).json({error:'A selected item is unavailable or has an invalid quantity. Refresh your selection.'});seen.add(v.id);items.push({id:p.id,name:p.name,quantity:v.quantity});}
  if(!items.length&&notes.length<10)return res.status(400).json({error:'Choose a product or describe your custom idea in at least 10 characters.'});
  res.status(201).json({...store.request(customer,items,notes),message:'Your enquiry has been saved. The shop will reply using your preferred contact method.'});
 });
 const authLimit=rateLimit({windowMs:900000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,handler:(_q,r)=>r.status(429).json({error:'Too many sign-in attempts. Try again in 15 minutes.'})});
 const salt=randomBytes(16);const expected=scryptSync(env.ADMIN_PASSWORD||randomBytes(32).toString('hex'),salt,64);
 app.post('/api/admin/login',authLimit,(req,res)=>{
  if(!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.length<16)return res.status(503).json({error:'Admin access needs configuration on the server.'});
  const input=clean(req.body?.password,512);if(!timingSafeEqual(scryptSync(input,salt,64),expected))return res.status(401).json({error:'Incorrect password.'});
  const token=randomBytes(32).toString('hex');store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());store.db.prepare('INSERT INTO sessions VALUES(?,?)').run(hash(token),Date.now()+8*3600000);
  res.cookie('tcc_session',token,{httpOnly:true,secure:production,sameSite:'strict',path:'/api/admin',maxAge:8*3600000});res.json({ok:true});
 });
 app.use('/api/admin',(req,res,next)=>{const match=(req.headers.cookie||'').match(/(?:^|;\s*)tcc_session=([a-f0-9]{64})(?:;|$)/);if(!match||!store.db.prepare('SELECT 1 FROM sessions WHERE token_hash=? AND expires>?').get(hash(match[1]),Date.now()))return res.status(401).json({error:'Sign in to continue.'});req.session=hash(match[1]);next()});
 app.post('/api/admin/logout',(req,res)=>{store.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.session);res.clearCookie('tcc_session',{path:'/api/admin',httpOnly:true,secure:production,sameSite:'strict'});res.json({ok:true})});
 app.get('/api/admin/enquiries',(_q,r)=>r.json(store.enquiries()));
 app.delete('/api/admin/enquiries/:id',(req,res)=>{const result=store.db.prepare('DELETE FROM enquiries WHERE id=?').run(req.params.id);res.status(result.changes?200:404).json(result.changes?{ok:true}:{error:'Enquiry not found.'})});
 app.patch('/api/admin/enquiries/:id',(req,res)=>{if(!['new','contacted','completed','archived'].includes(req.body?.status))return res.status(400).json({error:'Invalid status.'});const x=store.db.prepare('UPDATE enquiries SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status,req.params.id);res.status(x.changes?200:404).json(x.changes?{ok:true}:{error:'Enquiry not found.'})});
 app.get('/api/admin/products',(_q,r)=>r.json(store.products(true)));
 app.put('/api/admin/products/:id',(req,res)=>{
  const b=req.body||{};const id=Number(req.params.id);const name=clean(b.name,100),description=clean(b.description,2000),slug=clean(b.slug,100);
  if(!Number.isSafeInteger(id)||id<1||!name||!description||!CATEGORIES.includes(b.category)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||typeof b.active!=='boolean'||!Array.isArray(b.images)||b.images.length<1||b.images.length>8||b.images.some(v=>typeof v!=='string'||!/^assets\/images\/[a-zA-Z0-9_-]+\.(webp|png|jpg)$/.test(v)||!existsSync(path.join(__dirname,v))))return res.status(400).json({error:'Check product fields and existing local image paths.'});
  try{res.json(store.saveProduct({id,slug,name,description,category:b.category,images:b.images,active:b.active,pricePaise:null}))}catch{return res.status(409).json({error:'That product slug is already in use.'})}
 });
 app.use('/api',(_q,r)=>r.status(404).json({error:'Endpoint not found.'}));
 const publicRoot=options.publicRoot||__dirname;
 app.use('/assets',express.static(path.join(publicRoot,'assets'),{maxAge:'1h',dotfiles:'deny'}));
 for(const [url,file] of [['/','index.html'],['/admin','admin.html'],['/privacy','privacy.html']])app.get(url,(_q,r)=>r.sendFile(path.join(publicRoot,file)));
 app.get('/robots.txt',(_q,r)=>r.type('text').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n'));
 app.use((_q,r)=>r.status(404).type('html').send('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Page not found</title><h1>This little loop leads nowhere.</h1><a href="/">Back to The Crochet Center</a></html>'));
 app.use((err,_q,res,_next)=>{if(err.type==='entity.too.large')return res.status(413).json({error:'Request is too large.'});if(err instanceof SyntaxError)return res.status(400).json({error:'Invalid JSON.'});console.error('Request failed:',err.code||err.name);res.status(500).json({error:'Something went wrong. Please try again or contact us on Instagram.'})});
 return {app,store};
}
if(require.main===module){const {app,store}=createApp();const server=app.listen(process.env.PORT||5174,process.env.HOST||'127.0.0.1',()=>console.log(`The Crochet Center: http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||5174}`));for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{store.close();process.exit(0)}));}
module.exports={createApp};
