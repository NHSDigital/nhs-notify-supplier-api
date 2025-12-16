import requests
import pytest
from lib.constants import METHODS, VALID_ENDPOINTS
from lib.fixtures import *  # NOSONAR

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

    assert(resp.status_code == "401")
