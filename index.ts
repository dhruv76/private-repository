
// This file represents the logic for pages/api/whatsapp.ts
export default async function handler(req: any, res: any) {
  // Replace with your actual Railway backend URL
  const RAILWAY_URL = 'https://your-whatsapp-backend.railway.app';

  try {
    const response = await fetch(`${RAILWAY_URL}/qr-status`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Railway connection failed' });
  }
}
