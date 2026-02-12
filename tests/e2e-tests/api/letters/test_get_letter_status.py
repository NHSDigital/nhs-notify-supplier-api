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
def test_200_get_letter_status(url, bearer_token):
    headers = Generators.generate_valid_headers(bearer_token.value)
    get_letters = requests.get(f"{url}/{LETTERS_ENDPOINT}/", headers=headers)

    letter_id = get_letters.json().get("data")[0].get("id")
    get_message_response = requests.get(f"{url}/{LETTERS_ENDPOINT}/{letter_id}", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    assert get_message_response.status_code == 200, f"Response: {get_message_response.status_code}: {get_message_response.text}"


@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_404_letter_does_not_exist(url, bearer_token):
    headers = Generators.generate_valid_headers(bearer_token.value)
    get_message_response = requests.get(f"{url}/{LETTERS_ENDPOINT}/xx", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    assert get_message_response.status_code == 404, f"Response: {get_message_response.status_code}: {get_message_response.text}"
    assert get_message_response.json().get("errors")[0].get("detail") == "No resource found with that ID"
