FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY registry ./registry
COPY docs ./docs
COPY README.md AGENTS.md tsconfig.base.json ./

RUN npm ci --include=dev \
    && npm run build \
    && npm cache clean --force \
    && mkdir -p /app/.data/public-submissions \
    && chown -R node:node /app/.data

ENV NODE_ENV=production \
    PORT=3000 \
    PUBLIC_INTAKE_ENABLED=true \
    PUBLIC_INTAKE_DATA_DIR=/app/.data/public-submissions \
    PUBLIC_INTAKE_TRUST_PROXY=false

EXPOSE 3000

USER node

CMD ["npm", "run", "start:web"]
