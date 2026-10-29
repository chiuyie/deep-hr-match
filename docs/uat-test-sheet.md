# UAT test sheet

**Build:** branch `uat`, commit `13e1579`  
**Host:** the environment pointed at `uat`. `main` stays as it is until this branch is reviewed.  
**Last written:** 21 October 2026

## Rules for this pass

**Payments.** The app running on this machine is in **Stripe test mode**. Unlock opens Stripe Checkout and charges nothing until a test card is paid and the webhook marks the payment paid. Test card: `4242 4242 4242 4242`. The webhook listener is `npm run stripe:listen`. Mock mode (`PAYMENTS_MODE=mock`) skips Checkout and records the same **S$10** unlock immediately. Use mock only for a no-charge smoke pass. Use the Stripe test path for the payment pass.

**Email.** Demo accounts ending in `@deephrmatch.test` are created already confirmed, so they can sign in immediately. A brand-new sign-up follows the Supabase Auth “Confirm email” setting. If that setting is on, open the confirmation email before the first sign-in. If it is off, sign-in works as soon as the account exists.

**Match result.** A person appears only when they are ready for matching and pass every active filter. A blank on an active filter removes them. The score and the rank are the 7^7 score only. The list keeps the top 25.

**Tell testers before they start.** Salary, skills, years, and education do not change the score. Dialect is separate from languages. The 7^7 words may still be the placeholder set. Gender **Other** is a real filter value. **Mandarin** and **Mandarin Chinese** count as the same language.

## Accounts

Demo password after `npm run reseed-complete-demo-data` or `npm run seed-dummy-users`: `DemoUser123!` unless `DUMMY_USER_PASSWORD` overrides it.

| Role | Email |
|------|--------|
| Employer | `employer-demo-1@deephrmatch.test` |
| Candidate | `candidate-demo-1@deephrmatch.test` |
| Admin | the `ADMIN_EMAIL` already set for `npm run create-admin` |

## Candidate

- [ ] Sign up as a candidate, or sign in as `candidate-demo-1`.
- [ ] Profile reaches at least 60%.
- [ ] CV upload is stored.
- [ ] All 7 factors can be completed. The card says to check matching status, and **Check matching status** opens that page.
- [ ] Consent is submitted. Status becomes ready for matching.
- [ ] Sign-in says **Sign in**, and the account type is chosen before the form.

## Employer

- [ ] Sign up as an employer, or sign in as `employer-demo-1`.
- [ ] Create or open a job, set at least one filter, and complete the 7^7 answers.
- [ ] Generate matches. The list is anonymous and at most 25 people.
- [ ] A candidate who fails a filter, or leaves that filter blank, is absent.
- [ ] Unlock one candidate. Mock mode shows name, contact, and CV and records S$10 with no charge.

## Admin

- [ ] Admin sign-in is only at `/auth/admin/sign-in`.
- [ ] Candidates, employers, jobs, and the 7^7 editor open.

## Filter checks

- [ ] Gender **Other** matches a candidate who answered Other, and drops a blank.
- [ ] Nationalities to exclude drops that nationality and also drops a blank nationality.
- [ ] A job that needs Mandarin Chinese still includes a candidate stored as Mandarin.
- [ ] Accessibility Yes on the job does not remove candidates.

## Phone width

- [ ] Sign-up, sign-in, the 7-factor completion card, and the match list are usable at a phone width.

## Freeze

- [ ] Failures from this pass are fixed on `uat`.
- [ ] The branch is frozen for testers. `main` is updated only after review.
