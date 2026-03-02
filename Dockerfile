FROM node:20

# FFmpeg telepítése (nélküle nincs hang)
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

# Függőségek telepítése
COPY package*.json ./
RUN npm install

# Teljes kód másolása
COPY . .

# Port megnyitása
EXPOSE 10000

# Indítás
CMD ["node", "index.js"]
