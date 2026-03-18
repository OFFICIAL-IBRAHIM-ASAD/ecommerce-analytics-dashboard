# STAGE 1: Build the React application
# Use a lightweight Node.js image to compile the code
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy the package.json files and install Node dependencies
COPY package*.json ./
# Tell Docker to ignore the strict Vite version conflict
RUN npm install --legacy-peer-deps

# Copy the actual React source code and build the production-ready static files
COPY . .
RUN npm run build

# STAGE 2: Serve with Nginx
# Use a lightweight Nginx web server image
FROM nginx:alpine

# Copy the compiled static files from the 'build' stage into Nginx's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for standard web traffic
EXPOSE 80

# Start Nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]