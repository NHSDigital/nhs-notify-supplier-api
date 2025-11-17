# Environments – Notify Supplier

## Environment Matrix

| Environment Name | Apigee Instance | Proxy URL | Application | Security Level | Private Key | KID | Notes / Env Code |
|------------------|-----------------|-----------|--------------|----------------|--------------|------|------------------|
| **Internal dev – PRs** | Internal | internal-dev.api.service.nhs.uk/nhs-notify-supplier-PR-XXX | Notify-Supplier-App-Restricted – Internal Dev 2 | level 0 | — | — | internal-dev PRs |
| **Internal dev – Main** | Internal | internal-dev.api.service.nhs.uk/nhs-notify-supplier | Notify Supplier – Application Restricted – Internal Dev Main | level 3 | [internal-dev-test-1.pem](https://eu-west-2.console.aws.amazon.com/systems-manager/parameters/%252Fnhs%252Fjwt%252Fkeys%252Finternal-dev-test-1.pem/description?region=eu-west-2&tab=Table) | internal-dev-test-1 | dev |
| **Ref** | Internal | ref.api.service.nhs.uk/nhs-notify-supplier | Notify Supplier – Application Restricted – Ref | level 3 | [ref-test-1.pem](https://eu-west-2.console.aws.amazon.com/systems-manager/parameters/%252Fnhs%252Fjwt%252Fkeys%252Fref-test-1.pem/description?region=eu-west-2&tab=Table) | ref-test-1 | prod |
| **Int** | External | int.api.service.nhs.uk/nhs-notify-supplier | Notify Supplier – Integration Testing | level 3 | [int-test-1.pem](https://eu-west-2.console.aws.amazon.com/systems-manager/parameters/%252Fnhs%252Fint%252Fjwt%252Fint-test-1.pem/description?region=eu-west-2&tab=Table) | int-test-1 | int |

---

## How to Get the JWT Access Token

1. Download the private key from AWS Systems Manager and save it locally as `$KID.pem`, for example `ref-test-1.pem`.

2. Get the Apigee API key via one of the following:
   - [Apigee Edge Console](https://apigee.com/edge)
   - [Internal developer account](https://onboarding.prod.api.platform.nhs.uk/Index)
   - [External developer account](https://dos-internal.ptl.api.platform.nhs.uk/Index)

3. Run the Python script `get_bearer_token.py` with the parameters:

   ```bash
   python get_bearer_token.py --kid <KID> --env <ENVIRONMENT> --appid <APIKEY>
   ```

   Example:

   ```bash
   python get_bearer_token.py --kid ref-test-1 --env ref --appid 8Np3gFEw21JX7AGuokId0QEFTaOhG4Z2
   ```

4. Example output:

   ```bash
   access_token: O2CHM6SbhadinFchta4jqlOjcguk
   expires_in: 599
   token_type: Bearer
   ```

5. Add the access token to your API requests as a header:

   | Header Name | Header Value |
   |--------------|--------------|
   | Authorization | Bearer <access_token> |

---
