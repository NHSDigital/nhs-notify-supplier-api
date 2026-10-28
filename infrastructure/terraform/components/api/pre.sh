# # This script is run before the Terraform apply command.
# # It ensures all Node.js dependencies are installed, generates any required dependencies,
# # and builds all Lambda functions in the workspace before Terraform provisions infrastructure.

echo "Running Pre.sh"

ROOT_DIR="$(git rev-parse --show-toplevel)"

echo "Running set-github-token.sh"

$ROOT_DIR/scripts/set-github-token.sh

echo "Completed."

pnpm install --frozen-lockfile

pnpm run generate-dependencies

pnpm run lambda-build
