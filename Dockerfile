FROM node:20

# FFmpeg és Python telepítése (a yt-dlp-hez kell)
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 10000
CMD ["node", "index.js"]
