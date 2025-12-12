import uuid
import argparse
from time import time
import requests
import jwt  # https://github.com/jpadilla/pyjwt

ENV_TOKEN_URLS = {
    "int":  "https://int.api.service.nhs.uk/oauth2/token",
    "internal-dev":  "https://internal-dev.api.service.nhs.uk/oauth2-mock/token",
    "prod": "https://api.service.nhs.uk/oauth2/token",
    "ref": "https://ref.api.service.nhs.uk/oauth2/token",
}

def main():
    ap = argparse.ArgumentParser(description="Fetch NHS access token using a signed client assertion (JWT).")
    ap.add_argument("--kid", required=True,
                    help="Base name used for both the private key file (<id>.pem) and the JWT header kid.")
    ap.add_argument("--env", choices=ENV_TOKEN_URLS.keys(), required=True,
                    help="Environment to hit: int, internal-dev, or prod.")
    ap.add_argument("--appid", help="Apigee Application ID (used for both sub and iss).")
    args = ap.parse_args()

    kid = args.kid
    private_key_file = f"{kid}.pem"
    token_url = ENV_TOKEN_URLS[args.env]

    with open(private_key_file, "r") as f:
        private_key = f.read()

    claims = {
        "sub": args.appid,
        "iss": args.appid,
        "jti": str(uuid.uuid4()),
        "aud": token_url,
        "exp": int(time()) + 300, # 5mins in the future
    }

    additional_headers = {"kid": kid}

    signed_jwt = jwt.encode(
        claims, private_key, algorithm="RS512", headers=additional_headers
    )
# ----- 2) Exchange JWT for an access token -----
    form = {
        "grant_type": "client_credentials",
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": signed_jwt,
    }

    resp = requests.post(
        token_url,
        headers={"content-type": "application/x-www-form-urlencoded"},
        data=form,
        timeout=30,
    )

    # Raise for non-2xx responses, then print the token payload
    resp.raise_for_status()
    token_payload = resp.json()

    print("access_token:", token_payload.get("access_token"))
    print("expires_in:", token_payload.get("expires_in"))
    print("token_type:", token_payload.get("token_type"))

if __name__ == "__main__":
    main()
