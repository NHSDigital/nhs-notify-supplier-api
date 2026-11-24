# Phase 1 overview: diagram review

This compares [Phase 1 Overview.drawio](Phase%201%20Overview.drawio) with the
Supplier API Terraform and application code in this repository. It describes
the architecture defined by the current checkout, not a verified live AWS
deployment. Environment-specific settings, deployed versions and resources
owned by other services may differ.

The broad shape is still useful: EventSub fans out to the allocator, supplier
config ingress and letter updates; the letters and MI tables feed Kinesis
streams and outbound event transformers; and suppliers access the API through
APIM. The changes below are targeted corrections, not a recommendation to
redraw everything.

## Corrections to the diagram

### 1. Authorizer uses a separate suppliers table

The diagram connects **Authorizer** to **Supplier Config**. It actually queries
the separate **Suppliers** DynamoDB table, using the `supplier-apim-index` to
resolve the APIM identity. Supplier configuration is used by the allocator.

**Update:** Add a Suppliers table and connect Authorizer to it; remove the
Authorizer-to-Supplier Config connection.

Evidence: [authorizer Terraform](../../../infrastructure/terraform/components/api/module_authorizer_lambda.tf),
[Suppliers table](../../../infrastructure/terraform/components/api/ddb_table_suppliers.tf),
[authorizer behaviour](../../../lambdas/authorizer/README.md).

### 2. Add the allocator's quota and idempotency stores

The diagram shows the allocator reading Supplier Config, but omits the
**Supplier Quotas** table and the shared **Idempotency** table. The allocator
reads and updates quotas when allocating letters, and both the allocator and
`upsert-letter` use the idempotency table.

**Update:** Add both DynamoDB tables. Connect Supplier Quotas to the allocator
for reads and writes, and Idempotency to the allocator and `upsert-letter`.

Evidence: [allocator Terraform](../../../infrastructure/terraform/components/api/module_lambda_supplier_allocator.tf),
[allocator behaviour](../../../lambdas/supplier-allocator/README.md),
[upsert Terraform](../../../infrastructure/terraform/components/api/module_lambda_upsert_letter.tf),
[allocator idempotency code](../../../lambdas/supplier-allocator/src/handler/allocate-handler.ts).

### 3. Correct the incoming letter event label

The arrow from **Letter Preparation** is labelled “Letter Allocated to
Supplier”, but the Supplier API subscription selects
`letter-request.prepared` events and the allocator chooses the supplier
afterwards.

**Update:** Label this as a prepared letter request, with allocation occurring
inside Supplier API. The subscription also filters by configured event source.

Evidence: [allocator subscription filter](../../../infrastructure/terraform/components/api/sns_topic_subscription_eventsub_sqs_supplier_allocator.tf),
[allocator behaviour](../../../lambdas/supplier-allocator/README.md).

### 4. Correct the status amendment queue and lookup

`post-letters` and `patch-letter` send to **amendments_queue**, not the
diagram's **supplier-requests-queue**. The amendment transformer also reads the
current letter from **Letters** before publishing a status event to EventSub;
that read is not shown.

**Update:** Rename the queue to `amendments_queue` (or “amendments queue”) and
add the transformer-to-Letters read. Preserve the existing
transformer → EventSub → letter-updates queue → upsert path. If showing
transitional resources, also add the old **letter_status_updates_queue**, which
still triggers the transformer while it drains; do not show it as the normal
destination of new API requests.

Evidence: [POST configuration](../../../infrastructure/terraform/components/api/module_lambda_post_letters.tf),
[PATCH configuration](../../../infrastructure/terraform/components/api/module_lambda_patch_letter.tf),
[transformer implementation](../../../lambdas/api-handler/src/handlers/amendment-event-transformer.ts),
[legacy queue](../../../infrastructure/terraform/components/api/module_sqs_letter_status_updates.tf),
[legacy event source mapping](../../../infrastructure/terraform/components/api/lambda_event_source_mapping_letter_status_update.tf).

### 5. Fix the queue projection's AWS icon

The diagram depicts **update-letter-queue** with an SQS icon, although it is a
Lambda. It consumes the letters Kinesis stream and maintains the pending-letter
DynamoDB table.

**Update:** Replace its icon with Lambda; keep the stream → Lambda → Letter
Queue connections. `list-letters` represents the `get_letters` Lambda.

Evidence: [Lambda Terraform](../../../infrastructure/terraform/components/api/module_lambda_update_letter_queue.tf),
[stream mapping](../../../infrastructure/terraform/components/api/event_source_mapping_update_letter_queue.tf),
[projection behaviour](../../../lambdas/update-letter-queue/README.md),
[GET letters Terraform](../../../infrastructure/terraform/components/api/module_lambda_get_letters.tf).

### 6. Correct MI labels

The diagram calls the MI submission Lambda **put-mi**, but the deployed
integration is `POST /mi` → `post_mi`. Its outbound transformer is named
`mi-updates-transformer`, rather than `mi-event-transformer`.

**Update:** Rename the two MI components. Keep the `get_status` health-check
handler out of scope for this diagram.

Evidence: [API integration template](../../../infrastructure/terraform/components/api/resources/spec.tmpl.json),
[POST MI Lambda](../../../infrastructure/terraform/components/api/module_lambda_post_mi.tf),
[MI transformer](../../../infrastructure/terraform/components/api/module_lambda_mi_updates_transformer.tf).

## Optional detail and boundaries

- **API security:** The custom API Gateway domain uses mutual TLS with an S3
  truststore and an ACM certificate. Add these if the diagram is intended to
  show the security boundary, rather than only application flow.
  Evidence: [API domain](../../../infrastructure/terraform/components/api/api_gateway_domain.tf).
- **Mock supplier:** An optional EventBridge Scheduler invokes a supplier-mock
  Lambda; deployment and enabling are separately controlled and both default
  to false. Show it as optional if test infrastructure is included.
  Evidence: [schedule](../../../infrastructure/terraform/components/api/scheduler_schedule_supplier_mock.tf),
  [variables](../../../infrastructure/terraform/components/api/variables.tf),
  [mock behaviour](../../../lambdas/supplier-mock/README.md).
- **Operations:** CloudWatch logging, alarms and shared log destinations, KMS,
  DNS and certificates are mostly omitted. These can be grouped rather than
  adding every supporting resource to an overview.
  Evidence: [alarm targets](../../../infrastructure/terraform/components/api/locals_alarms.tf),
  [API access logging](../../../infrastructure/terraform/components/api/cloudwatch_log_group_api_gateway_access.tf),
  [KMS](../../../infrastructure/terraform/components/api/module_kms.tf),
  [DNS](../../../infrastructure/terraform/components/api/route53_record.tf).
- **Other services:** The diagram's Core, Digital Letters, Supplier Config,
  shared EventBridge buses and Reporting internals are outside this repository's
  direct ownership. The Supplier API configures a shared EventPub module with
  bus ARNs, but this checkout alone does not establish all external routing,
  consumers or resources. Confirm those against their owning repositories or
  deployed environment before changing their internals.
  Evidence: [EventPub module configuration](../../../infrastructure/terraform/components/api/modules_eventpub.tf),
  [EventSub topic policy](../../../infrastructure/terraform/modules/eventsub/sns_topic_policy.tf).

## AWS references

- [DynamoDB streaming to Kinesis Data Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/kds.html)
- [Amazon SNS message filtering](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html)
