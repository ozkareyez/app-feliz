require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post('/api/whatsapp-reminder', async (req, res) => {
  const { phone, client: name, event, location, pickup, items } = req.body;

  const itemsText = items.map(i => `\n*${i.qty} ${i.name}`).join('');
  const message = `🏠 *Recordatorio de Recogida*\n\n` +
    `Hola ${name}, este es un recordatorio de recogida para el evento *${event}*.\n\n` +
    `📅 *Fecha:* ${pickup}\n` +
    `📍 *Dirección:* ${location}\n\n` +
    `*Productos a recoger:*\n${itemsText}\n\n` +
    `Gracias por confiar en Aruba Event Rentals!`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
