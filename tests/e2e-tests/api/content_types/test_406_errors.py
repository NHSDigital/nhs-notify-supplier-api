import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import DEFAULT_CONTENT_TYPE, VALID_ENDPOINTS

HEADER_NAME = ["accept", "ACCEPT"]
HEADER_VALUE = ["", "application/xml", "application/json; charset=utf-9"]
METHODS = ["get", "post"]
CORRELATION_IDS = [None, "88b10816-5d45-4992-bed0-ea685aaa0e1f"]


@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
@pytest.mark.parametrize("accept_header_name", HEADER_NAME)
@pytest.mark.parametrize("accept_header_value", HEADER_VALUE)
@pytest.mark.parametrize("correlation_id", CORRELATION_IDS)
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
        "Authorization": "Bearer v2tQ9ez4uiEIcEm1fapYN0DrVYyL",
        accept_header_name: accept_header_value,
        "X-Correlation-Id": correlation_id
    })

    assert resp.status_code == 406
    assert resp.headers.get("Content-Type") == DEFAULT_CONTENT_TYPE
