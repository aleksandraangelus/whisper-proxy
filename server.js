import express from "express";
import multer from "multer";
import cors from "cors";
import fetch, { FormData, fileFrom } from "node-fetch";
import fs from "fs";

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

const HUGGING_FACE_TOKEN = process.env.HF_TOKEN;
const MODEL_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo";

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  console.log("➡️  Otrzymano żądanie /transcribe");

  if (!req.file) {
    console.log("❌ Brak pliku audio");
    return res.status(400).json({ error: "Brak pliku audio" });
  }

  if (!HUGGING_FACE_TOKEN) {
    console.log("❌ Brak tokenu HF_TOKEN");
    return res.status(500).json({ error: "Brak tokenu HF_TOKEN" });
  }

  try {
    console.log("📤 Wysyłanie pliku do Hugging Face (turbo)…");

    const formData = new FormData();
    formData.append("file", await fileFrom(req.file.path, "audio/mpeg"));

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
      },
      body: formData,
    });

    console.log("📥 Odpowiedź API:", response.status);

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Odpowiedź nie jest JSON:", text.slice(0, 200));
      return res.status(response.status).send(text);
    }

    fs.unlink(req.file.path, () => {}); // usuń plik tymczasowy
    res.status(response.status).json(data);

  } catch (err) {
    console.error("❌ Wyjątek:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (_, res) => res.send("✅ Whisper proxy działa poprawnie"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Proxy działa na porcie ${PORT}`));
