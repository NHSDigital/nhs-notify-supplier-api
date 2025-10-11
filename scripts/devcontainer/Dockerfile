# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Copy CA certs and Dynamically set NODE_EXTRA_CA_CERTS accordingly
RUN apt-get update && apt-get install -y ca-certificates
COPY custom-ca-certs/. /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Concatenate all certs for use in EnvVars
RUN find /usr/local/share/ca-certificates -type f \( -name '*.pem' -o -name '*.crt' \) -exec cat {} + > "/usr/local/share/ca-certificates/combined-cacerts.pem"

# Set environment variables at the Docker image level so they're available during feature installation
ENV NODE_EXTRA_CA_CERTS="/usr/local/share/ca-certificates/combined-cacerts.pem"
ENV SSL_CERT_FILE="/usr/local/share/ca-certificates/combined-cacerts.pem"
ENV REQUESTS_CA_BUNDLE="/usr/local/share/ca-certificates/combined-cacerts.pem"
ENV CURL_CA_BUNDLE="/usr/local/share/ca-certificates/combined-cacerts.pem"
ENV GIT_SSL_CAINFO="/usr/local/share/ca-certificates/combined-cacerts.pem"

# Ensure CA Certs is available for all shells, Node, Python & Ruby
USER vscode
RUN echo 'NODE_EXTRA_CA_CERTS="/usr/local/share/ca-certificates/combined-cacerts.pem"' >> ~/.zshrc
RUN echo 'SSL_CERT_FILE="/usr/local/share/ca-certificates/combined-cacerts.pem"' >> ~/.zshrc
RUN echo 'REQUESTS_CA_BUNDLE="/usr/local/share/ca-certificates/combined-cacerts.pem"' >> ~/.zshrc
RUN echo 'CURL_CA_BUNDLE="/usr/local/share/ca-certificates/combined-cacerts.pem"' >> ~/.zshrc
RUN echo 'GIT_SSL_CAINFO="/usr/local/share/ca-certificates/combined-cacerts.pem"' >> ~/.zshrc
