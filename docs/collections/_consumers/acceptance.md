---
title: Acceptance Pack
order: 0
nav_order: 3
has_children: false
has_toc: false
---

## Introduction and scope

This pack explains the steps you must complete to confirm that your integration with the NHS Notify Supplier API meets all technical requirements.

### You (the Supplier) are responsible for

- Leading and managing your testing
- Ensuring that a test manager or delivery manager is available to oversee progress and reporting
- Ensuring that a tester or developer is available to run the integration tests
- Executing all required tests in the Integration (INT) environment
- Providing evidence for each test case (API responses, logs, print proofs, performance outputs)
- Agreeing two one-week testing windows
- Managing timelines and test cycles to ensure readiness
- Letting us know when you're ready to start testing

You can start testing earlier using our Sandbox environment to get familiar with the API before formal testing begins.

### Test execution

Testing will take place in the Integration Test (INT) environment and will be supported by the API development over two one-week integration test windows.

You will need to provide evidence of test execution and results. Successfully passing this test pack is a prerequisite for progression to the production environment.

## Test data provided

NHS Notify will seed your Integration (INT) environment with a sample of 2,500 letters. This dataset is designed to reflect the variety of letter types and scenarios you will find in production, enabling you to complete all functional, performance, and status-based tests in this pack.

The seeded dataset provides a mix of standard and exceptional cases to validate your system's ability to process, identify, and report on different letter types and outcomes.

The sample data will include:

- Standard letters (English) - Core test cases representing typical production letters in standard format and layout
- Accessible format letters - Letters designed for accessibility (e.g., large print, braille, or audio) to ensure your system correctly identifies and routes alternative format requests
- Letters without PDFs - Records that reference missing or unavailable PDF files, used to test your system's error handling and reporting for incomplete data
- Incorrect letter specifications - Letters containing invalid or incomplete metadata to validate error detection and response handling
- Non-English letters – Right-to-Left (RTL) - Examples in languages that read from right to left (e.g., Arabic, Urdu) to test layout handling
- Non-English letters – Left-to-Right (LTR) - Examples in other supported non-English languages

### Purpose of the Test Data

This data allows you to:

- Verify that your system can retrieve, process, and acknowledge all letter types through the full status lifecycle (from _PENDING_ to _DELIVERED_)
- Confirm correct handling of exceptional or error conditions, such as missing PDFs or invalid specifications
- Demonstrate compliance with NHS Notify integration and assurance requirements before progressing to the production environment

## Test scenarios

Each scenario validates a key aspect of the Supplier API integration. Mandatory tests focus on data retrieval, status updates and MI reconciliation. Optional statuses such as PRINTED, ENCLOSED and DELIVERED have been added and you need to prove them only if you support these statuses in your workflow.

### AT1 – Connect securely to the NHS Notify Supplier API

Validate that your system can functionally establish a secure, authenticated connection with the NHS Notify Supplier API via NHS API Management (APIM).

**Preconditions:**

1. Successful APIM onboarding completed
2. Supplier ID and APIM application ID confirmed in the NHS England Developer Portal
3. NHS Notify account is configured in the INT environment

**Endpoints:**

- GET /_status - Verify API health and authentication readiness
- GET /letters - Sample request to confirm authentication and API connectivity

**Objectives:**

- Confirm that your system can securely authenticate through APIM
- Validate that a call to both status and letters endpoints return successful responses
- Provide evidence of successful API calls

| Criteria | Description |
|---|---|
| **Steps** | 1. Authenticate with APIM<br>2. Send a request to GET /_status to confirm service availability<br>3. Call GET /letters to verify that the connection is working correctly<br>4. Confirm the API returns a successful response |
| **Acceptance** | - API connection successfully established for both endpoints<br>- No authentication or connectivity errors observed. |
| **Evidence** | Screenshot or API log showing successful responses from both endpoints |
| **Business value** | Demonstrates that your organisation can connect securely to NHS Notify and that authentication is correctly implemented before processing any real letter data. Ensures compliance with NHS Digital security standards and protects patient information from unauthorised access. |

### AT2 - Receive and prepare letters for production

