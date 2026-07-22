# Security policy

Ashborn is a security-analysis tool, so reports about it are taken seriously.

## Reporting a vulnerability

Please report suspected vulnerabilities **privately** — not in a public issue:

- Open the repository's **Security** tab and choose **Report a vulnerability**
  (GitHub private vulnerability reporting), or
- if that is unavailable, contact the maintainer through their GitHub profile.

Include the affected package and version (`ashborn --version`), a description, and
a minimal reproduction if you have one. Expect an acknowledgement within a few
days. Please allow a reasonable window to release a fix before public disclosure.

## Scope

The published packages (`@ashborn-sec/core`, `@ashborn-sec/bench`,
`@ashborn-sec/cli`) run offline and deterministically: they make no network calls
and read only committed fixtures. Reports concerning the analysis logic, the
published packages, or the build and release pipeline are all in scope.

## Supported versions

While the project is pre-1.0, only the latest published `0.x` release is
supported.
