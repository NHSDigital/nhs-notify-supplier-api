
import pytest
import requests
from lib import generators as Generators

from pytest_nhsd_apim.apigee_apis import (
    DeveloperAppsAPI,
    ApigeeClient,
    ApigeeNonProdCredentials,
)

@pytest.fixture()
def client():
    config = ApigeeNonProdCredentials()
    return ApigeeClient(config=config)

@pytest.mark.nhsd_apim_authorization(access="application", level="level3")
def test_app_level0_access_post(nhsd_apim_proxy_url, nhsd_apim_auth_headers, _create_test_app, client: ApigeeClient ):
    headers = {
        **nhsd_apim_auth_headers,
        "x-request-id": "123456"
    }

    data = Generators.generate_valid_create_message_body("sandbox")
    print(data);

    resp = requests.post(
        f"{nhsd_apim_proxy_url + "/letters/:id"}", headers=headers,
        json = data
    )
    assert resp.status_code == 200
