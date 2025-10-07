# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the app source
COPY . .

# Expose the port your app uses
EXPOSE 3131

# Start the app
CMD ["node", "server.js"]
