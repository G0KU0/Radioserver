# Alap Node.js kép használata
FROM node:22

# FFmpeg telepítése
RUN apt-get update && apt-get install -y ffmpeg

# Munka könyvtár létrehozása
WORKDIR /usr/src/app

# A projekt fájlok másolása a konténerbe
COPY . .

# Függőségek telepítése
RUN npm install

# A konténer indítása
CMD ["npm", "start"]
