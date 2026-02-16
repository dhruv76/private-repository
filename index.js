const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function startWhatsApp() {
    // Session save karne ke liye
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    // Socket setup (Error line removed here)
    const sock = makeWASocket({
        auth: state,
        browser: ['CRM-Server', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // QR Code print karne ka naya tarika
        if (qr) {
            console.log('\n--- SCAN THIS QR CODE ---');
            qrcode.generate(qr, { small: true });
            console.log('--------------------------\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) startWhatsApp();
        } else if (connection === 'open') {
            console.log('WHATSAPP CONNECTED SUCCESSFULLY!');
        }
    });
let currentQR = "";

sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
        currentQR = qr; // QR को सेव कर रहे हैं
        console.log("New QR Generated!");
    }
    if (connection === 'open') console.log('CONNECTED!');
});

// ब्राउज़र में QR देखने के लिए यह लिंक
app.get('/scan', async (req, res) => {
    if (!currentQR) return res.send("QR कोड अभी जनरेट नहीं हुआ है, कृपया 10 सेकंड रुकें और पेज रिफ्रेश करें।");
    const qrImage = await QRCode.toDataURL(currentQR);
    res.send(`<img src="${qrImage}" style="width:300px;"> <p>अपने व्हाट्सएप से इसे स्कैन करें</p>`);
});
    // Message bhejne ke liye API
    app.post('/send', async (req, res) => {
        const { number, message } = req.body;
        try {
            await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
            res.send({ status: 'sent', message: 'Success' });
        } catch (err) {
            res.status(500).send({ status: 'error', error: err.message });
        }
    });
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
    startWhatsApp();
});
