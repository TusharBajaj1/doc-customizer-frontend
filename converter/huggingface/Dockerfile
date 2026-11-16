FROM node:22-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-calc libreoffice-impress \
      fonts-liberation fonts-dejavu-core \
      fonts-crosextra-carlito fonts-crosextra-caladea \
      fonts-noto-core \
 && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home app
WORKDIR /app
COPY server.mjs .
USER app
ENV NODE_ENV=production PORT=8080 \
    CONVERT_EXTENSIONS=".doc,.docx,.odt,.rtf,.txt" \
    ALLOWED_ORIGINS="https://pdfrookie.org,https://www.pdfrookie.org,https://localapp.pdfrookie.org"
EXPOSE 8080
CMD ["node", "server.mjs"]
