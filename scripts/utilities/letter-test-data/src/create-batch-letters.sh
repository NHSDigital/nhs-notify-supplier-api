#!/bin/bash

# Bash wrapper script for creating multiple letter batches
# This script creates 3 batches with different specification-id and group-id values

set -e

# Function to display usage
usage() {
    echo "Usage: $0 --supplier-id <supplier-id> --environment <environment> --awsAccountId <aws-account-id> [--count <count>] [--status <status>]"
    echo ""
    echo "Required parameters:"
    echo "  --supplier-id     Supplier ID for the letters"
    echo "  --environment     Environment (e.g., pr147, main, dev)"
    echo "  --awsAccountId    AWS Account ID for S3 bucket resolution"
    echo ""
    echo "Optional parameters:"
    echo "  --count           Number of letters per batch (default: 835)"
    echo "  --missing-count   Number of letters with missing PDFs (default: 5)"
    echo "  --status          Letter status (default: PENDING)"
    echo "  --ttl-hours       TTL in hours (default: 13140)"
    echo ""
    echo "Example:"
    echo "  $0 --supplier-id supplier-123 --environment pr147 --awsAccountId 820178564574"
    echo "  $0 --supplier-id supplier-123 --environment main --awsAccountId 820178564574 --count 25 --status ACCEPTED"
    echo "  $0 --supplier-id supplier-123 --environment main --awsAccountId 820178564574 --count 25 --status ACCEPTED --missing-count 3"
    exit 1
}

# Default values
COUNT=835 #3 batches = 2505 letters
MISSING_COUNT=5 # Number of letters with missing PDFs
STATUS="PENDING"
TTL_HOURS=13140 # Approximately 18 months

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --supplier-id)
            SUPPLIER_ID="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --awsAccountId)
            AWS_ACCOUNT_ID="$2"
            shift 2
            ;;
        --count)
            COUNT="$2"
            shift 2
            ;;
        --missing-count)
            MISSING_COUNT="$2"
            shift 2
            ;;
        --status)
            STATUS="$2"
            shift 2
            ;;
        --ttl-hours)
            TTL_HOURS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown parameter: $1"
            usage
            ;;
    esac
done

# Validate required parameters
if [[ -z "$SUPPLIER_ID" || -z "$ENVIRONMENT" || -z "$AWS_ACCOUNT_ID" ]]; then
    echo "Error: Missing required parameters"
    echo ""
    usage
fi

# Validate status
VALID_STATUSES=("PENDING" "ACCEPTED" "REJECTED" "PRINTED" "ENCLOSED" "CANCELLED" "DISPATCHED" "FAILED" "RETURNED" "FORWARDED" "DELIVERED")
if [[ ! " ${VALID_STATUSES[@]} " =~ " ${STATUS} " ]]; then
    echo "Error: Invalid status '$STATUS'. Valid statuses: ${VALID_STATUSES[*]}"
    exit 1
fi

# Validate count is a positive number
if ! [[ "$COUNT" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: Count must be a positive integer"
    exit 1
fi

# Validate missing count is a positive number
if ! [[ "$MISSING_COUNT" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: Missing count must be a positive integer"
    exit 1
fi

echo "Creating letter batches with the following configuration:"
echo "  Supplier ID: $SUPPLIER_ID"
echo "  Environment: $ENVIRONMENT"
echo "  AWS Account ID: $AWS_ACCOUNT_ID"
echo "  Count per batch: $COUNT"
echo "  Letters missing PDFs count: $MISSING_COUNT"
echo "  Status: $STATUS"
echo "  TTL Hours: $TTL_HOURS"
echo ""

# Get the directory of this script to run npm from the correct location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the project directory
cd "$PROJECT_DIR"

# Define the three batches with different specification and group IDs
BATCHES=(
    "integration-specification-english:group-english:test-letter-standard:${COUNT}"
    "integration-specification-braille:group-accessible:test-letter-standard:${COUNT}"
    "integration-specification-arabic:group-international:test-letter-large:${COUNT}"
    "integration-specification-missing-pdf:group-error:none:${MISSING_COUNT}"
)

# Counter for tracking batch creation
BATCH_COUNTER=1
TOTAL_BATCHES=${#BATCHES[@]}
TOTAL_LETTERS=$((COUNT * TOTAL_BATCHES))

echo "Creating $TOTAL_BATCHES batches with $COUNT letters each ($TOTAL_LETTERS total letters)..."
echo ""

# Create each batch
for batch in "${BATCHES[@]}"; do
    # Parse specification-id and group-id from the batch definition
    IFS=':' read -r SPEC_ID GROUP_ID TEST_LETTER BATCH_COUNT <<< "$batch"

    echo "[$BATCH_COUNTER/$TOTAL_BATCHES] Creating batch with specification-id: $SPEC_ID, group-id: $GROUP_ID-$SUPPLIER_ID"

    # Run the npm command
    npm run cli -- create-letter-batch \
        --supplier-id "$SUPPLIER_ID" \
        --environment "$ENVIRONMENT" \
        --awsAccountId "$AWS_ACCOUNT_ID" \
        --specification-id "$SPEC_ID" \
        --group-id "$GROUP_ID-$SUPPLIER_ID" \
        --status "$STATUS" \
        --count "$BATCH_COUNT" \
        --ttl-hours "$TTL_HOURS" \
        --test-letter "$TEST_LETTER"

    if [[ $? -eq 0 ]]; then
        echo "✓ Batch $BATCH_COUNTER completed successfully"
    else
        echo "✗ Batch $BATCH_COUNTER failed"
        exit 1
    fi

    echo ""
    ((BATCH_COUNTER++))
done

echo "🎉 All batches created successfully!"
echo "Total letters created: $TOTAL_LETTERS"
echo "Supplier ID: $SUPPLIER_ID"
echo "Environment: $ENVIRONMENT"