This test validates that your system can receive and prepare all allocated letters each day by successfully calling the Notify API, fetching multiple pages of letter requests and confirming that all letters are retrieved without omission or duplication.

**Business outcome:**

You can receive the full list of allocated letters each day, ready for print production.

**Preconditions:**

- Supplier's INT tenant is seeded with 2,500 letters
- Supplier has valid API credentials and access to GET /letters endpoint
- All letters are in PENDING status

**Endpoints:**

- GET /letters - Retrieve allocated letters list

**Objectives:**

Validate your system's ability to:

- Retrieve the full list of 2,500 allocated letters
- Ensure no skipping or missing records

| Criteria | Description |
|---|---|
| **Steps** | 1. Call GET /letters to query a list of letters that is ready to be printed. Parameter to use: limit = 2500<br>2. Record total count and confirm 2,500 unique letter IDs are retrieved. |
|  **Acceptance** | - 2,500 unique letter IDs retrieved.<br>- No missing or duplicated IDs.<br>- All pages are fetched. |
| **Evidence** | API logs showing successful acknowledgement with total count of 2,500 unique letter IDs. |
| **Business value** | Confirms your production systems can begin each print run with all allocated letters, ensuring no delays or missed communications. |

### AT3 - Retrieve letter list twice without duplicate processing

This test validates that your system can retrieve the same list of allocated letters multiple times via the Notify API without triggering duplicate processing or re-queuing.

**Business outcome:**
Your system safely retrieves the daily list of allocated letters more than once and correctly identifies previously processed items, preventing any duplication in production.

**Preconditions:**

- Supplier's INT tenant is seeded with 2,500 letters
- Supplier has valid API credentials and access to GET /letters endpoint in the integration (INT) environment
- All letters are in PENDING status

**Endpoints:**

- GET /letters - retrieve allocated list of letters that are ready to be printed

**Objectives:**

Demonstrate that your system can:

- Retrieve the full list of allocated letters repeatedly
- Recognise and ignore letters already retrieved
- Prevent duplicate print, acceptance, or downstream processing
- Maintain consistent ordering across repeated calls

| Criteria | Description |
|---|---|
| **Steps** | 1. Call GET /letters?limit=2500 to retrieve the full list of allocated letters<br>2. Call GET /letters again immediately to retrieve the same list of letters<br>3. Compare the second list to the first<br>4. Confirm that:<br> a) The same 2,500 unique IDs are returned.<br> b) No new processing jobs are triggered for already seen letters<br> c) Your system ignores duplicates. |
| **Acceptance** | - Each letter is processed once.<br>- Duplicate retrievals do not cause re-printing, re-queuing, or duplicate API updates. |
| **Evidence** | - Retrieval logs showing both API calls and ID comparisons<br>- Processing logs showing no duplicate triggers<br>- Summary of total unique IDs vs. total retrieved records. |
| **Business value** | Confirms your system can safely retry or re-fetch letter lists without duplicate processing, ensuring data integrity and resilience to transient network or API errors. |

### AT4 – Acknowledge that you have accepted a list of letters

Validate that your system can correctly acknowledge and update the status of all retrieved letters to ACCEPTED once they are ready for production. This ensures proper workflow progression from retrieval to print readiness.

**Business outcome:**
Your system can mark all received letters as 'Accepted' for production, confirming readiness to print.

**Preconditions:**

- Letters retrieved via GET /letters?limit=1000
- All letters are in PENDING status

**Endpoints:**

- Bulk status update using POST /letters
- GET /letters/{id} to verify that the status updated

 **Objective:**
Confirm that you can mark letters as ACCEPTED for production readiness.

| Criteria | Description |
|---|---|
| **Steps** | 1. Call GET /letters?limit= 1000<br>2. Send POST /letters request with a single bulk payload<br>3. Verify via GET /letters/{id} that status updated to ACCEPTED.<br>4. Fetch another page of letters via GET /letters?limit=1000 and ensure that the letters are no longer in the pending queue. |
| **Acceptance** | - Targeted letters successfully updated from 'PENDING' status to 'ACCEPTED' status<br>- No letter is skipped <br>- API returns a successful response. |
| **Evidence** | - Include before and after status<br>- Include total update count. |
| **Business value** | Confirms that your system can inform NHS Notify of production readiness for each allocated letter. |

