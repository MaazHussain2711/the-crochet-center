const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','admin.html','privacy.html','assets','lib','server.cjs','catalogue.json','package.json','package-lock.json'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
for(const p of JSON.parse(fs.readFileSync(path.join(root,'catalogue.json'),'utf8')))for(const image of p.images)if(!fs.existsSync(path.join(out,image)))throw Error('Missing image: '+image);
console.log('Built deployable application in dist. Database and secrets excluded.');
