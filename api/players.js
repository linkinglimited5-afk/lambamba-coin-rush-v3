let PLAYERS = global.PLAYERS || [{id:'demo1',email:'player@test.com',level:5,xp:320,coins:1500}];
export default function handler(req,res){
 if(req.method==='GET') return res.json(PLAYERS);
 if(req.method==='PUT'){ const {id,level}=req.body; const p=PLAYERS.find(x=>x.id===id); if(p) p.level=level; global.PLAYERS=PLAYERS; return res.json({ok:true}); }
 res.status(405).end();
}