### AT5 – Printed letters (Optional Status)

Validate that your system can accurately record and report when letters have been physically printed.

If your system tracks the moment a letter is physically printed, you must update the letter status to PRINTED and provide evidence.

**Business outcome:**
Letters that were ACCEPTED are successfully printed and reported as PRINTED, proving print workflow completion.

**Preconditions:**

- Target letter in ACCEPTED status
- Letters available via GET /letters

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objective**
Prove your system records the point of physical print completion.

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify letters with status ACCEPTED<br>2. Send a PATCH /letters/{id} request to update targeted letters to PRINTED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to PRINTED. |
| **Acceptance** | - Only letters currently ACCEPTED are targeted<br>- All targeted letters are updated to PRINTED (no skips, no duplicates)<br>- API returns successful responses. |
| **Evidence** | API responses and before/after samples show correct transition. |
| **Business value** | Shows print workflow completion. |

### AT6 – Enclosed letters (Optional Status)

Validate that your system can accurately track and record the physical enclosing and packaging stage of letter production.

If your system tracks the physical enclosing and packaging stage, your system must update the letter status to ENCLOSED and provide supporting evidence.

**Business outcome:**
Letters that have been successfully printed and enclosed in envelopes are reported with a status of ENCLOSED, proving packaging and pre-dispatch readiness.

**Preconditions:**

- Letters retrieved via GET /letters
- **Eligible statuses:**
  - ACCEPTED
  - PRINTED

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objective:**
Demonstrate that your system can record the completion of envelope-insertion and packaging steps by updating eligible letters to ENCLOSED and confirming the status change.

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify letters with status ACCEPTED or PRINTED<br>2. Send a PATCH /letters/{id} request to update targeted letters to ENCLOSED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to ENCLOSED. |
| **Acceptance** | - Only letters currently in ACCEPTED or PRINTED are targeted<br>- All targeted letters are updated to ENCLOSED<br>- API returns successful response. |
| **Evidence** | API responses and before/after samples show correct transition. |
| **Business value** | Ensures enclosures are tracked prior to dispatch. |

### AT7 – Dispatch letters

Validate that your system can accurately record the handover of letters to delivery partners. This ensures full traceability beyond internal processing, confirming that all letters leaving your system are properly marked as DISPATCHED.

**Business outcome:**
Your system records the postal hand-off of each letter.

**Preconditions:**

- Letters retrieved via GET /letters
- **Eligible statuses**:
  - ACCEPTED
  - PRINTED
  - ENCLOSED

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objective:**
Validate that your system promptly reports all dispatched letters by updating their status to DISPATCHED.

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify letters with status 'ACCEPTED', 'PRINTED', 'ENCLOSED' <br>2. Send a PATCH /letters/{id} request to update targeted letters to DISPATCHED or send a POST /letters for a bulk update <br>3. Verify via GET /letters/{id} that status updated to DISPATCHED. |
| **Acceptance** | - Only letters currently in ACCEPTED, PRINTED, or ENCLOSED state are targeted<br>- All targeted letters are updated to DISPATCHED<br>- API returns a successful response. |
| **Evidence** | API responses and before/after samples show correct transition. |
| **Business value** | Demonstrates postal hand-off tracking. |

### AT8 – Confirm Delivery (Optional Status)

This test validates that your system can record the delivery confirmation of letters once this information is received from the delivery partner, and correctly mark the letters as DELIVERED.

If your downstream delivery provider supports reporting delivery confirmation then dispatch should be reported as DELIVERED.

**Business outcome:**
Letters that have completed postal delivery are updated to DELIVERED, confirming the end of the production and delivery workflow.

**Preconditions:**

- Letters retrieved via GET /letters
- **Eligible statuses:**
  - ACCEPTED
  - PRINTED
  - ENCLOSED
  - DISPATCHED

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objectives:**
Show that the printed letters have been delivered to patients

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify letters with status ACCEPTED, PRINTED, ENCLOSED, or DISPATCHED<br>2. Send a PATCH /letters/{id} request to update targeted letters to DELIVERED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to DELIVERED. |
| **Acceptance** | - Only letters currently in ACCEPTED, PRINTED, ENCLOSED, or DISPATCHED state are targeted<br>- All targeted letters are updated to DELIVERED<br>- API returns a successful response. |
| **Evidence** | API responses and before/after samples show correct transition. |
| **Business value** | Ensures that letters are delivered to patients. |

