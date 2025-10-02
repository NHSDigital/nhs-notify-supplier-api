---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: page
title: NHS Notify Repositories
nav_order: 2
description: A list of NHS Notify related repositories
summary: NHS Notify Repositories
is_not_draft: false
last_modified_date: 2025-010-02
owner: NHS Notify
author: Mark Slowey
---
<!-- vale off -->
{% for repo in site.notify-repos %}

- ### {{ repo.name }}

  [{{ repo.link }}]({{ repo.link }})
  {{ repo.content }}
{% endfor %}
<!-- vale on -->
