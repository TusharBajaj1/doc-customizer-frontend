FROM node:22-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-calc libreoffice-impress \
      fonts-liberation fonts-dejavu-core \
      fonts-crosextra-carlito fonts-crosextra-caladea \
      fonts-noto-core \
 && rm -rf /var/lib/apt/lists/*
# PDF -> Word: pdf2docx in its own virtualenv (libgl1/libglib2.0-0 are needed by its OpenCV dependency).
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/* \
 && python3 -m venv /opt/pdf2docx \
 && /opt/pdf2docx/bin/pip install --no-cache-dir pdf2docx
RUN useradd --create-home app
WORKDIR /app
COPY server.mjs pdf_to_docx.py ./
USER app
ENV NODE_ENV=production PORT=8080 PDF2DOCX_PYTHON=/opt/pdf2docx/bin/python \
    CONVERT_EXTENSIONS=".doc,.docx,.odt,.rtf,.txt" \
    ALLOWED_ORIGINS="https://pdfrookie.org,https://www.pdfrookie.org,https://localapp.pdfrookie.org"
EXPOSE 8080
CMD ["node", "server.mjs"]
