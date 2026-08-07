const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const YouTube = require("youtube-sr").default;

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Sirve el index.html

// Buscar 10 resultados usando youtube-sr (Evita bloqueos de IP en Render)
app.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Falta la búsqueda" });

  try {
    const videos = await YouTube.search(q, { limit: 10, type: "video" });
    
    const results = videos.map(video => ({
      id: video.id,
      title: video.title,
      channel: video.channel ? video.channel.name : "Canal de YouTube",
      duration: video.durationFormatted || "",
      thumbnail: video.thumbnail ? video.thumbnail.url : `https://youtube.com{video.id}/mqdefault.jpg`
    }));

    res.json(results);
  } catch (err) {
    console.error("Error en la búsqueda:", err);
    res.status(500).json({ error: "Error al buscar videos" });
  }
});

// Obtener URL temporal de audio directo para HTML5 con yt-dlp
app.get("/stream", (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Falta el id" });

  // Forzamos formato m4a (140) compatible con HTML5 nativo
  const cmd = `yt-dlp -f 140 -g "https://youtube.com{id}" --no-warnings --quiet`;

  exec(cmd, (err, stdout) => {
    if (err) {
      console.error("Error en streaming:", err);
      return res.status(500).json({ error: "Error al obtener el audio" });
    }
    res.json({ url: stdout.trim() });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});

