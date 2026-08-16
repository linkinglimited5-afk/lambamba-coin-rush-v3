export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { accountNumber, bank, amount } = req.body || {};
    if (!accountNumber ||!bank ||!amount) return res.status(400).json({ error: 'Missing fields' });

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'No Paystack Key' });

    // Ghana MTN bank codes mapping - Paystack needs correct code
    const bankCodeMap = {
      'MTN': 'MTN', 'mtn': 'MTN',
      'Vodafone': 'VOD', 'vodafone': 'VOD', 'Telecel': 'VOD',
      'AirtelTigo': 'ATL', 'airteltigo': 'ATL'
    };
    const paystackBankCode = bankCodeMap[bank] || bank;

    // 1. Create recipient - GHANA MOBILE MONEY (no resolve needed)
    const rRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mobile_money',
        name: accountNumber,
        account_number: accountNumber,
        bank_code: paystackBankCode,
        currency: 'GHS'
      })
    });
    const rData = await rRes.json();
    if (!rData.status) return res.status(400).json({ error: rData.message });

    // 2. Transfer
    const tRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(parseFloat(amount)*100),
        recipient: rData.data.recipient_code,
        reason: 'Lambamba Withdrawal',
        currency: 'GHS'
      })
    });
    const tData = await tRes.json();
    if (tData.status) return res.status(200).json({ success: true, data: tData.data });
    else return res.status(400).json({ error: tData.message });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}