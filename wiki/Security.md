# Security

Key measures implemented:
- Rate limiting per endpoint type
- Input validation and sanitization (Zod, DOMPurify)
- CSRF protection for mutating routes
- Security headers (HSTS, X-Frame-Options, etc.)
- Audit logging of security events
- Secrets management and rotation guidance
- Vulnerability scanning (npm audit/Snyk, Trivy)

## Env variables
See [Environment Variables](Environment-Variables) for encryption keys and tokens.

## Nginx hardening (prod)
Example snippets in `SECURITY_GUIDE.md` for rate limiting and headers.

## Incident response
- Alerts, logging, and procedures are documented in `SECURITY_GUIDE.md`.

Keep dependencies up to date and rotate credentials regularly.