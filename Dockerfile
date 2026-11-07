
FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    libgomp1 \
    python3-venv \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:${PATH}"
ENV PYTHON_EXECUTABLE="/opt/venv/bin/python"

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY rag/requirements.txt ./rag/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r rag/requirements.txt

ENV HF_HOME=/opt/huggingface

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')"

COPY backend ./backend
COPY rag ./rag

EXPOSE 10000

CMD ["node", "backend/server.js"]
