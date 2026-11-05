FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY cli.js lib-helpers.js ./
COPY test ./test
VOLUME ["/app/auth", "/app/run"]
RUN mkdir -p /app/auth /app/run && chmod 700 /app/auth
ENTRYPOINT ["node", "cli.js"]
CMD ["listen"]
