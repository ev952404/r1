const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Sirve el index.html

// Buscar 10 resultados
app.get("/search", (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Falta la búsqueda" });

    const cmd = `yt-dlp "ytsearch10:${q}" --print "%(id)s|||%(title)s|||%(channel)s|||%(duration_string)s|||%(thumbnail)s" --no-warnings --quiet --impersonate chrome`;


  exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al buscar" });
    }

    // Dividimos por saltos de línea de forma segura usando expresión regular
    const results = stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => {
        const [id, title, channel, duration, thumbnail] = line.split("|||");
        return { id, title, channel, duration, thumbnail };
      });

    res.json(results);
  });
});

// Obtener URL temporal de audio directo para HTML5
app.get("/stream", (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Falta el id" });

  const cmd = `yt-dlp -f 140 -g "https://youtube.com{id}" --no-warnings --quiet`;

  exec(cmd, (err, stdout) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener el audio" });
    }
    res.json({ url: stdout.trim() });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});

