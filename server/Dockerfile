FROM node:22-alpine AS build
WORKDIR /app
# Build tools are a fallback in case bcrypt's prebuilt binary can't be used
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
