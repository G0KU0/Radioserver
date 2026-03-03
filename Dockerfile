FROM node:20

# FFmpeg, Python, yt-dlp és a Deno telepítése a titkosítás feltöréséhez
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip curl unzip
RUN pip3 install --break-system-packages yt-dlp
RUN curl -fsSL https://deno.land/install.sh | sh

# Deno hozzáadása az útvonalhoz
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 10000
CMD ["node", "index.js"]
