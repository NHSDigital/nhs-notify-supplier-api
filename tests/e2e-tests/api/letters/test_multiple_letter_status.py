from re import L
import time
import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import LETTERS_ENDPOINT
from lib.generators import Generators
from lib.errorhandler import ErrorHandler

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest

def test_202_with_valid_headers(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=2", headers=headers)

    ids = [item.get("id") for item in get_letter_id.json().get("data", [])]

    if ids:
        data = Generators.generate_multiple_valid_request(ids)
    else:
        raise ValueError("No letter IDs returned from API")

    update_letter_status = requests.post(
        f"{url}/{LETTERS_ENDPOINT}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 202, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_400_duplicates_in_request_body(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=2", headers=headers)

    ids = [item.get("id") for item in get_letter_id.json().get("data", [])]

    if ids:
        data = Generators.generate_duplicate_request(ids)
    else:
        raise ValueError("No letter IDs returned from API")

    update_letter_status = requests.post(
        f"{url}/{LETTERS_ENDPOINT}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 400, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"
    assert update_letter_status.json().get("errors")[0].get("detail") ==  "The request cannot include multiple letter objects with the same id"

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_400_invalid_status_in_request_body(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=3", headers=headers)

    ids = [item.get("id") for item in get_letter_id.json().get("data", [])]

    if ids:
        data = Generators.generate_invalid_status_request(ids)
    else:
        raise ValueError("No letter IDs returned from API")

    update_letter_status = requests.post(
        f"{url}/{LETTERS_ENDPOINT}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 400, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"
    assert update_letter_status.json().get("errors")[0].get("detail") ==  "The request body is invalid"
