import requests
import pytest
from lib.constants import METHODS, VALID_ENDPOINT_LETTERS
from lib.fixtures import *
from lib.errorhandler import ErrorHandler

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINT_LETTERS)
def test_401_invalid(url, method, endpoints):
    resp = getattr(requests, method)(f"{url}{endpoints}", headers={
        "Authorization": "invalid",
    })

    ErrorHandler.handle_retry(resp)
    assert resp.status_code == 401, f"Response: {resp.status_code}: {resp.text}"

@pytest.mark.test
@pytest.mark.nhsd_apim_authorization({"access": "application", "level": "level0"})
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINT_LETTERS)
def test_401_invalid_level(nhsd_apim_proxy_url, nhsd_apim_auth_headers, method, endpoints):
    print(nhsd_apim_proxy_url)

    resp = getattr(requests, method)(f"{nhsd_apim_proxy_url}{endpoints}", headers={
        **nhsd_apim_auth_headers
    })

    ErrorHandler.handle_retry(resp)
    assert resp.status_code == 401, f"Response: {resp.status_code}: {resp.text}"
