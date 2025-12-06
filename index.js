import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Tu API Key de Zendesk (⚠️ usa un token de API)
const ZENDESK_EMAIL = "soporte@autoazur.com"; 
const ZENDESK_API_TOKEN = "AQUI_TU_TOKEN_DE_API";
const ZENDESK_DOMAIN = "autoazur.zendesk.com";

// ---------------------------------------------------------------------------
// 🔵 1. ENDPOINT PRINCIPAL: Zendesk envía "prompt" y "ticket_id"
// ---------------------------------------------------------------------------
app.post("/gpt", async (req, res) => {
  const { prompt, ticket_id } = req.body;

  console.log("📩 Webhook recibido:", req.body);

  if (!prompt || !ticket_id) {
    console.log("❌ Faltan campos");
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    // -----------------------------------------------------------------------
    // 🔵 2. Llamada al modelo GPT (usa el modelo que prefieras)
    // -----------------------------------------------------------------------
    const completion = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres agente de soporte de AutoAzur." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const respuesta = completion.data.choices[0].message.content;
    console.log("🤖 Respuesta generada:", respuesta);

    // -----------------------------------------------------------------------
    // 🔵 3. PUBLICAR LA RESPUESTA EN ZENDESK COMO COMENTARIO PÚBLICO
    // -----------------------------------------------------------------------
    const zendeskResponse = await axios.post(
      `https://${ZENDESK_DOMAIN}/api/v2/tickets/${ticket_id}.json`,
      {
        ticket: {
          comment: {
