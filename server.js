const express = require("express");
const cors = require("cors");
const YouTube = require("youtube-sr").default;
const ytdl = require("@distube/ytdl-core");

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Sirve el index.html

// Buscar 10 resultados usando youtube-sr (Evita bloqueos de búsqueda)
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

// Ruta de Streaming por Proxy (Canaliza el audio a través de Render para evitar el Error 403)
app.get("/stream", async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Falta el id" });

  try {
    const videoUrl = `https://youtube.com{id}`;
    
    // Configuramos las cabeceras HTTP para que el navegador sepa que es un archivo de audio M4A
    res.setHeader("Content-Type", "audio/mp4");
    res.setHeader("Transfer-Encoding", "chunked");

    // Descargamos el audio en vivo desde Render y lo inyectamos de inmediato a la respuesta web (res)
    ytdl(videoUrl, {
      quality: "140", // Formato M4A nativo de 128kbps para HTML5
      filter: "audioonly",
      highWaterMark: 1024 * 1024 * 2 // Buffer de 2MB para evitar pausas
    })
    .on("error", (err) => {
      console.error("Error en el stream de ytdl:", err);
      if (!res.headersSent) res.status(500).send("Error en la transmisión");
    })
    .pipe(res); // El método pipe envía el flujo de datos directamente al reproductor HTML5

  } catch (err) {
    console.error("Error en el endpoint de streaming:", err);
    if (!res.headersSent) res.status(500).json({ error: "Error al obtener el audio" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
