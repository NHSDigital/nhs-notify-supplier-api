# # This script is run before the Terraform apply command.
# # It ensures all Node.js dependencies are installed, generates any required dependencies,
# # and builds all Lambda functions in the workspace before Terraform provisions infrastructure.

echo "Running Pre.sh"

ROOT_DIR="$(git rev-parse --show-toplevel)"

echo "Running set-github-token.sh"

$ROOT_DIR/scripts/set-github-token.sh

echo "Completed."

npm ci

npm run generate-dependencies --workspaces --if-present

npm run lambda-build --workspaces --if-present
