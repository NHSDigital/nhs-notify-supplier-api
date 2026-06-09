import hashlib
import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import LETTERS_ENDPOINT
from lib.generators import Generators
from lib.letters import get_pending_letter_ids
from lib.errorhandler import ErrorHandler

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_200_get_letter_status(url, authentication_secret):
    headers = Generators.generate_valid_headers(authentication_secret)

    ids = get_pending_letter_ids(url, headers, LETTERS_ENDPOINT, limit=1)
    letter_id = ids[0]

    print(f"calling GET {url}{LETTERS_ENDPOINT}/{letter_id}")
    get_message_response = requests.get(f"{url}{LETTERS_ENDPOINT}/{letter_id}", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    assert get_message_response.status_code == 200, f"Response: {get_message_response.status_code}: {get_message_response.text}"

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_200_get_letter_status_matches_pdf_hash(url, authentication_secret):
    headers = Generators.generate_valid_headers(authentication_secret)

    ids = get_pending_letter_ids(url, headers, LETTERS_ENDPOINT, limit=1)
    letter_id = ids[0]

    print(f"calling GET {url}{LETTERS_ENDPOINT}/{letter_id}")
    get_message_response = requests.get(f"{url}{LETTERS_ENDPOINT}/{letter_id}", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    expected_sha256 = get_message_response.json().get("data", {}).get("attributes", {}).get("sha256Hash")

    get_pdf_response = requests.get(
        f"{url}{LETTERS_ENDPOINT}/{letter_id}/data",
        headers=headers,
        allow_redirects=True,
    )
    downloaded_pdf_sha256 = hashlib.sha256(get_pdf_response.content).hexdigest()

    assert get_message_response.status_code == 200, f"Response: {get_message_response.status_code}: {get_message_response.text}"
    assert expected_sha256 is not None, "Expected sha256Hash in GET /letters/{id} response"
    assert downloaded_pdf_sha256 == expected_sha256, (
        f"Expected PDF sha256 {expected_sha256}, got {downloaded_pdf_sha256}"
    )

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_404_letter_does_not_exist(url, authentication_secret):
    headers = Generators.generate_valid_headers(authentication_secret)

    print(f"calling GET {url}{LETTERS_ENDPOINT}/xx")
    get_message_response = requests.get(f"{url}{LETTERS_ENDPOINT}/xx", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    assert get_message_response.status_code == 404, f"Response: {get_message_response.status_code}: {get_message_response.text}"
    assert get_message_response.json().get("errors")[0].get("detail") == "No resource found with that ID"
