import pytest
import requests
from lib.errorhandler import ErrorHandler
from lib.fixtures import *  # NOSONAR

@pytest.mark.smoketest
def test_ping(url):
    resp = requests.get(url + "/_ping")
    assert resp.status_code == 200

@pytest.mark.smoketest
@pytest.mark.sandboxtest
@pytest.mark.devtest
def test_status(url, status_endpoint_api_key):
    resp = requests.get(
        f"{url}/_status", headers={"apikey": status_endpoint_api_key}
    )

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
