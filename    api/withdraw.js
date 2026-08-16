export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { amount, momo_number, name, network } = req.body;
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'Paystack secret not set' });
  try {
    let bank_code = network === 'mtn' ? 'MTN' : network === 'vod' ? 'VOD' : 'ATL';
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "mobile_money", name, account_number: momo_number, bank_code, currency: "GHS" })
    });
    const recipientData = await recipientRes.json();
    if (!recipientData.status) return res.status(400).json({ error: recipientData.message, details: recipientData });
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: "balance", amount: Math.round(amount*100), recipient: recipientData.data.recipient_code, reason: `Lambamba payout` })
    });
    const transferData = await transferRes.json();
    if (!transferData.status) return res.status(400).json({ error: transferData.message });
    return res.status(200).json({ success: true, data: transferData.data });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}