import requests
import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import LETTERS_ENDPOINT

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_406(url, bearer_token):

    headers = Generators.generate_valid_headers(bearer_token)

    get_message_response = requests.get(f"{url}/letters/status", headers=headers)

    assert get_message_response.status_code == 200
