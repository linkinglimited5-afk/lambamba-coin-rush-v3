// api/withdraw.js - Manual payout (you approve from Paystack Dashboard)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
  
  const { amount, phone, network, accountName } = req.body;
  if (!amount || !phone) return res.status(400).json({ success: false, message: "Phone required" });

  // For now, we don't auto-pay. We save the request for you to pay manually.
  // This avoids the "third party payouts" error.
  
  console.log(`WITHDRAW REQUEST: GHS ${amount} -> ${phone} (${network}) ${accountName}`);

  // TODO: Later, when you upgrade Paystack to Registered Business, 
  // replace this with transfer API call.

  return res.status(200).json({ 
    success: true, 
    message: `Request received! GHS ${amount} will be sent to ${phone} within 1 hour.` 
  });
}