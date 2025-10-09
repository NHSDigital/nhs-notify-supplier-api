---
title: Target Architecture
nav_order: 1
has_children: false
has_toc: false
parent: Architecture & Design
---

The target architecture for the NHS Notify Supplier API is represented below:

{% drawio path="assets/diagrams/target-architecture.drawio" page_number=0 height=800 %}

Letters are produced from external contexts, the primary use case being NHS Notify Core. These are received via event, consumed, and placed into the DynamoDB store as appropriate.

The API is accessed by an API Management Platform proxy that targets and AWS backend through API Gateway.

Lambdas act as request handlers, manipulating Dynamo DB data stores and issuing responses back to the proxy.

Database event streams are used to issue updates out of the Supplier API context via event production.
