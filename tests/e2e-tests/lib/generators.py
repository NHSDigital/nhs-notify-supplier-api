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
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
