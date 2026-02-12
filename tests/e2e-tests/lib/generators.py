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

    @staticmethod
    def generate_valid_message_body(status, id):
        return {
            "data": {
                "attributes": {
                    "status": status,
                },
                "id": id,
                "type": "Letter"
            }
        }

    @staticmethod
    def generate_valid_message_rejected(status, id):
        return {
            "data": {
                "attributes": {
                    "status": status,
                    "reasonCode": "R01",
                    "reasonText": "Test Reason",
                },
                "id": id,
                "type": "Letter"
            }
        }

    @staticmethod
    def generate_multiple_valid_request(letter_ids):

        num_of_ids = len(letter_ids)
        return {
            "data": [
                {
                    "attributes": {
                        "status": "DELIVERED",
                    },
                    "id": letter_ids[num_of_ids-2],
                    "type": "Letter"
                },
                {
                    "attributes": {
                        "status": "REJECTED",
                        "reasonCode": "R01",
                        "reasonText": "Test Reason",
                    },
                    "id": letter_ids[num_of_ids-1],
                    "type": "Letter"
                }
            ]
        }

    @staticmethod
    def generate_duplicate_request(letter_ids):

        num_of_ids = len(letter_ids)
        return {
            "data": [
                {
                    "attributes": {
                        "status": "DELIVERED",
                    },
                    "id": letter_ids[num_of_ids-2],
                    "type": "Letter"
                },
                {
                    "attributes": {
                        "status": "REJECTED",
                        "reasonCode": "R01",
                        "reasonText": "Test Reason",
                    },
                    "id": letter_ids[num_of_ids-1],
                    "type": "Letter"
                },
                {
                    "attributes": {
                        "status": "DELIVERED",
                    },
                    "id": letter_ids[num_of_ids-2],
                    "type": "Letter"
                },
            ]
        }

    @staticmethod
    def generate_invalid_status_request(letter_ids):

        num_of_ids = len(letter_ids)
        return {
            "data": [
                {
                    "attributes": {
                        "status": "INVALID_STATUS",
                    },
                    "id": letter_ids[num_of_ids-2],
                    "type": "Letter"
                },
                {
                    "attributes": {
                        "status": "REJECTED",
                        "reasonCode": "R01",
                        "reasonText": "Test Reason",
                    },
                    "id": letter_ids[num_of_ids-1],
                    "type": "Letter"
                }
            ]
        }

    @staticmethod
    def generate_valid_mi_record_body():
        return {
            "data": {
                "attributes": {
                    "lineItem": "envelope-business-standard",
                    "quantity": 1,
                    "specificationId": "Test-Spec-Id",
                    "stockRemaining": 2000,
                    "timestamp": "2023-11-17T14:27:51.413Z"
                },
                "type": "ManagementInformation"
            }
        }

    @staticmethod
    def generate_invalid_mi_record_body():
        return {
            "data": {
                "attributes": {
                    "lineItem": "envelope-business-standard",
                    "quantity": 1,
                    "specificationId": "Test-Spec-Id",
                    "stockRemaining": 2000,
                    "timestamp": "2023-11-17T14:27:51.413Z"
                }
            }
        }

    @staticmethod
    def generate_invalid_date_mi_record():
        return {
            "data": {
                "attributes": {
                    "lineItem": "envelope-business-standard",
                    "quantity": 1,
                    "specificationId": "Test-Spec-Id",
                    "stockRemaining": 2000,
                    "timestamp": "2023-11-17"
                },
                "type": "ManagementInformation"
            }
        }
