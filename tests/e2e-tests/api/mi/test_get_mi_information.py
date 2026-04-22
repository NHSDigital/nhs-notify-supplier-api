# import requests
# import pytest
# from lib.fixtures import *  # NOSONAR
# from lib.constants import MI_ENDPOINT
# from lib.generators import Generators
# from lib.errorhandler import ErrorHandler

# @pytest.mark.test
# @pytest.mark.devtest
# @pytest.mark.inttest
# @pytest.mark.prodtest
# def test_200_get_management_information(url, bearer_token):
#     headers = Generators.generate_valid_headers(bearer_token.value)
#     data = Generators.generate_valid_mi_record_body()
#     create_mi = requests.post(
#         f"{url}/{MI_ENDPOINT}",
#         headers=headers,
#         json=data,
#     )
#     mi_id = create_mi.json().get("data").get("id")

#     get_mi = requests.get(f"{url}/{MI_ENDPOINT}/", headers=headers)
#     get_message_response = requests.get(f"{url}/{MI_ENDPOINT}/{mi_id}", headers=headers)

#     ErrorHandler.handle_retry(get_message_response)
#     assert get_message_response.status_code == 200, f"Response: {get_message_response.status_code}: {get_message_response.text}"


# @pytest.mark.test
# @pytest.mark.devtest
# @pytest.mark.inttest
# @pytest.mark.prodtest
# def test_404_mi_does_not_exist(url, bearer_token):
#     headers = Generators.generate_valid_headers(bearer_token.value)
#     get_message_response = requests.get(f"{url}/{MI_ENDPOINT}/xx", headers=headers)

#     ErrorHandler.handle_retry(get_message_response)
#     assert get_message_response.status_code == 404, f"Response: {get_message_response.status_code}: {get_message_response.text}"
#     assert get_message_response.json().get("errors")[0].get("detail") == "No resource found with that ID"

# @pytest.mark.test
# @pytest.mark.devtest
# @pytest.mark.inttest
# @pytest.mark.prodtest
# def test_404_mi_miId_from_different_supplier_returns_does_not_exist(url, bearer_token):
#     headers = Generators.generate_valid_headers(bearer_token.value)
#     other_supplier_headers = Generators.generate_valid_headers(bearer_token.value) # secondary_bearer_token
#     data = Generators.generate_valid_mi_record_body()
#     create_mi = requests.post(
#         f"{url}/{MI_ENDPOINT}",
#         headers=headers,
#         json=data,
#     )
#     mi_id = create_mi.json().get("data").get("id")

#     get_message_response = requests.get(f"{url}/{MI_ENDPOINT}/{mi_id}", headers=other_supplier_headers)

#     ErrorHandler.handle_retry(get_message_response)
#     assert get_message_response.status_code == 404, f"Response: {get_message_response.status_code}: {get_message_response.text}"
#     assert get_message_response.json().get("errors")[0].get("detail") == "No resource found with that ID"