### AT9 – Forward to a specialist printer

This test validates that your system can accurately record forwarding events for letters that require redirection to a specialist supplier (e.g., RNIB or another accessible-format partner) instead of standard postal dispatch.

**Business outcome:**
Letters that cannot be delivered in their standard format are forwarded to a specialist supplier, and their status is updated to FORWARDED, confirming successful redirection and preventing further local production or dispatch.

**Preconditions:**

- Letters retrieved via GET /letters
- ACCEPTED is the eligible status
- Accessible format letters are included in the seeded data

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objectives:**

Prove that your system can correctly:

- Identify letters that require forwarding
- Update their status to FORWARDED including specifying the reason why the letter was forwarded
- Stop further local processing or dispatch

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify letters with status ACCEPTED and specification that require accessible format<br>2. Send a PATCH /letters/{id} request to update targeted letters to FORWARDED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to FORWARDED. |
| **Acceptance** | - All targeted letters are successfully updated to FORWARDED<br>- API returns a successful response.<br>- Forwarded letters are excluded from local printing, enclosing, or dispatch batches. |
| **Evidence** | API responses and before/after samples show correct transition. |
| **Business value** | Ensures that letters requiring accessible formats are correctly redirected to the relevant specialist supplier (e.g. RNIB). |

### AT10 – Handle Returns

This test verifies that your system can log and record returned letters (i.e., items that were undeliverable or returned to sender) and correctly update their status to RETURNED, providing full traceability and audit evidence.

**Business outcome:**
Letters that could not be delivered (e.g., invalid address, addressee moved, damaged mail) are identified, logged, and updated to RETURNED.
This enables accurate reconciliation, improves address data quality, and supports downstream corrective actions.

**Preconditions:**

- Letters retrieved via GET /letters
- **Eligible statuses:**
  - DELIVERED
  - DISPATCHED

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objectives:**

Demonstrate that returned mail is correctly:

- Identified and recorded as RETURNED
- Associated with a valid return timestamp and reason as per this list:

  - R01- Addressee gone away
  - R02- Address incomplete
  - R03- Address inaccessible
  - R04- Addressee unknown
  - R05- Addressee gone away/Refused
  - R06- Not called for
  - R07- No such address
  - R08- No reason given
  - R09- Deceased
  - R10- Miscellaneous

- Logged for audit and address-quality feedback

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify letters with status DELIVERED OR DISPATCHED <br>2. Send a PATCH /letters/{id} request to update targeted letters to RETURNED or send a POST / letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to RETURNED. |
| **Acceptance** | - All targeted letters are successfully updated to RETURNED<br>- API returns a successful response. |
| **Evidence** | API logs showing state transitions, timestamps. |
| **Business value** | Supports address-quality feedback. |

### AT11 – Manage cancellations

This test confirms that your system can process cancellation requests received from NHS Notify via the NHS Notify team and correctly update the associated letters to CANCELLED, ensuring they are immediately excluded from production, print, and dispatch workflows.

**Business outcome:**
Your system successfully handles cancellation notifications, removes the affected letters from the active production flow, and records a CANCELLED status.

**Preconditions:**

- **Input data:**
  - A list of letter IDs provided externally by NHS Notify for cancellation
  - Requests are not received via API (e.g., via email, or manual instruction)
- **Eligible statuses:**
  - ACCEPTED
  - FORWARDED
  - PRINTED
  - ENCLOSED

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objective:**

Demonstrate that your system:

- Receives and validates external cancellation requests
- Updates affected letters to CANCELLED status, including a code and a reason for cancellation
- Prevents any further production, printing, or dispatch of those letters

| Criteria | Description |
|---|---|
| **Steps** | 1. Get the letter that needs to be cancelled (list provided by NHS Notify)<br>2. Send a PATCH /letters/{id} request to update targeted letters to CANCELLED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to CANCELLED. |
| **Acceptance** | - Only letters not yet dispatched or delivered may be cancelled<br>- All targeted letters are successfully updated to CANCELLED<br>- API returns a successful response. |
| **Evidence** | API audit trail and before/after validation samples. |
| **Business value** | Prevents unnecessary printing and protects data integrity. |

