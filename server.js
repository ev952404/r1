const express = require("express");
const cors = require("cors");
const YouTube = require("youtube-sr").default;
const ytdl = require("@distube/ytdl-core");

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Sirve el index.html

// Buscar 10 resultados usando youtube-sr
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

// Obtener URL temporal de audio directo para HTML5 (100% Nativo sin procesos bloqueados)
app.get("/stream", async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Falta el id" });

  try {
    const videoUrl = `https://youtube.com{id}`;
    
    // Obtiene la información del video saltándose las restricciones de cifrado
    const info = await ytdl.getInfo(videoUrl);
    
    // Filtra exactamente el formato de audio M4A (itag 140) que tu reproductor HTML5 lee nativamente
    const format = ytdl.chooseFormat(info.formats, { quality: "140" });

    if (format && format.url) {
      res.json({ url: format.url });
    } else {
      // Si por alguna razón no encuentra el 140, busca el audio de mayor calidad disponible compatible
      const backupFormat = ytdl.filterFormats(info.formats, "audioonly")[0];
      if (backupFormat) {
        res.json({ url: backupFormat.url });
      } else {
        res.status(404).json({ error: "No se encontró un flujo de audio compatible" });
      }
    }
  } catch (err) {
    console.error("Error en streaming:", err);
    res.status(500).json({ error: "Error al obtener el audio" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
