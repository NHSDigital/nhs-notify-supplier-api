import uuid
from time import time

import requests
import jwt  # pyjwt library

REALM_URL = "https://identity.prod.api.platform.nhs.uk/realms/api-producers"
PRIVATE_KEY_FILE = "/home/davidw/.ssh/notify-supplier-key-1.pem"
KID = "notify-supplier-key-1"
CLIENT_ID = "nhs-notify-supplier-client"

claims = {
    "sub": CLIENT_ID,
    "iss": CLIENT_ID,
    "jti": str(uuid.uuid4()),
    "aud": REALM_URL,
    "exp": int(time()) + 300,
}

with open(PRIVATE_KEY_FILE, "r") as f:
    private_key = f.read()

client_assertion = jwt.encode(
    claims, private_key, algorithm="RS512", headers={'kid': KID}
)

token_response = requests.post(
    f"{REALM_URL}/protocol/openid-connect/token",
    data={
        "grant_type": "client_credentials",
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": client_assertion,
    },
)

access_token = token_response.json()["access_token"]

print("access token:", access_token)

# Make a request to a protected endpoint
response = requests.get(
    "https://proxygen.prod.api.platform.nhs.uk/apis/nhs-notify-supplier/",
    headers={"Authorization": f"Bearer {access_token}"},
)

print("Status Code:", response.status_code)
print("Headers:", response.headers)
print("Body:", response.text)
