from re import M
import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import VALID_ENDPOINT_LETTERS, MI_ENDPOINT
from lib.generators import Generators

METHODS = ["get", "post"]


@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
@pytest.mark.parametrize("method", METHODS)
@pytest.mark.parametrize("endpoints", VALID_ENDPOINT_LETTERS)
def test_header_letters_endpoint(
    url,
    method,
    endpoints,
    bearer_token
):
    resp = getattr(requests, method)(f"{url}/{endpoints}", headers={
        "Authorization": bearer_token.value,
        "X-Request-ID": None
    })

    assert resp.status_code == 500


@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_header_mi_endpoint(
    url,
    bearer_token
):
    resp = getattr(requests, "post")(f"{url}/{MI_ENDPOINT}", headers={
        "Authorization": bearer_token.value,
        "X-Request-ID": ""
    })

    assert resp.status_code == 500
