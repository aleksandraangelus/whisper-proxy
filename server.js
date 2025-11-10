import express from "express";
import multer from "multer";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

const HUGGING_FACE_TOKEN = process.env.HF_TOKEN;
const MODEL_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

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
    console.log("📤 Wysyłanie pliku do Hugging Face...");
    const audio = fs.readFileSync(req.file.path);

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
      },
      body: audio,
    });

    console.log("📥 Odpowiedź API:", response.status);
    const data = await response.json();
    fs.unlink(req.file.path, () => {});

    if (!response.ok) {
      console.error("❌ Błąd z Hugging Face:", data);
      return res.status(500).json({ error: data });
    }

    console.log("✅ Udało się:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Wyjątek:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (_, res) => res.send("✅ Whisper proxy działa poprawnie"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Proxy działa na porcie ${PORT}`));