### AT12 – Handle failures

This test verifies that your system can flag letters as FAILED when an unrecoverable error occurs during production — for example, when a PDF is corrupted, an address is invalid, the letter has > 5 pages — and that it reports this back to NHS Notify clearly with failure reasons and codes.

**Business outcome:**
Your system reliably records production failures by updating the letter status to FAILED, including a failure code, reason, and timestamp.
This ensures that Notify is aware of any items that could not be completed and can take appropriate action or monitoring steps.

**Preconditions:**

- Letters retrieved via GET /letters
- Eligible statuses:
  - ACCEPTED
  - PRINTED
  - ENCLOSED
  - FORWARDED
- **Trigger conditions:**
  - Structural validation failures (e.g., corrupted PDF, invalid address)

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objective:**

Demonstrate that your system:

- Detects and logs production failures
- Updates affected letters to FAILED, including a code and a reason for failure
- Records failure codes and reasons consistently
- Communicates these to NHS Notify for transparency and incident reporting

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify the letters that failed production requirements<br>2. Send a PATCH /letters/{id} request to update targeted letters to FAILED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to FAILED. |
| **Acceptance** | - All targeted letters are successfully updated to FAILED<br>- API response confirms successful updates<br>- Failure code and failure reason are updated. |
| **Evidence** | API logs showing state transitions, timestamps. |
| **Business value** | Provides transparent incident reporting by informing of the reason why the letter cannot be processed. |

### AT13 – Reject invalid letters

This test verifies that your system can detect and reject malformed letters (i.e: unrecognised specification id, missing PDFs etc) before they reach production by updating their status to REJECTED and providing appropriate reason codes and audit details.

**Business outcome:**
Invalid, malformed, or non-compliant letters are accurately identified and rejected early in the workflow.
The rejection is logged with detailed diagnostic information and reported to NHS Notify, ensuring no non-compliant content enters production or consumes supplier quotas.

**Preconditions:**

- Letters retrieved via GET /letters
- Found in PENDING status before the letters are accepted by you
- **Trigger conditions:**
  - Structural validation failures (e.g., invalid PDF, missing metadata)
  - Policy violations (e.g., prohibited templates, invalid addresses)

**Endpoints:**

- PATCH /letters/{id} to update the status of the letter
- POST /letters for bulk status updates
- GET /letters/{id} to verify that the status updated

**Objective:**

Demonstrate that your system correctly:

- Identifies non-compliant or invalid letters
- Updates their status to REJECTED, including a code and a reason for rejection
- Records the reason and reason code
- Ensures NHS Notify is informed when a rejection occurs due to quota or compliance limits

| Criteria | Description |
|---|---|
| **Steps** | 1. Identify bad letter requests<br>2. Send a PATCH /letters/{id} request to update targeted letters to REJECTED or send a POST /letters for a bulk update<br>3. Verify via GET /letters/{id} that status updated to REJECTED. |
| **Acceptance** | - All targeted letters are successfully updated to REJECTED<br>- API response confirms successful updates<br>- Rejected code and rejected reason are updated. |
| **Evidence** | API logs showing state transitions, timestamps. |
| **Business value** | Ensures non-compliant inputs don't enter production.<br>Ensure NHS Notify is informed when supplier quotas are exhausted |

### AT14 – Submit and reconcile management information (MI)

**Business outcome:**
Your MI submissions accurately match the letters you've processed.

**Endpoints:**

- POST /mi

**What this test proves:**
That you can submit MI data in the correct format and confirm it's recorded correctly.

| Criteria | Description |
|---|---|
| **Steps** | - Submit MI for a known number of processed letters. The MI should be grouped by specification and group ID<br>- Reconcile counts and timestamps with your local records. |
| **Acceptance** | - MI entries appear in NHS Notify within expected timeframe<br>- Counts match processed letters <br>- No duplicates MI entries for the same date or missing records. |
| **Evidence** | MI payloads and responses. |
| **Business value** | Shows that operational and billing data are aligned and complete. |

