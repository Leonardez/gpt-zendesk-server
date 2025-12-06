import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// 👉 CONFIGURA TU ZENDESK
const ZENDESK_EMAIL = "soporte@autoazur.com";
const ZENDESK_API_TOKEN = "oqbNYee9mHAHcBLzw3hkTDe3jRbOdw6wzd2FhpXB";
const ZENDESK_DOMAIN = "soporteazil.zendesk.com";

// -------------------------------------------------------------
// 🔵 1. Endpoint que recibe Webhook desde Zendesk
// -------------------------------------------------------------
app.post("/gpt", async (req, res) => {
  const { prompt, ticket_id } = req.body;

  console.log("📩 Webhook recibido:", req.body);

  if (!prompt || !ticket_id) {
    console.log("❌ Faltan campos");
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    // ---------------------------------------------------------
    // 🔵 2. Llamada a GPT
    // ---------------------------------------------------------
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
          "Content-Type": "application/json"
        }
      }
    );

    const respuesta = completion.data.choices[0].message.content;
    console.log("🤖 Respuesta generada:", respuesta);

    // ---------------------------------------------------------
    // 🔵 3. Publicar comentario PÚBLICO en el ticket de Zendesk
    // ---------------------------------------------------------
    await axios.post(
      `https://${ZENDESK_DOMAIN}/api/v2/tickets/${ticket_id}.json`,
      {
        ticket: {
          comment: {
            body: respuesta,
            public: true
          }
        }
      },
      {
        auth: {
          username: `${ZENDESK_EMAIL}/token`,
          password: ZENDESK_API_TOKEN
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log("🟩 Comentario agregado en Zendesk");

    return res.json({ status: "ok", message: "Comentario publicado" });

  } catch (error) {
    console.error("🔥 Error en el proceso:", error.response?.data || error);
    return res.status(500).json({ error: "Error interno" });
  }
});

// -------------------------------------------------------------
app.listen(3000, () =>
  console.log("🚀 Servidor iniciado en puerto 3000")
);
