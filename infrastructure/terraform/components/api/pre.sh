# # This script is run before the Terraform apply command.
# # It ensures all Node.js dependencies are installed, generates any required dependencies,
# # and builds all Lambda functions in the workspace before Terraform provisions infrastructure.

echo "Running pre.sh"

npm config --location user set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN

npm ci

npm run generate-dependencies --workspaces --if-present

npm run lambda-build --workspaces --if-present
