import pytest
from lib.fixtures import *  # NOSONAR
from lib.constants import LETTERS_ENDPOINT
from lib.generators import Generators
from lib.letters import get_pending_letter_ids

@pytest.mark.test
@pytest.mark.devtest
@pytest.mark.inttest
@pytest.mark.prodtest
def test_200_get_letters(url, authentication_secret):
    headers = Generators.generate_valid_headers(authentication_secret)

    ids = get_pending_letter_ids(url, headers, LETTERS_ENDPOINT, limit=1)
    assert ids, "Expected at least one PENDING letter"
    assert len(ids) == 1
