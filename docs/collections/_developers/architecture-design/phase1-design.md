---
title: Phase 1 Design
nav_order: 2
has_children: false
has_toc: false
parent: Architecture & Design
---

The phase 1 design looks to implement the core API + Backend architecture and the event infrastructure for receiving letter requests and issuing updates.

The below diagram implements the implemented components. The logic for letter allocation outside the Supplier API context is not expanded upon:

{% drawio path="assets/diagrams/phase1-design.drawio" page_number=0 height=800 %}
