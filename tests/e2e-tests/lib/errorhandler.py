codes_to_retry = [429, 504, 502]

class ErrorHandler:
    @staticmethod
    def handle_retry(resp):
        if resp.status_code in codes_to_retry:
            raise AssertionError(f'Unexpected {resp.status_code}')
