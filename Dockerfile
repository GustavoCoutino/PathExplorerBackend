# 1) Stage común: instala deps nativas y tus paquetes
FROM node:18-alpine AS base

# deps para canvas, si las usas
RUN apk add --no-cache \
    python3 make g++ \
    cairo-dev jpeg-dev pango-dev giflib-dev pkgconfig

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 2) Stage de desarrollo: reutiliza base y arranca el dev server
FROM base AS dev
EXPOSE 4000
CMD ["npm", "run", "dev"]

# 3) Stage de producción (opcional)
FROM base AS build
RUN npm run build

FROM node:18-alpine AS prod
WORKDIR /app
COPY --from=build /app ./
EXPOSE 4000
CMD ["npm", "start"]    # o tu script de producción
