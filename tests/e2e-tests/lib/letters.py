import os
import subprocess
import pathlib
import time
import json
import requests
from lib.constants import SUPPLIER, resolve_aws_account_id
from lib.errorhandler import ErrorHandler, describe_response


_REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
_CLI_WORKSPACE = "nhs-notify-supplier-api-letter-test-data-utility"

def create_test_data(count: int = 10) -> list[str]:
    """Seed PENDING letters by delegating to the shared letter-test-data CLI.

    Mirrors createTestData() in tests/helpers/generate-fetch-test-data.ts
    so both test suites seed data through the same tool.

    Returns a list of letter IDs created by the CLI.
    """
    environment = os.environ.get("TARGET_ENVIRONMENT", "main")
    aws_account_id = resolve_aws_account_id()

    cmd = [
        "pnpm",
        "--filter",
        _CLI_WORKSPACE,
        "run",
        "cli",
        "create-letter-batch",
        "--supplier-id", SUPPLIER,
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
    timeout_s: int = 60,
    interval_s: int = 2,
) -> list:
    """Seeds the given number of PENDING letters, then waits until each one is readable via
    GET /letters/{id} for the supplier registered in the Apigee App.

    GET /letters/{id} is used rather than GET /letters because the list endpoint only returns
    up to `limit` letters from the supplier's whole queue backlog and hides every letter it returns
    for the visibility timeout. Under a large backlog or with parallel tests it may never return the
    newly seeded letters.

    Returns a list of letter ID strings.

    Raises TimeoutError if the seeded letters are not readable as PENDING within the timeout period.
    """
    letter_ids = create_test_data(limit)
    pending_ids = set(letter_ids)
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        for letter_id in sorted(pending_ids):
            response = requests.get(f"{url}{letters_endpoint}/{letter_id}", headers=headers)
            ErrorHandler.handle_retry(response)
            if response.status_code == 200:
                status = response.json().get("data", {}).get("attributes", {}).get("status")
                if status == "PENDING":
                    pending_ids.discard(letter_id)
            elif response.status_code != 404:
                raise AssertionError(
                    f"Unexpected response while waiting for seeded letter:\n{describe_response(response)}"
                )
        if not pending_ids:
            print(f"All seeded letter IDs are PENDING: {letter_ids}")
            return letter_ids
        print(f"Seeded letter IDs {sorted(pending_ids)} not PENDING yet. Retrying in {interval_s} seconds...")
        time.sleep(interval_s)

    raise TimeoutError(
        f"Timed out after {timeout_s}s waiting for seeded letter(s) {sorted(pending_ids)} to be PENDING at "
        f"{url}{letters_endpoint}/{{id}}"
    )
