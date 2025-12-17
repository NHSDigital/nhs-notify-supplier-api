import requests
import pytest
from lib.constants import METHODS, VALID_ENDPOINTS
from lib.fixtures import *

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINTS)
def test_401_invalid(url, method, endpoints):

    resp = getattr(requests, method)(f"{url}{endpoints}", headers={
        "Authorization": "invalid",
    })

    assert(resp.status_code == 401)

@pytest.mark.test
@pytest.mark.nhsd_apim_authorization({"access": "application", "level": "level0"})
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINTS)
def test_401_invalid_level(nhsd_apim_proxy_url, nhsd_apim_auth_headers, method, endpoints):
    print(nhsd_apim_proxy_url)

    resp = getattr(requests, method)(f"{nhsd_apim_proxy_url}{endpoints}", headers={
        **nhsd_apim_auth_headers
    })

    print("Status:", resp.status_code)

    assert(resp.status_code == 401)
