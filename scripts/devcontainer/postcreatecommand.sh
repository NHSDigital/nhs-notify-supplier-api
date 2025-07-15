#!/bin/bash

pipx install pre-commit

rm -Rf ~/.asdf
git clone https://github.com/asdf-vm/asdf.git ~/.asdf;
chmod +x ~/.asdf/asdf.sh;
echo '. $HOME/.asdf/asdf.sh' >> ~/.zshrc
echo '. $HOME/.asdf/completions/asdf.bash' >> ~/.zshrc

echo 'export GPG_TTY=$TTY' | cat - ~/.zshrc > temp && mv temp ~/.zshrc

source ~/.zshrc

echo 'asdf setup complete'

make config

jekyll --version && cd docs && bundle install

echo 'jekyll setup complete'
