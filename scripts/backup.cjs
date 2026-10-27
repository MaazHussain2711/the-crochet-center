const {DatabaseSync,backup}=require('node:sqlite');
const path=require('node:path');
const destination=process.argv[2];if(!destination||!path.isAbsolute(destination))throw Error('Provide an absolute destination path outside the web assets.');
const db=new DatabaseSync(process.env.DATABASE_PATH||path.resolve(__dirname,'../data/crochet.sqlite'),{readOnly:true});
backup(db,destination).then(()=>{db.close();console.log('Backup complete.')}).catch(e=>{db.close();console.error(e.message);process.exitCode=1});
