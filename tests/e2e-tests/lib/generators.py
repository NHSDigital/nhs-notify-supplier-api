class Generators:
    @staticmethod
    def generate_valid_create_message_body(environment="sandbox"):
        return {
            "data": {
                "attributes": {
                    "status": "PENDING"
                },
                "id": "2WL5eYSWGzCHlGmzNxuqVusPxDg",
                "type": "Letter"
            }
        }

    @staticmethod
    def generate_valid_headers(auth):
        return {
            "Authorization": auth,
            "X-Request-ID":"123e4567-e89b-12d3-a456-426614174000",
        }