### AT15 – Performance testing - Retrieve letter list, letter specifications and PDFs

Validate that your system can efficiently retrieve a high volume of allocated letters, their specifications, and associated PDFs within strict performance limits.

**Business outcome:**
Your system can retrieve in <=10 secs, 2,500 allocated letters, their specifications, and all associated PDFs.

**Preconditions:**

- Supplier's INT tenant seeded with 2,500 letters
- Supplier API credentials active for the INT environment
- PDF size assumption: average 100 KB per PDF

**Endpoints:**

- GET /letters — Retrieve allocated letter list
- GET /letters/{id}/data — download the print-ready PDF via signed URL (expires after ~1 minute)

**Objective of this Test:**

To confirm that your system can within <=10 seconds:

- Retrieve all letter metadata and specifications and download all associated PDFs

| Criteria | Description |
|---|---|
| **Steps** | 1. Retrieve letter list via GET /letters?limit=500<br>2. Mark the letters as accepted via POST /letters batch update<br>3. Download each letter's PDFs via GET /letters/{id}/data (signed URL expires after ~1 minute)<br>4. Check that file contents are complete <br>5. Fetch the remaining letters following steps 1-4 until no letters remain in the queue.<br><br>Execute the full flow three times and record the best result. |
| **Acceptance** | - 100% of PDFs downloaded successfully and verified<br>- All data retrieved within <=10 seconds under normal test load<br>- Complete test three times and record the best result. |
| **Evidence** | - Download logs with timestamps and total elapsed time. |
| **Business value** | Confirms your system can retrieve all required data for daily letter production quickly and reliably, meeting NHS Notify operational performance expectations and ensuring no printing delays. |

## Evidence Submission

You must provide the following evidence to support completion of integration testing:

- **API call logs** – e.g. exported from Postman
- **Screenshots of response payloads** – demonstrating successful API calls
- **Performance logs** – to confirm load handling and throughput

## Completion Criteria

To progress to production, the following criteria must be met:

- All mandatory tests are completed
- All required evidence is submitted and reviewed by the NHS Notify Supplier API team
- All issues have a resolution in place or have a mutually agreed mitigation in place

Once you pass this stage, we'll confirm your readiness for going live.

## Appendix

Possible Scenarios and Applicable Letter Statuses

| Scenario | Description | Typical Status flow |
|---|---|---|
| Standard print and delivery | Letter specification successfully provided, letter printed, dispatch and delivered to patient. | a) PENDING → ACCEPTED → PRINTED → ENCLOSED → DISPATCHED → DELIVERED<br>b) PENDING → ACCEPTED → PRINTED → DISPATCHED → DELIVERED<br>c) PENDING → ACCEPTED → ENCLOSED → DISPATCHED → DELIVERED<br>d) PENDING → ACCEPTED → DISPATCHED |
| Letter rejected by letter Supplier | Letter fails validation before acceptance by the letter supplier. | PENDING → REJECTED |
| Cancelled by client | Client cancels production before dispatched. | a) PENDING → ACCEPTED → CANCELLED<br>b) PENDING → ACCEPTED → PRINTED → CANCELLED<br>c) PENDING → ACCEPTED → PRINTED → ENCLOSED → CANCELLED |
| Production failure | Technical or system error events during the processing cycle. | a) PENDING → ACCEPTED → FAILED<br>b) PENDING → ACCEPTED → PRINTED → FAILED<br>c) PENDING → ACCEPTED → PRINTED → ENCLOSED → FAILED |
| Forward for accessible format | Letter sent to an alternative supplier (e.g., RNIB) for accessible format such as braille or large print. | PENDING → ACCEPTED → FORWARDED |
| Returned to production facility | Letter dispatched but returned by the postal partner. | a) PENDING → ACCEPTED → PRINTED → ENCLOSED → DISPATCHED → RETURNED (letter undeliverable)<br>b) PENDING → ACCEPTED → PRINTED → ENCLOSED → DISPATCHED → DELIVERED → RETURNED |

PRINTED, ENCLOSED and DELIVERED are optional statuses. Suppliers that do not support these can directly progress from ACCEPTED to DISPATCHED.
