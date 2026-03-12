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
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=1", headers=headers)

    letter_id = get_letter_id.json().get("data")[0].get("id")

    data = Generators.generate_valid_message_body("ACCEPTED", letter_id)
    update_letter_status = requests.patch(
        f"{url}/{LETTERS_ENDPOINT}/{letter_id}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 202, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"

def test_202_with_rejected_status(url, bearer_token):
    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=1", headers=headers)

    letter_id = get_letter_id.json().get("data")[0].get("id")

    data = Generators.generate_valid_message_rejected("REJECTED", letter_id)
    update_letter_status = requests.patch(
        f"{url}/{LETTERS_ENDPOINT}/{letter_id}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 202, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_400_with_invalid_status(url, bearer_token):
    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=1", headers=headers)

    letter_id = get_letter_id.json().get("data")[0].get("id")

    data = Generators.generate_valid_message_body("", letter_id)
    update_letter_status = requests.patch(
        f"{url}/{LETTERS_ENDPOINT}/{letter_id}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 400, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_400_id_mismatch_with_request(url, bearer_token):
    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letter_id = requests.get(f"{url}/{LETTERS_ENDPOINT}?limit=1", headers=headers)

    letter_id = get_letter_id.json().get("data")[0].get("id")

    data = Generators.generate_valid_message_body("ACCEPTED", "letter1")
    update_letter_status = requests.patch(
        f"{url}/{LETTERS_ENDPOINT}/{letter_id}",
        headers=headers,
        json=data,
    )

    ErrorHandler.handle_retry(update_letter_status)
    assert update_letter_status.status_code == 400, f"Response: {update_letter_status.status_code}: {update_letter_status.text}"
    assert update_letter_status.json().get("errors")[0].get("detail") == "The letter ID in the request body does not match the letter ID path parameter"
