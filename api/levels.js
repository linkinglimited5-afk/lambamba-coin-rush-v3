let LEVELS = global.LEVELS || [];
export default function handler(req,res){
 if(req.method==='GET') return res.json(LEVELS);
 if(req.method==='POST'){ LEVELS.push(req.body); global.LEVELS=LEVELS; return res.json({ok:true}); }
 if(req.method==='DELETE'){ const l=+req.query.level; LEVELS=LEVELS.filter(x=>x.level!==l); global.LEVELS=LEVELS; return res.json({ok:true}); }
 res.status(405).end();
}