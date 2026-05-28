import pytest
from lib.letters import create_test_data


@pytest.fixture(scope="session", autouse=True)
def seed_letter_test_data():
    """Seed PENDING letters before any test in this directory runs.

    Delegates to the shared letter-test-data CLI, mirroring globalSetup() /
    createTestData() used by the component tests
    (tests/config/global-setup.ts). Session-scoped so it runs once per
    test session. autouse=True means no test needs to reference it explicitly.
    """
    create_test_data(count=10)
