# Stage 1: Build the app
FROM ts-docker.artifactrepo.kenvue.com/ts-docker/python-buildagent:3.13.9 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve static build
FROM ts-docker.artifactrepo.kenvue.com/ts-docker/python-buildagent:3.13.9
WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist .

# Copy entrypoint.sh into container
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

# Run entrypoint instead of CMD
ENTRYPOINT ["/entrypoint.sh"]
