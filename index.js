import express from "express";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ASSISTANT_ID = "asst_l7votvQKYhR4ONOmtVvNSWT8";

app.post("/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    let status = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (status.status !== "completed") {
      await new Promise((r) => setTimeout(r, 800));
      status = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const reply = messages.data[0].content[0].text.value;

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor GPT" });
  }
});

app.listen(3000, () => console.log("Servidor GPT funcionando en puerto 3000"));
