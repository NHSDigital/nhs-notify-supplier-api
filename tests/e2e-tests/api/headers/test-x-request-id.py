import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import DEFAULT_CONTENT_TYPE, VALID_ENDPOINTS

METHODS = ["get", "post"]
REQUEST_ID = [None, "88b10816-5d45-4992-bed0-ea685aaa0e1f"]


@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
@pytest.mark.parametrize("request_id", REQUEST_ID)
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINTS)
def test_406(
    url,
    accept_header_name,
    accept_header_value,
    correlation_id,
    method,
    endpoints
):
    resp = getattr(requests, method)(f"{url}/{endpoints}", headers={
        "Authorization": "Bearer BdXxzeUkIu7F3Fu91Hsa4URYORMa",
        accept_header_name: accept_header_value,
        "X-Correlation-Id": request_id
    })

    assert resp.status_code == 500
