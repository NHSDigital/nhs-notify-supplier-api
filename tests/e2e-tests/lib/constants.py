import os

VALID_ENDPOINT_LETTERS= ["/letters"]
METHODS = ["get", "post"]
DEFAULT_CONTENT_TYPE = "application/vnd.api+json"
LETTERS_ENDPOINT = "/letters"
MI_ENDPOINT = "/mi"
SUPPLIER = "supplier1"
SECONDARY_SUPPLIER = "TestSupplier1"

DEFAULT_TARGET_ACCOUNT_GROUP = "nhs-notify-supplier-api-dev"
PROD_TARGET_ACCOUNT_GROUP = "nhs-notify-supplier-api-prod"
ACCOUNT_GROUP_TO_AWS_ACCOUNT_ID = {
    "nhs-notify-supplier-api-dev": "820178564574",
    "nhs-notify-supplier-api-nonprod": "885964308133",
}


def resolve_aws_account_id() -> str:
    target_account_group = os.environ.get(
        "TARGET_ACCOUNT_GROUP",
        DEFAULT_TARGET_ACCOUNT_GROUP,
    )
    if target_account_group == PROD_TARGET_ACCOUNT_GROUP:
        raise RuntimeError(
            f"TARGET_ACCOUNT_GROUP='{target_account_group}' points to production. "
            "Test execution against production is blocked."
        )

    mapped_account_id = ACCOUNT_GROUP_TO_AWS_ACCOUNT_ID.get(target_account_group)
    if mapped_account_id:
        return mapped_account_id

    raise RuntimeError(
        "No AWS account mapping configured for "
        f"TARGET_ACCOUNT_GROUP='{target_account_group}'. "
        "Add a mapping in tests/e2e-tests/lib/constants.py."
    )
