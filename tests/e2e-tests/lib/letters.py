import os
import subprocess
import pathlib
import time
import json
import requests
from lib.errorhandler import ErrorHandler


_REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
_CLI_WORKSPACE = "nhs-notify-supplier-api-letter-test-data-utility"
_SUPPLIER_ID = "supplier1" # This should be the same id registered in the Apigee App to which the proxy will be associated


def create_test_data(count: int = 10) -> list[str]:
    """Seed PENDING letters by delegating to the shared letter-test-data CLI.

    Mirrors createTestData() in tests/helpers/generate-fetch-test-data.ts
    so both test suites seed data through the same tool.

    Returns a list of letter IDs created by the CLI.
    """
    environment = os.environ.get("TARGET_ENVIRONMENT", "main")
    aws_account_id = os.environ.get("AWS_ACCOUNT_ID", "820178564574")

    cmd = [
        "npm",
        "-w",
        _CLI_WORKSPACE,
        "run",
        "cli",
        "--",
        "create-letter-batch",
        "--supplier-id", _SUPPLIER_ID,
        "--environment", environment,
        "--awsAccountId", aws_account_id,
        "--group-id", "TestGroupID",
        "--specification-id", "TestSpecificationID",
        "--status", "PENDING",
        "--count", str(count),
        "--test-letter", "test-letter-standard",
    ]

    print(f"Creating test data by running CLI command: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=_REPO_ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"create-letter-batch CLI failed (exit code {result.returncode}).\n"
            f"stdout:\n{result.stdout}\n"
            f"stderr:\n{result.stderr}"
        )

    ids_prefix = "LETTER_IDS:"
    for line in result.stdout.splitlines():
        if line.startswith(ids_prefix):
            payload = line[len(ids_prefix):]
            data = json.loads(payload)
            if isinstance(data, list):
                res = [str(item) for item in data]
                print(f"The following letter IDs were created: {res}")
                return res

    raise RuntimeError(
        "create-letter-batch CLI completed successfully but did not output LETTER_IDS.\n"
        f"stdout:\n{result.stdout}\n"
        f"stderr:\n{result.stderr}"
    )


def get_pending_letter_ids(
    url: str,
    headers: dict,
    letters_endpoint: str,
    limit: int = 1,
    timeout_s: int = 20,
    interval_s: int = 2,
    retries: int = 5,
) -> list:
    """Injects the given number of pending letters as test data, then waits for them to become
    visible via the letters endpoint. Retries to account for other tests running in parallel stealing the letters

    Returns a list of letter ID strings.
    Raises TimeoutError if the expected number of pending letters do not appear within the timeout period.
    """

    for _ in range(retries):
        letterIds = create_test_data(limit)
        deadline = time.monotonic() + timeout_s
        data = []
        while time.monotonic() < deadline:
            # Retrieves letters based on the supplier registered in the Apigee App
            response = requests.get(
                f"{url}{letters_endpoint}", headers=headers
            )
            ErrorHandler.handle_retry(response)
            response.raise_for_status()
            data.extend(response.json().get("data", []))
            idsFound = [ item.get("id") for item in data ]
            if set(letterIds).issubset(idsFound):
                print(f"Found all created letter IDs: {letterIds}")
                return letterIds
            print(f"Expected letter IDs {letterIds} not found in response. Retrying in {interval_s} seconds...")
            time.sleep(interval_s)

    raise TimeoutError(
        f"Timed out after {retries} retries waiting for {limit} PENDING letter(s) at "
        f"{url}{letters_endpoint}"
    )
