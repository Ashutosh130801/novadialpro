FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY novadial-pro/server/package*.json ./novadial-pro/server/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build --workspace=novadial-pro/server

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "run", "start", "--workspace=novadial-pro/server"]
