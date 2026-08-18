export default async function handler(req, res) {
  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b);
    
    let phone = String(b.phone || '').replace(/\D/g, '');
    let amount = Number(b.amount);
    
    if (phone.startsWith('0')) phone = '233' + phone.slice(1);
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    if (amount < 20) return res.status(400).json({ error: 'Min GHS 20' });

    const KEY = process.env.PAYSTACK_SECRET_KEY;
    
    // Detect bank
    let bank_code = 'MTN';
    if (b.network?.includes('vod')) bank_code = 'VOD';
    if (b.network?.includes('air') || b.network?.includes('at')) bank_code = 'ATL';

    const r1 = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mobile_money', name: phone, account_number: phone, bank_code, currency: 'GHS' })
    });
    const j1 = await r1.json();
    if (!j1.data?.recipient_code) throw new Error(j1.message);

    const r2 = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: amount * 100, recipient: j1.data.recipient_code, reason: `Payout ${amount}` })
    });
    const j2 = await r2.json();
    if (!j2.status) throw new Error(j2.message);

    return res.status(200).json({ success: true, message: `GHS ${amount} sent` });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}