
FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python and required system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    libgomp1 \
    python3-venv \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:${PATH}"
ENV PYTHON_EXECUTABLE="/opt/venv/bin/python"

# Install Node.js dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Install Python dependencies
COPY rag/requirements.txt ./rag/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r rag/requirements.txt

# Copy application source code
COPY backend ./backend
COPY rag ./rag

EXPOSE 10000

CMD ["node", "backend/server.js"]
