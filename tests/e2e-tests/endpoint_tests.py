
import pytest
import requests

def _get(url, headers=None, timeout=10):
    return requests.get(url, headers=headers or {}, timeout=timeout)

@pytest.mark.smoketest
def test_ping(nhsd_apim_proxy_url):
    resp = requests.get(nhsd_apim_proxy_url + "/_ping")
    assert resp.status_code == 200
    print("Ping Response Body:", resp.text)

@pytest.mark.smoketest
def test_401_status_without_api_key(nhsd_apim_proxy_url):
    resp = requests.get(
        f"{nhsd_apim_proxy_url}/_status"
    )
    assert resp.status_code == 401

@pytest.mark.smoketest
@pytest.mark.nhsd_apim_authorization(access="application", level="level3")
def test_invalid_jwt_rejected(nhsd_apim_proxy_url, nhsd_apim_auth_headers):
    """
    Best-effort: if gateway validates JWTs, an invalid token should be rejected.
    If JWT not used in this env, test is skipped.
    """
    headers = {
        **nhsd_apim_auth_headers,
        "headerauth1": "headervalue1",
        "x-request-id": "123456"
    }
    print(headers)
    # If no Authorization configured in project headers, skip
    if "Authorization" not in headers:
        pytest.skip("JWT auth not configured for this environment")

    bad_headers = dict(headers)
    bad_headers["Authorization"] = "Bearer invalid.invalid.invalid"
    status = _get(f"{nhsd_apim_proxy_url}/_status", headers=bad_headers).status_code
    assert status in (401, 403), "Expected gateway to reject invalid JWT"
