
class Generators():
@staticmethod
    def generate_valid_create_message_body(environment="sandbox"):
        return {
            {
                "data": {
                    "attributes": {
                    "status": "PENDING"
                    },
                    "id": "2WL5eYSWGzCHlGmzNxuqVusPxDg",
                    "type": "Letter"
                }
            }
        }
