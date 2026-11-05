# Apex AI

A responsive architectural climate-systems site with a procedural Three.js product study, GSAP camera hotspots, contractor revenue calculator, truthful service/review states, and server-side concierge, Cal.com routes.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The front end runs without credentials. Live appointment availability and booking are enabled only after the server-side integrations are configured. No secret belongs in client-side code or in Git.

## Production environment

Set values in the hosting provider's encrypted environment-variable settings. Do not commit `.env.local` or actual API keys.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Optional | Calls Groq's `openai/gpt-oss-120b` for brief conversational acknowledgements using sanitized turn/field labels and issue categories only; raw customer messages and contact/address details are not sent to the model. Friendly local replies work without this key. |
| `CAL_API_KEY` | Yes for booking | Cal.com API access for live availability and booking. |
| `CAL_EVENT_TYPE_ID` | One event selector required | Cal.com event type ID. Use this **or** configure the slug selector below. |
| `CAL_EVENT_TYPE_SLUG` | Alternative event selector | Use with `CAL_USERNAME` or `CAL_TEAM_SLUG`; optionally include `CAL_ORGANIZATION_SLUG`. |
| `CAL_USERNAME` | Conditional | Required with `CAL_EVENT_TYPE_SLUG` when using a personal event. |
| `CAL_TEAM_SLUG` | Conditional | Use with `CAL_EVENT_TYPE_SLUG` when using a team event. |
| `CAL_ORGANIZATION_SLUG` | Optional | Organization identifier for a Cal.com organization event. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical public site origin for metadata, e.g. `https://apex-ai-dispatch.onrender.com`. |

The live booking route verifies Cal.com availability immediately before creating a booking and requires only the configured Cal.com values. Cal.com handles attendee confirmation emails according to the event type's native settings.

## Backend routes

- `POST /api/concierge` — handles greetings and service questions without advancing intake, validates submitted details, and returns `accepted` plus a normalized `value` only for accepted answers. Natural replies include the next question in one message. Optional Groq acknowledgements receive sanitized labels/categories, not raw visitor messages.
- `GET /api/slots?start=YYYY-MM-DD&end=YYYY-MM-DD&timeZone=...` — returns live availability from Cal.com.
- `POST /api/book` — re-checks the selected slot and creates the Cal.com booking; Cal.com sends confirmations using the event's native email settings.

Each intake answer is validated by the app before it advances. The browser stores only accepted, normalized answers, and the visitor can review their name before confirming. Both chat and booking routes reject greeting-only names such as “Hi”; conversational introductions such as “Hi, I’m Jay Omilana” become “Jay Omilana.” The booking route sends that validated name to Cal.com as `attendee.name`, along with the `service-address` and `hvac-issue` custom fields. Booking data goes to Cal.com only, which handles native attendee confirmations.

Run `npm test` and `npm run typecheck` for local regression checks. Tests mock booking, availability, and model requests; they do not create real appointments or send emails.

## Render preview deployment

Deploy this Next.js application as a Render Web Service rather than a static site: the concierge, availability, and booking routes require a server runtime. Use Node.js 22, build command `npm ci && npm run build`, and start command `npm run start`. Set environment variables in Render's encrypted service settings; never commit `.env` or `.env.local`. Configure `NEXT_PUBLIC_SITE_URL` to the service's assigned HTTPS origin (the requested candidate is `https://apex-ai-dispatch.onrender.com`, subject to availability). The visitor chat has safe local fallback replies when `GROQ_API_KEY` is absent; live booking requires configured Cal.com values.
