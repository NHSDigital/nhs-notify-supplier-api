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
def test_200_get_letters(url, authentication_secret):
    headers = Generators.generate_valid_headers(authentication_secret)

    # limit=1 because every letter returned is hidden for the visibility timeout,
    # which would take shared supplier letters away from tests running in parallel
    print(f"calling GET {url}{LETTERS_ENDPOINT}?limit=1")
    response = requests.get(f"{url}{LETTERS_ENDPOINT}", headers=headers, params={"limit": 1})

    ErrorHandler.handle_retry(response)
    assert response.status_code == 200, f"Response: {response.status_code}: {response.text}"
    data = response.json().get("data")
    assert isinstance(data, list), f"Expected a list of letters, got: {response.text}"
    assert len(data) <= 1
