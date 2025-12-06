import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

// -----------------------------
// CONFIG OPENAI
// -----------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// -----------------------------
// FUNCIÓN: ENVIAR RESPUESTA A ZENDESK
// -----------------------------
async function addCommentToZendesk(ticketId, text) {
  const zendeskEmail = "TU_CORREO_DE_ZENDESK/token";   // ← CAMBIAR
  const zendeskToken = "TU_API_TOKEN";                 // ← CAMBIAR

  const url = `https://soporteazil.zendesk.com/api/v2/tickets/${ticketId}.json`;

  console.log("🟦 Enviando comentario a Zendesk:", ticketId);

  try {
    await axios.put(
      url,
      {
        ticket: {
          comment: {
            body: text,
            public: false   // Nota interna
          }
        }
      },
      {
        auth: {
          username: zendeskEmail,
          password: zendeskToken
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Comentario agregado correctamente a Zendesk");
  } catch (err) {
    console.error("❌ Error enviando comentario a Zendesk:", err.response?.data || err.message);
  }
}

// -----------------------------
// ENDPOINT /gpt — RECIBE EL WEBHOOK DE ZENDESK
// -----------------------------
app.post("/gpt", async (req, res) => {
  try {
    console.log("📩 Webhook recibido en /gpt con body:", req.body);

    const { prompt, ticket_id } = req.body;

    if (!prompt || !ticket_id) {
      console.log("❌ Faltan campos en el body");
      return res.status(400).json({ error: "Faltan campos" });
    }

    // -----------------------------
    // 1. CONSULTAR OPENAI ASSISTANT
    // -----------------------------
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const reply = response.choices[0].message.content;

    console.log("🤖 Respuesta del assistant:", reply);

    // -----------------------------
    // 2. AGREGAR LA RESPUESTA AL TICKET
    // -----------------------------
    await addCommentToZendesk(ticket_id, reply);

    return res.json({ reply });
  } catch (err) {
    console.error("🔥 Error procesando /gpt:", err);
    return res.status(500).json({ error: "No se pudo completar la operación" });
  }
});

// -----------------------------
app.listen(3000, () => {
  console.log("🚀 Servidor iniciado en puerto 3000");
});
