
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
def test_app_level0_access(nhsd_apim_proxy_url, nhsd_apim_auth_headers, _create_test_app, client: ApigeeClient ):
    headers = {
        **nhsd_apim_auth_headers,
        "headerauth1": "headervalue1",
        "x-request-id": "123456"
    }

    app_api = DeveloperAppsAPI(client=client)
    app_name = _create_test_app["name"]

    attributes = app_api.get_app_attributes(
            email="apm-testing-internal-dev@nhs.net", app_name=app_name
        )

    attributes['attribute'].append({'name': 'NHSD-Supplier-ID' , 'value': 'supplier1'})

    app_api.post_app_attributes(
        email="apm-testing-internal-dev@nhs.net",
        app_name=app_name,
        body=attributes
    )

    resp = requests.get(
        nhsd_apim_proxy_url + "/letters?limit=10", headers=headers
    )
    assert resp.status_code == 200

@pytest.mark.nhsd_apim_authorization(access="application", level="level3")
def test_app_level0_access_post(nhsd_apim_proxy_url, nhsd_apim_auth_headers, _create_test_app, client: ApigeeClient ):
    headers = {
        **nhsd_apim_auth_headers,
        "headerauth1": "headervalue1",
        "x-request-id": "123456"
    }

    data = Generators.generate_valid_create_message_body("sandbox")
    print(data);

    resp = requests.post(
        f"{nhsd_apim_proxy_url + "/letters/:id"}", headers=headers,
        json = data
    )
    assert resp.status_code == 200
