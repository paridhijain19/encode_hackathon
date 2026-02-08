FROM python:3.11-slim

WORKDIR /app

# Install Node.js for building frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy all project files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies and build frontend
RUN npm install && npm run build

# Expose port (will be overridden by $PORT on most platforms)
ENV PORT=8080
EXPOSE 8080

# Start backend server
# NOTE: For serving static frontend files, you'll need to modify server.py
# to serve files from the dist/ folder, or use a separate nginx container
CMD ["uvicorn", "agent.server:app", "--host", "0.0.0.0", "--port", "8080"]
