FROM node:20-bookworm-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Use the correct start command
CMD ["npm", "run", "start:dev"]
