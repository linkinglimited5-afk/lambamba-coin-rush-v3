export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const momoNumber = body.accountNumber || body.phone;
    const momoBank = body.bank || body.network || 'MTN';
    const amount = body.amount;

    if (!momoNumber ||!amount) {
      return res.status(400).json({ error: 'Missing phone/accountNumber or amount' });
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not set in Vercel' });

    const bankCodeMap = { 'MTN':'MTN','mtn':'MTN','Vodafone':'VOD','vodafone':'VOD','Telecel':'VOD','AirtelTigo':'ATL','airteltigo':'ATL' };
    const paystackBankCode = bankCodeMap[momoBank] || 'MTN';

    // 1. Create recipient
    const rRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mobile_money',
        name: momoNumber,
        account_number: momoNumber,
        bank_code: paystackBankCode,
        currency: 'GHS'
      })
    });
    const rData = await rRes.json();
    if (!rData.status) return res.status(400).json({ error: rData.message });

    // 2. Transfer
    const tRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(parseFloat(amount) * 100),
        recipient: rData.data.recipient_code,
        reason: 'Lambamba Withdrawal',
        currency: 'GHS'
      })
    });
    const tData = await tRes.json();
    if (!tData.status) return res.status(400).json({ error: tData.message });

    return res.status(200).json({ success: true, data: tData.data });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}