# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Copy CA certs and Dynamically set NODE_EXTRA_CA_CERTS accordingly
RUN apt-get update && apt-get install -y ca-certificates
COPY custom-ca-certs/. /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Use the updated system CA bundle which now includes both system and custom CAs
ENV NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"
ENV SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"
ENV REQUESTS_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"
ENV CURL_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"
ENV GIT_SSL_CAINFO="/etc/ssl/certs/ca-certificates.crt"

# Ensure CA Certs is available for all shells, Node, Python & Ruby
USER vscode
RUN echo 'NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'REQUESTS_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'CURL_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
RUN echo 'GIT_SSL_CAINFO="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
