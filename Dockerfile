FROM node:20-slim

# Instalamos únicamente Python3 (requisito exclusivo de yt-dlp) y curl
RUN apt-get update && apt-get install -y \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Descargamos yt-dlp directamente
RUN curl -L https://github.com -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
