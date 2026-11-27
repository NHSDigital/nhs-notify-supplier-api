codes_to_retry = [429, 504, 502]

# Request headers that are safe to log and help trace a request through Apigee and the backend
_TRACE_REQUEST_HEADERS = ["X-Request-ID", "X-Correlation-ID"]
_MAX_BODY_CHARS = 2000


def describe_response(resp) -> str:
    """Summarise a response for diagnosing failures, without leaking auth headers."""
    request = resp.request
    trace_headers = {
        name: request.headers.get(name)
        for name in _TRACE_REQUEST_HEADERS
        if request.headers.get(name)
    }
    return (
        f"{request.method} {request.url} -> {resp.status_code} "
        f"(elapsed {resp.elapsed.total_seconds():.2f}s)\n"
        f"request trace headers: {trace_headers}\n"
        f"response headers: {dict(resp.headers)}\n"
        f"response body: {resp.text[:_MAX_BODY_CHARS]}"
    )


class ErrorHandler:
    @staticmethod
    def handle_retry(resp):
        if resp.status_code >= 500:
            # 5xx responses that never reach the lambda leave nothing in CloudWatch, so print what Apigee returned
            print(f"Server error response:\n{describe_response(resp)}")
        if resp.status_code in codes_to_retry:
            raise AssertionError(f'Unexpected {resp.status_code}')
