import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import MI_ENDPOINT
from lib.generators import Generators
from lib.assertions import Assertions
from lib.errorhandler import ErrorHandler

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest

def test_201_create_mi_record(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token.value)
    data = Generators.generate_valid_mi_record_body()

    response = requests.post(
        f"{url}/{MI_ENDPOINT}",
        headers=headers,
        json=data
    )

    Assertions.assert_201_response(response, data)

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_400_create_mi_record_with_invalid_request(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token.value)
    data = Generators.generate_invalid_mi_record_body()

    response = requests.post(
        f"{url}/{MI_ENDPOINT}",
        headers=headers,
        json=data
    )

    ErrorHandler.handle_retry(response)
    assert response.status_code == 400, f"Response: {response.status_code}: {response.text}"
    assert response.json().get("errors")[0].get("detail") == "The request body is invalid"

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_400_create_mi_record_with_invalid_date(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token.value)
    data = Generators.generate_invalid_date_mi_record()

    response = requests.post(
        f"{url}/{MI_ENDPOINT}",
        headers=headers,
        json=data
    )

    ErrorHandler.handle_retry(response)
    assert response.status_code == 400, f"Response: {response.status_code}: {response.text}"
    assert response.json().get("errors")[0].get("detail") == "Timestamps should be UTC date/times in ISO8601 format, with a Z suffix"
