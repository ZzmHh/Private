FROM node:22-bookworm

WORKDIR /app

ENV NODE_ENV=production
ENV PYTHON_COMMAND=/opt/venv/bin/python
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package*.json ./
RUN npm ci

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt \
  && /opt/venv/bin/python -m playwright install --with-deps chromium

COPY . .
RUN npm run build

EXPOSE 8787

CMD ["npm", "start"]
