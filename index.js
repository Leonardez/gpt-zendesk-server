import express from "express";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Cliente de OpenAI usando la API key del entorno de Render
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ID de tu Assistant (el que me diste antes)
const ASSISTANT_ID = "asst_l7votvQKYhR4ONOmtVvNSWT8";

// Endpoint para Zendesk: POST /gpt
app.post("/gpt", async (req, res) => {
  console.log("📩 Webhook recibido en /gpt con body:", req.body);

  try {
    const { prompt } = req.body;

    if (!prompt) {
      console.log("❌ Falta el campo 'prompt'");
      return res.status(400).json({ error: "Falta el campo 'prompt' en el body" });
    }

    // 1) Crear un thread nuevo
    const thread = await openai.beta.threads.create();

    // 2) Agregar el mensaje del usuario al thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt,
    });

    // 3) Lanzar un run con tu assistant
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // 4) Esperar a que termine el run
    while (run.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 800));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("⏳ Estado del run:", run.status);

      if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
        console.log("❌ Run falló:", run);
        return res.status(500).json({ error: "El assistant no pudo completar la respuesta" });
      }
    }

    // 5) Leer los mensajes del thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
      (m) => m.role === "assistant"
    );

    let replyText = "No se encontró respuesta del assistant.";
    if (assistantMessage && assistantMessage.content && assistantMessage.content[0].type === "text") {
      replyText = assistantMessage.content[0].text.value;
    }

    console.log("✅ Respuesta del assistant:", replyText);

    // 6) Regresar la respuesta a Zendesk
    return res.json({
      reply: replyText,
    });
  } catch (error) {
    console.error("💥 Error en el servidor GPT:", error);
    return res.status(500).json({ error: "Error en el servidor GPT" });
  }
});

// Puerto para Render (usa PORT si existe, si no 3000)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor GPT escuchando en puerto ${PORT}`);
});
