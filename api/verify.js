// api/verify.js - Verifies deposit went to YOUR Paystack balance
export default async function handler(req, res) {
  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: "No reference" });

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await verifyRes.json();

    if (data.status && data.data.status === 'success') {
      // Money is now in YOUR Paystack balance
      // This is your float!
      console.log(`DEPOSIT SUCCESS: GHS ${data.data.amount/100} from ${data.data.customer.email}`);
      return res.status(200).json({ success: true, amount: data.data.amount/100 });
    } else {
      return res.status(400).json({ success: false, message: "Verification failed" });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}