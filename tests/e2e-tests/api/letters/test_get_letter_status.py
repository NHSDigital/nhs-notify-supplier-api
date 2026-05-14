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

    get_message_response = requests.get(f"{url}/{LETTERS_ENDPOINT}/{letter_id}", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    assert get_message_response.status_code == 200, f"Response: {get_message_response.status_code}: {get_message_response.text}"


@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_404_letter_does_not_exist(url, authentication_secret):
    headers = Generators.generate_valid_headers(authentication_secret)
    get_message_response = requests.get(f"{url}/{LETTERS_ENDPOINT}/xx", headers=headers)

    ErrorHandler.handle_retry(get_message_response)
    assert get_message_response.status_code == 404, f"Response: {get_message_response.status_code}: {get_message_response.text}"
    assert get_message_response.json().get("errors")[0].get("detail") == "No resource found with that ID"
