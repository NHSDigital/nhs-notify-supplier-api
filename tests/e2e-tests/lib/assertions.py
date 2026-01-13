from .errorhandler import ErrorHandler

class Assertions():
    @staticmethod
    def assert_201_response(response, data):
        ErrorHandler.handle_retry(response)
        assert response.status_code == 201, f"Response: {response.status_code}: {response.text}"
        assert response.json().get("data").get("id") is not None
        assert response.json().get("data").get("type") == data.get("data").get("type")
        assert response.json().get("data").get("attributes").get("lineItem") == data.get("data").get("attributes").get("lineItem")
        assert response.json().get("data").get("attributes").get("timestamp") == data.get("data").get("attributes").get("timestamp")
        assert response.json().get("data").get("attributes").get("quantity") == data.get("data").get("attributes").get("quantity")
        assert response.json().get("data").get("attributes").get("specificationId") == data.get("data").get("attributes").get("specificationId")
        assert response.json().get("data").get("attributes").get("stockRemaining") == data.get("data").get("attributes").get("stockRemaining")
