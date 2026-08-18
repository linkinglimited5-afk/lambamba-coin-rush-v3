export default async function handler(req, res) {
  const { amount, phone, network, accountName } = req.body;
  if (!phone) return res.json({ error: "Phone required" });
  
  let p = phone.startsWith('0') ? phone : '0'+phone;
  const key = process.env.PAYSTACK_SECRET_KEY;

  const r1 = await fetch('https://api.paystack.co/transferrecipient',{
    method:'POST',
    headers:{ Authorization:`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ type:"mobile_money", name:accountName, account_number:p, bank_code:network==="MTN"?"MTN":"VOD", currency:"GHS" })
  }).then(r=>r.json());
  
  if(!r1.status) return res.json({ error: r1.message });

  const r2 = await fetch('https://api.paystack.co/transfer',{
    method:'POST',
    headers:{ Authorization:`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ source:"balance", amount:amount*100, recipient:r1.data.recipient_code, reason:"Lambamba win" })
  }).then(r=>r.json());

  if(!r2.status) return res.json({ error: r2.message });
  return res.json({ success:true });
}