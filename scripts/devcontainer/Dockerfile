# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Copy CA certs and install Ruby and Go via Ubuntu packages (much faster than building from source)
# Also install development libraries needed for Python compilation via asdf
RUN apt-get update && apt-get install -y \
    ca-certificates \
    ruby-full \
    ruby-dev \
    build-essential \
    golang-go \
    libsqlite3-dev \
    libbz2-dev \
    libncurses-dev \
    libffi-dev \
    libreadline-dev \
    liblzma-dev \
    libssl-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*
COPY custom-ca-certs/. /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Use the updated system CA bundle which now includes both system and custom CAs
ENV NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"
ENV SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"
ENV REQUESTS_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"
ENV CURL_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"
ENV GIT_SSL_CAINFO="/etc/ssl/certs/ca-certificates.crt"

# Set Go environment variables and prepend asdf shims/bin to PATH
ENV GOPATH="/home/vscode/go"
ENV PATH="/home/vscode/.asdf/shims:/home/vscode/.asdf/bin:/go/bin:${GOPATH}/bin:${PATH}"

# Ensure CA Certs is available for all shells, Node, Python & Ruby
USER vscode

RUN echo 'NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'REQUESTS_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'CURL_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'GIT_SSL_CAINFO="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
