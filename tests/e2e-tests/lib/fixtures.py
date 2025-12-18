import pytest
import os
import re


# for now this is the same as PROXY_NAME
# this is here to illustrate how these can be decoupled
@pytest.fixture(scope='session')
def api_product_name():
    print("PROXY_NAME =", os.environ.get("PROXY_NAME"))
    api_proxy = os.environ.get("API_PROXY")
    proxy_name = os.environ.get("PROXY_NAME")

    if api_proxy:
        return api_proxy

    if proxy_name:
        return proxy_name

    raise RuntimeError(
        "Neither API_PROXY nor PROXY_NAME is set in the environment.\n"
        "You must set at least one of them.\n"
        "Example:\n"
        "export API_PROXY=nhs-notify-supplier--internal-dev--nhs-notify-supplier")

@pytest.fixture(scope='session')
def url(api_product_name):
    # Extract the last part after "--"
    # Examples:
    # nhs-notify-supplier--internal-dev--nhs-notify-supplier → nhs-notify-supplier
    # nhs-notify-supplier--internal-dev--nhs-notify-supplier-PR-277 → nhs-notify-supplier-PR-277
    suffix = api_product_name.split("--")[-1]

    environment = os.environ["API_ENVIRONMENT"]
    # Production uses the standard live URL pattern
    if environment == "prod":
        return f"https://api.service.nhs.uk/{suffix}"

    # REF / REF2 share internal-dev gateway
    elif environment in ["ref", "ref2"]:
        return f"https://internal-dev.api.service.nhs.uk/{suffix}"

    # Everything else (dev, test, pr environments, internal-dev)
    else:
        return f"https://{environment}.api.service.nhs.uk/{suffix}"
