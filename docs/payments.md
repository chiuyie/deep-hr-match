# Payments

Deep HR Match uses **Stripe Checkout** (test mode) for candidate profile unlocks.

## Business Model

| Action | Cost |
|--------|------|
| Job posting | Free |
| Matching generation | Free |
| Unlock candidate profile | **$49.00 USD** per candidate |

Constants in `lib/matching/engine.ts`:

```typescript
UNLOCK_PRICE_CENTS = 4900
UNLOCK_CURRENCY = "usd"
```

## Checkout Flow

```
Employer selects candidates on matching page
        ↓
createUnlockCheckout(jobId, candidateIds[])
        ↓
INSERT payments (status: pending)
        ↓
stripe.checkout.sessions.create(...)
        ↓
Redirect to Stripe Checkout
        ↓
Payment succeeds
        ↓
POST /api/stripe/webhook (checkout.session.completed)
        ↓
UPDATE payments → paid
INSERT unlocks (one per candidate)
        ↓
Redirect to /employer/jobs/{jobId}/unlocked?session_id=...
```

## Server Action: `createUnlockCheckout`

**File:** `lib/employer/actions.ts`

1. `requireRole("employer")`
2. Verify job ownership
3. Calculate `amount = UNLOCK_PRICE_CENTS × candidateIds.length`
4. Insert `payments` row:
   - `status: pending`
   - `selected_candidate_ids: candidateIds`
   - `payment_type: candidate_profile_unlock`
5. Create Stripe Checkout Session:
   - `mode: "payment"`
   - `success_url`: `/employer/jobs/{jobId}/unlocked?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/employer/jobs/{jobId}/matching`
   - `metadata`: `payment_id`, `employer_id`, `job_id`, `candidate_ids` (comma-separated)
6. Update `payments.stripe_session_id`
7. `redirect(checkoutUrl)`

## Webhook Handler

**File:** `app/api/stripe/webhook/route.ts`

### Verification

```typescript
getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
```

Returns 400 if signature missing or invalid.

### `checkout.session.completed`

1. Extract metadata: `payment_id`, `employer_id`, `job_id`, `candidate_ids`
2. Use **service role** Supabase client (bypasses RLS)
3. Update `payments`:
   - `status: paid`
   - `paid_at: now`
   - `stripe_session_id: session.id`
4. Upsert `unlocks` — one row per candidate ID:
   ```typescript
   { employer_id, job_id, candidate_id, payment_id }
   ```
   Conflict on `(employer_id, job_id, candidate_id)` — ignore duplicates

Returns `{ received: true }`.

## Stripe Client

**File:** `lib/stripe/client.ts`

```typescript
getStripe()    // new Stripe(STRIPE_SECRET_KEY)
getAppUrl()    // NEXT_PUBLIC_APP_URL ?? http://localhost:3000
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification (`whsec_...`) |
| `NEXT_PUBLIC_APP_URL` | Success/cancel redirect URLs |

## Local Testing

### 1. Start webhook forwarder

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 2. Test card

Use [Stripe test cards](https://docs.stripe.com/testing#cards):

```
4242 4242 4242 4242
Any future expiry, any CVC
```

### 3. Verify

- [ ] Checkout session opens from matching results table
- [ ] Payment completes
- [ ] Webhook logs `checkout.session.completed`
- [ ] `payments.status` = `paid`
- [ ] `unlocks` rows created
- [ ] Employer sees full candidate PII on unlocked page

## Production Setup

1. Create Stripe webhook endpoint: `https://your-domain.com/api/stripe/webhook`
2. Subscribe to `checkout.session.completed`
3. Set `STRIPE_WEBHOOK_SECRET` in Vercel env vars
4. Use live keys only in production (never commit)

## Database Tables

### `payments`

Tracks checkout sessions and payment status. Visible to employer (own) and admin.

### `unlocks`

Authoritative record for PII access. Checked by `hasCandidateUnlock()` before revealing candidate details.

## Security Notes

- Webhook uses service role — endpoint must verify Stripe signature
- Never trust client-side payment success alone — always wait for webhook
- `payment_id` in metadata links Stripe session back to app record

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Checkout doesn't open | `STRIPE_SECRET_KEY` set; candidates selected |
| Payment succeeds but no unlock | Webhook not forwarded; check `STRIPE_WEBHOOK_SECRET` |
| 400 on webhook | Signature mismatch — use secret from `stripe listen` |
| Duplicate unlocks | Upsert ignores duplicates on unique constraint |
