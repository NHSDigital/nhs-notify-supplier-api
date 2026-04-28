import pytest
import requests
from lib.errorhandler import ErrorHandler
from lib.fixtures import *  # NOSONAR
from lib.generators import Generators

@pytest.mark.smoketest
def test_ping(url):
    resp = requests.get(url + "/_ping")
    assert resp.status_code == 200

@pytest.mark.smoketest
@pytest.mark.sandboxtest
@pytest.mark.devtest
def test_status(url, status_authentication_secret):
    headers = Generators.generate_valid_headers(status_authentication_secret)
    resp = requests.get(f"{url}/_status", headers=headers)

    ErrorHandler.handle_retry(resp)
    assert resp.status_code == 200

@pytest.mark.smoketest
@pytest.mark.sandboxtest
@pytest.mark.devtest
def test_401_status_without_api_key(url):
    resp = requests.get(
        f"{url}/_status"
    )

    ErrorHandler.handle_retry(resp)

    assert resp.status_code == 401
