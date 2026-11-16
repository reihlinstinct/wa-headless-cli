FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY src ./src
COPY test ./test
VOLUME ["/app/auth", "/app/run"]
RUN mkdir -p /app/auth /app/run && chmod 700 /app/auth
ENTRYPOINT ["node", "src/cli.js"]
CMD ["listen"]
