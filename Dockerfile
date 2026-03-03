FROM node:22

# Alapvető csomagok telepítése
RUN apt-get update && apt-get install -y ffmpeg

# Munka könyvtár
WORKDIR /usr/src/app

# A fájlok másolása
COPY . .

# Függőségek telepítése
RUN npm install

# Az alkalmazás elindítása
CMD ["npm", "start"]
