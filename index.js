const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['CRM-Server', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('--- QR CODE ---');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') console.log('CONNECTED!');
        if (connection === 'close') startWhatsApp();
    });

    app.post('/send', async (req, res) => {
        const { number, message } = req.body;
        await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        res.send({ status: 'sent' });
    });
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server running on ' + PORT);
    startWhatsApp();
});
