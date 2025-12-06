import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// 👉 CONFIGURA TU ZENDESK
const ZENDESK_EMAIL = "soporte@autoazur.com";
const ZENDESK_API_TOKEN = "hMlvIaWx0M6Z0Zkgb0zfNRgv9qzg5zhrDnhTMhmc";  // 🔥 Nuevo token correcto
const ZENDESK_DOMAIN = "soporteazil.zendesk.com"; // 🔥 Dominio validado

// -------------------------------------------------------------
// 🔵 1. Endpoint que recibe Webhook desde Zendesk
// -------------------------------------------------------------
app.post("/gpt", async (req, res) => {
  const { prompt, ticket_id } = req.body;

  console.log("📩 Webhook recibido:", req.body);

  if (!prompt || !ticket_id) {
    console.log("❌ Faltan campos en webhook");
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    // ---------------------------------------------------------
    // 🔵 2. Llamada al modelo GPT
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
    console.log("🤖 Respuesta generada por GPT:", respuesta);

    // ---------------------------------------------------------
    // 🔵 3. Agregar comentario público al ticket en Zendesk
    // ---------------------------------------------------------
    const zendeskResponse = await axios.put(
      `https://${ZENDESK_DOMAIN}/api/v2/tickets/${ticket_id}.json`,
      {
        ticket: {
          comment: {
            body: respuesta,
            public: true  // 🔥 Comentario PUBLICO
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(
            `${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`
          ).toString("base64")}`
        }
      }
    );

    console.log("🟩 Comentario agregado correctamente en Zendesk:", zendeskResponse.data);

    return res.json({ status: "ok", message: "Comentario publicado correctamente" });

  } catch (error) {
    console.error("🔥 Error en el proceso GPT → Zendesk:", error.response?.data || error);
    return res.status(500).json({ error: "Error interno" });
  }
});

// -------------------------------------------------------------
app.listen(3000, () =>
  console.log("🚀 Servidor iniciado en puerto 3000")
);
