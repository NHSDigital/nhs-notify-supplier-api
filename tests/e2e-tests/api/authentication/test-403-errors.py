import requests
import pytest
from lib.constants import VALID_ENDPOINTS

METHODS = ["get", "post"]
CORRELATION_IDS = [None, "76491414-d0cf-4655-ae20-a4d1368472f3"]


@pytest.mark.test
@pytest.mark.nhsd_apim_authorization({"access": "application", "level": "level0"})
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINTS)
def test_user_token_get(nhsd_apim_proxy_url, nhsd_apim_auth_headers, method, endpoints):
    print(nhsd_apim_proxy_url)

    resp = getattr(requests, method)(f"{nhsd_apim_proxy_url}{endpoints}", headers={
        **nhsd_apim_auth_headers
    })

    print("Status:", resp.status_code)

    assert(resp.status_code == 401)
