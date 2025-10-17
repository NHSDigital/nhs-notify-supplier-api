---
layout: page
---

<!-- markdownlint-disable MD041 -->

<dl>
  <dt>Repository</dt>
  <dd><a href="https://github.com/NHSDigital/{{page.repo-name}}">https://github.com/NHSDigital/{{page.repo-name}}</a></dd>

<dt>Owners</dt>
{% for owner in page.owners %}
    <dd> <a href="http://github.com/{{owner}}">{{owner}}</a> </dd>
{% endfor %}
</dl>

{{ content }}

{% include notify-repo-list.html %}

<!-- markdownlint-enable MD041 -->
