import express from 'express';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.CHROME_PATH || undefined,
    }
});

// QR Code को Logs में दिखाने के लिए
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

// बेसिक रूट चेक करने के लिए
app.get('/', (req, res) => {
    res.send('WhatsApp Server is running!');
});

// QR Status चेक करने के लिए API
app.get('/qr-status', (req, res) => {
    res.json({ status: "Check Railway Logs for QR Code" });
});

client.initialize();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
