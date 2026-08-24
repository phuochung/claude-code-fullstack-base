# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for anything security-sensitive. Use
GitHub's private vulnerability reporting instead: the **Security** tab of this
repository → **Report a vulnerability**. Reports go only to the maintainers,
and you'll get a response there.

Include what you'd want to receive yourself: the affected file or endpoint, a
reproduction, and your assessment of the impact.

## Scope

This is a starter template, so two kinds of findings matter here:

- **Flaws in the template's own code** — the auth flows, guards, rate limiting,
  error-alerting pipeline, and upload handling that every downstream product
  inherits. These are always in scope.
- **Insecure defaults or missing fail-safes** — anything a fork could deploy
  without realising it is exposed. The backend already refuses to start in
  production on guessable secrets or a missing CORS list; gaps of that kind
  are in scope too.

Misconfiguration of an individual deployment (weak secrets a deployer typed by
hand, a missing `TRUST_PROXY` update behind a new load balancer) is that
deployment's responsibility — but if the template made the mistake easy, we
want to hear about it.

## Supported versions

The `main` branch. The template has no versioned releases; fixes land on
`main`.

## If you forked this template

This policy covers the template repository only. Replace this file with your
own product's reporting channel — a fork inheriting this file unchanged points
your users' security reports at the wrong project.
