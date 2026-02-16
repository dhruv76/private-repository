const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let currentQR = ""; 

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        browser: ['CRM-Server', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            currentQR = qr;
            console.log('--- NEW QR GENERATED! Open /scan link to see it ---');
            qrcodeTerminal.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('CONNECTED!');
            currentQR = ""; 
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startWhatsApp();
        }
    });

    app.get('/scan', async (req, res) => {
        if (!currentQR) return res.send("<h3>QR तैयार हो रहा है... 10 सेकंड बाद Refresh करें।</h3>");
        const qrImage = await QRCode.toDataURL(currentQR);
        res.send(`<div style="text-align:center;margin-top:50px;"><h2>Scan with WhatsApp</h2><img src="${qrImage}" style="width:300px;"><p>Scanning ke baad ye apne aap connect ho jayega.</p></div>`);
    });

    app.post('/send', async (req, res) => {
        const { number, message } = req.body;
        await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        res.send({ status: 'sent' });
    });
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
    startWhatsApp();
});
