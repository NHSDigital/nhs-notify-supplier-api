import pytest
import requests
from os import getenv

def _get(url, headers=None, timeout=10):
    return requests.get(url, headers=headers or {}, timeout=timeout)

@pytest.mark.smoketest
def test_ping(nhsd_apim_proxy_url):
    resp = requests.get(nhsd_apim_proxy_url + "/_ping")
    assert resp.status_code == 200

@pytest.mark.smoketest
@pytest.mark.sandboxtest
@pytest.mark.devtest
def test_status(nhsd_apim_proxy_url, status_endpoint_auth_headers):
    resp = requests.get(
        f"{nhsd_apim_proxy_url}/_status", headers=status_endpoint_auth_headers
    )

    assert resp.status_code == 200

@pytest.mark.smoketest
@pytest.mark.sandboxtest
@pytest.mark.devtest
def test_401_status_without_api_key(nhsd_apim_proxy_url):
    resp = requests.get(
        f"{nhsd_apim_proxy_url}/_status"
    )
    assert resp.status_code == 401


# @pytest.mark.smoketest
# @pytest.mark.nhsd_apim_authorization(access="application", level="level3")
# def test_invalid_jwt_rejected(nhsd_apim_proxy_url, nhsd_apim_auth_headers):
#    """
#    Best-effort: if gateway validates JWTs, an invalid token should be rejected.
#    If JWT not used in this env, test is skipped.
#    """
#    headers = {
#        **nhsd_apim_auth_headers,
#        "x-request-id": "123456"
#    }
