# The image tag must match the @playwright/test version in package.json.
# A mismatch means the preinstalled browsers do not match the client and
# Playwright fails at launch with an "Executable doesn't exist" error.
FROM mcr.microsoft.com/playwright:v1.62.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
