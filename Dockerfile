# Use an official, lightweight Python image as the foundation
FROM python:3.12-slim

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install the Python dependencies without storing unnecessary cache files
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code (like main.py) into the container
COPY . .

# Expose port 8000 so the host machine can route traffic to it
EXPOSE 8000

# The command that executes when the container starts, binding to 0.0.0.0 to accept external connections
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
