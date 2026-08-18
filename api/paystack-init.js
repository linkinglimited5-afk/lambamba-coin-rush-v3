
export default async function handler(req, res) {
  const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_KEY) {
    return res.status(500).json({ error: "Paystack key not set in Vercel" });
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "player@lambamba.com",
        amount: 2000, // 20 GHS in pesewas
        currency: "GHS",
        callback_url: `https://${req.headers.host}/`,
        metadata: { game: "LAMBAMBA COIN RUSH" }
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json(data);
    }

    // Redirect to Paystack payment page
    res.redirect(302, data.data.authorization_url);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}