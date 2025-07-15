FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENV DB_PATH=/app/data/visionvault.db
VOLUME ["/app/public/images", "/app/data"]
CMD sh -c "ln -sf /app/config/nsfw.txt /app/nsfw.txt && npm start"

