export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  // Accept ANY field name your frontend uses
  const body = req.body || {};
  const phone = body.phone || body.momo || body.momoNumber || body.number || body.phoneNumber;
  const amount = body.amount || body.withdrawAmount;
  const network = (body.network || body.provider || 'mtn').toLowerCase();

  if (!phone || !amount) {
    return res.status(400).json({ error: `Valid phone and amount required - got phone=${phone}, amount=${amount}`, received: body });
  }

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'Missing PAYSTACK_SECRET_KEY in Vercel' });

  try {
    const bank_code = network.includes('vod') ? 'VOD' : network.includes('air') || network.includes('tigo') ? 'ATL' : 'MTN';
    
    const recRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mobile_money', name: phone, account_number: String(phone), bank_code, currency: 'GHS' }),
    });
    const recData = await recRes.json();
    if (!recRes.ok || !recData.data?.recipient_code) throw new Error(recData.message || 'Failed to create MoMo recipient');

    const trRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: Math.round(Number(amount)*100), recipient: recData.data.recipient_code, reason: `Lambamba ${amount}GHS to ${phone}` }),
    });
    const trData = await trRes.json();
    if (!trRes.ok) throw new Error(trData.message || 'Transfer failed');

    return res.status(200).json({ success: true, message: `GHS ${amount} sent!`, data: trData.data });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}