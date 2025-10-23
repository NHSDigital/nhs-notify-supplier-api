#!/bin/zsh

echo 'export GPG_TTY=$TTY' | cat - ~/.zshrc > temp && mv temp ~/.zshrc

echo 'eval "$(asdf completion zsh)"' >> ~/.zshrc
source ~/.zshrc

make _install-dependencies # required before config to ensure python is available due to race between config:: make targets
make config

sudo gem install jekyll bundler
jekyll --version && cd docs && bundle install

echo 'jekyll setup complete'
