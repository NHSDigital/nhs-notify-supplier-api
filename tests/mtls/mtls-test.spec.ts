import { test, expect, request, APIRequestContext } from "@playwright/test";

// Assume you have your constants in a config file
const PROXY_URL = process.env.PROXY_URL;

test("should fail when connecting without client certificate", async () => {
  let apiContext: APIRequestContext | null = null;

  try {
    apiContext = await request.newContext();
    const response = await apiContext.get(PROXY_URL!, {
      headers: { "X-Client-Id": "hello" },
    });

    // Check if request succeeded or failed
    if (response.ok()) {
      throw new Error(
        `Expected connection failure, but got success with status ${response.status()}`
      );
    }
    // Assert on the actual error code returned by the gateway
    // For mTLS, often 401, 403, or 502 depending on infra config
    expect(response.ok()).toBeFalsy();
  } catch (err: any) {
    // If the request truly fails at the TLS layer, Playwright will throw instead
    expect(err.message).toMatch(/SSL|certificate|ECONNRESET|socket/i);
  } finally {
    if (apiContext) {
      await apiContext.dispose();
    }
  }
});
