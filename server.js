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
    console.log("📤 Wysyłanie pliku do Hugging Face…");
    
    // Czytamy plik jako buffer
    const audioBuffer = fs.readFileSync(req.file.path);
    
    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "audio/mpeg",
      },
      body: audioBuffer,
    });
    
    console.log("📥 Odpowiedź API:", response.status);
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Odpowiedź nie jest JSON:", text.slice(0, 500));
      fs.unlinkSync(req.file.path); // usuń plik
      return res.status(response.status).json({ error: "Błąd API", details: text.slice(0, 200) });
    }
    
    fs.unlinkSync(req.file.path); // usuń plik tymczasowy
    
    // Hugging Face zwraca { text: "..." }
    res.json({ text: data.text || data });
    
  } catch (err) {
    console.error("❌ Wyjątek:", err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (_, res) => res.send("✅ Whisper proxy działa poprawnie"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Proxy działa na porcie ${PORT}`));
