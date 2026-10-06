# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app
# Configuration Angular à builder : "production" (défaut) ou "dev" (--build-arg NG_CONFIG=dev)
ARG NG_CONFIG=production
COPY . .
RUN npm install -g @angular/cli
RUN npm install --legacy-peer-deps
RUN ng build --configuration=$NG_CONFIG

# Run stage
FROM node:20-bullseye-slim
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/package-lock.json /app/package-lock.json

# Expose port 4000 (default SSR port)
EXPOSE 4000

# Start the SSR server
CMD ["node", "dist/tombola/server/server.mjs"]
