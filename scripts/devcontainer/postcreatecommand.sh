#!/bin/zsh

echo 'export GPG_TTY=$TTY' | cat - ~/.zshrc > temp && mv temp ~/.zshrc

echo 'export PATH="$HOME/go/bin:/usr/local/go/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="$HOME/.asdf/shims:$PATH"' >> ~/.zshrc
echo 'eval "$(asdf completion zsh)"' >> ~/.zshrc
echo 'export SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
echo 'export REQUESTS_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
echo 'export CURL_CA_BUNDLE="/etc/ssl/certs/ca-certificates.crt"' >> ~/.zshrc
source ~/.zshrc

# Create pip config for SSL certificates before make config runs
mkdir -p ~/.config/pip
cat > ~/.config/pip/pip.conf << EOF
[global]
cert = /etc/ssl/certs/ca-certificates.crt
EOF

make config

gem install jekyll bundler
jekyll --version && cd docs && bundle install

echo 'jekyll setup complete'
