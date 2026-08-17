export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  
  let b = req.body;
  if(typeof b === 'string'){ try{ b=JSON.parse(b);}catch{} }
  b = b || {};
  // Try EVERY possible name + also check query params
  const phone = b.phone || b.momoNumber || b.momo_number || b.number || b.msisdn || b.recipient || b.phoneNumber || req.query.phone;
  let amount = b.amount || b.withdrawAmount || b.value || 20;
  amount = Number(amount);
  
  if(!phone) return res.status(400).json({error: `Phone missing! I received: ${JSON.stringify(b)}. Fix index.html to send {phone: '055...'}`});
  if(!amount || amount < 20) return res.status(400).json({error: 'Min amount is GHS 20'});

  const KEY = process.env.PAYSTACK_SECRET_KEY;
  if(!KEY) return res.status(500).json({error:'Missing PAYSTACK_SECRET_KEY in Vercel env vars'});
  
  try{
    const bank = (b.network||'mtn').toLowerCase().includes('vod')?'VOD':(b.network||'').includes('air')?'ATL':'MTN';
    const r1 = await fetch('https://api.paystack.co/transferrecipient',{method:'POST',headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify({type:'mobile_money',name:String(phone),account_number:String(phone),bank_code:bank,currency:'GHS'})});
    const j1 = await r1.json(); if(!j1.data?.recipient_code) throw new Error(j1.message||JSON.stringify(j1));
    const r2 = await fetch('https://api.paystack.co/transfer',{method:'POST',headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify({source:'balance',amount:Math.round(amount*100),recipient:j1.data.recipient_code,reason:`Lambamba payout ${amount}GHS`})});
    const j2 = await r2.json(); if(!r2.ok) throw new Error(j2.message||JSON.stringify(j2));
    return res.status(200).json({success:true,message:`GHS ${amount} sent to ${phone}`});
  }catch(e){ return res.status(500).json({error:e.message}); }
}