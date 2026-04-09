import pool from './db.js';
import { GoogleGenAI } from "@google/genai";
import https from 'https';

// --- CONFIGURATION ---
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'meconta_secure_token';

// --- HELPERS ---

async function getSystemConfig(key) {
    if (process.env[key]) return process.env[key];
    try {
        const [rows] = await pool.query("SELECT key_value FROM system_config WHERE key_name = ?", [key]);
        return rows[0]?.key_value;
    } catch (e) { return null; }
}

async function getGenAI() {
    let apiKey = await getSystemConfig('API_KEY') || await getSystemConfig('GOOGLE_API_KEY');
    if (!apiKey) throw new Error("API Key missing");
    return new GoogleGenAI({ apiKey });
}

// Download media from WhatsApp URL
async function downloadMedia(url, token) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', (e) => reject(e));
        });
    });
}

// Send message back to WhatsApp
async function sendMessage(to, text) {
    const token = await getSystemConfig('META_ACCESS_TOKEN');
    const phoneId = await getSystemConfig('META_PHONE_ID');
    
    if (!token || !phoneId) {
        console.error("Meta credentials missing");
        return;
    }

    const data = JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: text }
    });

    const options = {
        hostname: 'graph.facebook.com',
        path: `/v18.0/${phoneId}/messages`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        // Log response if needed
    });
    req.write(data);
    req.end();
}

// --- MAIN HANDLER ---

export async function handler(req, res) {
    // 1. Verification Request (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.status(403).json({ error: 'Verification failed' });
    }

    // 2. Event Notification (POST)
    if (req.method === 'POST') {
        try {
            const body = req.body;
            
            // Check if it's a message
            if (body.object === 'whatsapp_business_account' && 
                body.entry && 
                body.entry[0].changes && 
                body.entry[0].changes[0].value.messages && 
                body.entry[0].changes[0].value.messages[0]) {

                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // Phone number (e.g., 5511999999999)
                const messageType = message.type;

                // A. Match User
                // We try to match the last 8-9 digits to handle country code variations
                const cleanPhone = from.slice(-8); 
                const [users] = await pool.query(
                    `SELECT id, name, family_id FROM users WHERE phone LIKE ? LIMIT 1`, 
                    [`%${cleanPhone}%`]
                );

                if (users.length === 0) {
                    await sendMessage(from, "Olá! Não encontrei seu número no MeConta. Adicione seu telefone no perfil do app para começar.");
                    return res.status(200).send('EVENT_RECEIVED');
                }
                
                const user = users[0];
                let transactionData = null;
                const genAI = await getGenAI();
                const metaToken = await getSystemConfig('META_ACCESS_TOKEN');

                // B. Process Input via AI
                const promptText = `
                    Você é um assistente financeiro do MeConta. Analise esta entrada e extraia os dados para uma transação.
                    Hoje é: ${new Date().toISOString().split('T')[0]}.
                    
                    Regras:
                    1. Identifique se é "Entrada" (Income) ou "Saída" (Expense). Padrão: Saída.
                    2. Extraia o valor.
                    3. Extraia uma descrição curta.
                    4. Sugira uma categoria.
                    5. Se não conseguir identificar o valor, retorne null.
                    
                    Retorne APENAS um JSON: { "amount": number, "description": string, "category": string, "type": "Entrada" | "Saída", "date": "YYYY-MM-DD" }
                `;

                // Handle Text
                if (messageType === 'text') {
                    const text = message.text.body;
                    const response = await genAI.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: `Entrada de texto: "${text}". ${promptText}`,
                        config: { responseMimeType: "application/json" }
                    });
                    transactionData = JSON.parse(response.text);
                }
                
                // Handle Audio
                else if (messageType === 'audio') {
                    const mediaId = message.audio.id;
                    // Get Media URL
                    const urlRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, { headers: { 'Authorization': `Bearer ${metaToken}` }});
                    const urlData = await urlRes.json();
                    
                    // Download Binary
                    const audioBuffer = await downloadMedia(urlData.url, metaToken);
                    const base64Audio = audioBuffer.toString('base64');

                    const response = await genAI.models.generateContent({
                        model: "gemini-2.5-flash-native-audio-preview-12-2025",
                        contents: {
                            parts: [
                                { inlineData: { mimeType: "audio/ogg", data: base64Audio } }, // WhatsApp usually sends ogg
                                { text: promptText }
                            ]
                        },
                        config: { responseMimeType: "application/json" }
                    });
                    transactionData = JSON.parse(response.text);
                }

                // Handle Image
                else if (messageType === 'image') {
                    const mediaId = message.image.id;
                    const urlRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, { headers: { 'Authorization': `Bearer ${metaToken}` }});
                    const urlData = await urlRes.json();
                    
                    const imgBuffer = await downloadMedia(urlData.url, metaToken);
                    const base64Img = imgBuffer.toString('base64');

                    const response = await genAI.models.generateContent({
                        model: "gemini-2.5-flash-image",
                        contents: {
                            parts: [
                                { inlineData: { mimeType: message.image.mime_type, data: base64Img } },
                                { text: promptText }
                            ]
                        },
                        config: { responseMimeType: "application/json" }
                    });
                    transactionData = JSON.parse(response.text);
                }

                // C. Save to Database
                if (transactionData && transactionData.amount) {
                    await pool.execute(
                        `INSERT INTO transactions (id, user_id, member_id, date, date_purchase, description, store, amount, amount_planned, type, category, payment_method, is_paid, is_fixed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            Date.now().toString(),
                            user.id,
                            user.id,
                            transactionData.date,
                            transactionData.date, // date_purchase
                            transactionData.description,
                            "WhatsApp", // Store
                            transactionData.amount,
                            transactionData.amount, // amount_planned
                            transactionData.type,
                            transactionData.category,
                            "DEBIT", // Default
                            1, // is_paid
                            0 // is_fixed
                        ]
                    );

                    // Confirmation Message
                    const emoji = transactionData.type === 'Entrada' ? '💰' : '💸';
                    await sendMessage(from, `✅ ${emoji} *Registrado!*\n\n📝 ${transactionData.description}\n💲 R$ ${transactionData.amount}\n📂 ${transactionData.category}\n📅 ${transactionData.date}`);
                } else {
                    await sendMessage(from, "🤔 Não consegui entender os detalhes da transação (valor ou descrição). Tente novamente.");
                }
            }

            return res.status(200).send('EVENT_RECEIVED');

        } catch (error) {
            console.error("WhatsApp Handler Error:", error);
            return res.status(500).json({ error: error.message });
        }
    }
}