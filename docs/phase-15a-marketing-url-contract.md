# Phase 15A — Marketing URL contract (application-side)

Website V2 must link to these **app.signalcare.io** routes. Do not modify Website V2 from this repository.

## Canonical entry

| Intent | URL |
| --- | --- |
| New clinic owner signup | https://app.signalcare.io/auth/signup |
| Signup with Clinic 100 hint | https://app.signalcare.io/auth/signup?plan=clinic_100 |
| Signup with Clinic 200 hint | https://app.signalcare.io/auth/signup?plan=clinic_200 |
| Enterprise | Do **not** self-activate — route to contact/demo; `?plan=enterprise` shows contact handoff |
| Sign in | https://app.signalcare.io/auth/signin |

## Notes

- `plan` is a **hint** only; the API validates against `clinic_100` / `clinic_200`.
- Invalid plans default to `clinic_100`.
- Staff continue to join via invitation acceptance — not public signup.
- Stripe checkout is **not** part of Phase 15A.
