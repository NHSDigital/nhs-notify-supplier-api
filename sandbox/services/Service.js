class Service {
  static rejectResponse(error, code = 500) {
    return { error, code };
  }

  static successResponse(payload, code = 200, headers = {}) {
    if (payload.xRequestId) {
      headers['X-Request-ID'] = payload.xRequestId;
    }
    if (payload.xCorrelationId) {
      headers['X-Correlation-ID'] = payload.xCorrelationId;
    }
    let body = payload.data !== undefined ? payload.data : undefined;

    return { body, code, headers };
  }
}

module.exports = Service;
