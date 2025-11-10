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
  try {
    const audio = fs.readFileSync(req.file.path);
    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${HUGGING_FACE_TOKEN}` },
      body: audio
    });
    const data = await response.json();
    fs.unlinkSync(req.file.path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (_, res) => res.send("✅ Whisper proxy działa"));
app.listen(10000, () => console.log("Server running on port 10000"));
