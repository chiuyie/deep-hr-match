# Deep HR Match — product processes

**Audience:** product, operations, support, and anyone maintaining Confluence  
**Last checked:** 12 October 2026  
**Status:** current product behaviour

This page describes how the product works for candidates, employers, and admins. It is the page to paste into Confluence. The engineering copy of the matching rules lives in the repository at `docs/matching-engine.md`.

---

## 1. What the product does

Deep HR Match connects candidates and employers in two steps.

1. **Filters decide who can appear** on a job’s match list.
2. **The 7^7 matching language decides the score and the rank** among the people who passed those filters.

Posting a job and generating matches are free. Seeing a candidate’s name, contact details, and CV costs **S$49** per candidate.

There are three portals: candidate, employer, and admin. A person signs in to the portal that matches their account.

---

## 2. Accounts

| Who | How they join | Where they land |
|-----|----------------|-----------------|
| Candidate | Sign up on the candidate portal | Profile, to start onboarding |
| Employer | Sign up on the employer portal | Employer home |
| Admin | Created by the team. No public sign-up | Admin home |

Signing in on the wrong portal does not switch the account’s role. Admins use the admin sign-in only.

Email and password are the sign-in method. If email confirmation is turned on, the person confirms their email before they can continue.

---

## 3. Candidate process

A candidate is not matchable until they finish onboarding and give consent.

### 3.1 Onboarding order

| Step | What they do | Done when |
|------|----------------|-----------|
| 1. Profile | Fill in the profile | Profile is at least 60% complete |
| 2. CV | Upload a CV | A CV file is stored |
| 3. 7^7 matching language | Answer the same word framework the employer uses | The matrix is submitted |
| 4. Consent | Confirm they agree to be matched | They submit the ready step |

After that, their status becomes **ready for matching**. Until then, no job can include them.

They can return later and update most of the profile. These four fields lock after the first save: **full name, email, gender, and date of birth**.

### 3.2 What they are asked, and what it is for

| Section | Used for |
|---------|----------|
| About you: name, email, phone, date of birth, gender, country, city, address, languages | Contact and identity. Country, city, languages, gender, and date of birth can remove them from a job. Contact details stay hidden until an employer pays to unlock. |
| Experience timelines and certificates | Shown on the unlocked profile. Skills, years, and education are taken from the timelines. They do **not** change the match score. |
| Current and expected salary | Shown on the unlocked profile. They do **not** change the match score. |
| Job preferences: work arrangement, availability | Filters, when the employer sets them. |
| Nice to have: desired titles, preferred locations, employment type | Shown after unlock. They do **not** filter and do **not** change the score. |
| Matching details: work pass, nationality, ethnicity, birth country, date they started living in the current country, dialect | Filters, when the employer sets them. Time in the country is calculated from that start date and moves forward on its own. |
| Only if the role needs it: religion, height, weight, fitness | Filters, when the employer sets them. This block starts closed. |
| Role yes/no questions: overtime, hours, weekends, licence, vehicle, travel, relocate, background check, accessibility needs | The first eight can remove the candidate when the employer says the role requires that thing. Accessibility is stored and is **not** a filter. |
| 7^7 answers | The only input to the match score. |

**Age** is not a separate question. If an employer filters by age band, the band is calculated from the date of birth.

**Country and city** use a fixed list: Singapore, Malaysia, China, India, Indonesia, Philippines, Thailand, Vietnam, and Others; cities are Singapore, Kuala Lumpur, Penang, Johor Bahru, Jakarta, Bangkok, Manila, Ho Chi Minh, and Others. A place that is not on the list counts as **Others**.

### 3.3 Blank answers

If an employer turns a filter on and the candidate left that answer blank, the candidate **does not appear** on that job. A blank is not a low score. They are not scored for that job at all.

Filling in more optional fields does not raise the score. It only matters when the employer actually filtered on that field, and then it only decides in or out.

---

## 4. Employer process

### 4.1 Set up

The employer completes an employer profile (organisation and contact person). That profile is not the match score.

### 4.2 Create and post a job

| Stage | What the employer can do |
|-------|---------------------------|
| Draft | Edit the job, filters, role questions, and 7^7 answers. Matching has not run. |
| Posted (active) | The job is frozen. The first match list is created automatically. |
| Closed | No new matches. The last list can still be viewed. |

A posted job cannot be edited. If the requirements change, the employer creates a new job. That keeps each match list tied to one definition of the role.

The job needs 7^7 answers before a match list can be built. Without them, matching does not invent a score.

### 4.3 What the employer sets on a job

| Part of the job | Effect |
|-----------------|--------|
| Role basics, description, schedule, team, salary budget, benefits | Describe the job. They do not score candidates. |
| Matching filters | Each one the employer sets is a hard gate. **No preference** turns that gate off. |
| Role yes/no questions | A **Yes** means the candidate must also have answered Yes. A **No** does not remove anyone. |
| Accessibility question | Recorded on the role only. It does not remove candidates. |
| 7^7 answers | The ideal matching language for the role. This is the score. |

Filters the employer can set:

- Availability (Immediate, 1 week, 2 weeks, 1 month, 2 months, 3+ months)
- Age band
- Work pass
- Ethnicity, gender, religion
- Birth country, current country, current city
- Minimum time in the current country
- Dialect
- Height, weight, fitness
- Nationality, and a nationality to exclude
- Work arrangement (on-site, hybrid, fully remote, flexible)
- Languages the candidate must have

Availability means “available in that time **or sooner**”. Time in the country means “at least this long”. Languages must all be present; fluency is not compared. Every other filter is an exact match. **Others** on country or city means “not one of the named places”, which is still a real filter.

### 4.4 Match list

1. Take every candidate who is **ready for matching**.
2. Remove anyone who fails a filter the employer turned on.
3. Score the people who remain using 7^7 only.
4. Sort from highest score to lowest.
5. Save the **top 25**.

The list is a snapshot. It does not update by itself. New candidates who join later stay off the list until the employer clicks **Refresh matches**. Refresh is free. It replaces the list. It does not cancel unlocks the employer already paid for.

The employer sees an anonymous list: a score, a rank, and the 7^7 comparison. Name, email, phone, address, and CV stay hidden.

### 4.5 Unlock

The employer selects one or more people from the list and pays **S$49 each**.

| Environment | What happens |
|-------------|----------------|
| Live payments | Stripe Checkout. PayNow and card, in Singapore dollars. |
| Test / UAT | The unlock can complete without a real charge, and the same S$49 is still recorded. |

After payment, that employer can see the full profile and CV for that candidate on that job. The unlock stays even if a later refresh drops the person from the top 25.

### 4.6 Close a job

Closing stops new match runs. The last snapshot remains readable. Unlocks already paid for remain available.

---

## 5. How to read a match score

The number is the share of 7^7 answers that are the same, weighted equally across the factors both sides answered. It is a percentage from 0 to 100.

| Score | Label on the report |
|-------|---------------------|
| 80–100 | Strong fit |
| 50–79 | Mixed fit |
| 0–49 | Weak fit |

The label is only a reading of that number. These do **not** move it:

- Salary
- Skills, years of experience, or education
- Desired job titles or preferred locations
- How many extra profile fields the candidate filled in

Two people who passed the same filters and gave the same 7^7 answers receive the same score. The person with the longer profile does not rank higher because of that.

### Worked examples

**Filtered out, no score.** The job requires current country Singapore and availability within 2 weeks. The candidate lives in Japan and can start immediately. Japan counts as Others, so they fail the country filter. They do not appear, even though their availability would have passed.

**Same score.** Two candidates both pass every filter the employer set. Both chose the same 7^7 words. One also filled in salary, dialect, and height. Both receive the same score. Salary, dialect, and height do not add marks. Dialect and height would only have mattered if the employer had filtered on them.

**Blank filter.** The job requires a work pass of Employment Pass. The candidate left work pass empty. They do not appear. They do not receive a reduced score.

**Sooner availability passes.** The job needs someone within 1 month. A candidate who can start in 1 week stays in. A candidate who needs 3+ months is removed.

---

## 6. Admin process

Admins can review candidates, employers, jobs, match results, payments, unlocks, and uploaded files. They maintain the 7^7 word framework that both candidates and employers answer.

Changing that framework changes the questions future people answer. Existing saved answers can stop lining up with the new words, so a framework change should be treated as a product change, not a quiet edit.

---

## 7. Decisions to keep stable

| Decision | Why it is set this way |
|----------|------------------------|
| Filters remove people before scoring | A person who fails a requirement the employer set should not show up as a weaker match. They should not show up. |
| A blank on an active filter removes the person | An unknown answer is not evidence they match. |
| The score is only 7^7 | The product’s ranking signal is the shared matching language. Profile detail is for the unlocked profile, not for extra points. |
| Posted jobs are frozen | The match list must stay attached to the job definition that produced it. |
| Match lists refresh only when the employer asks | Employers should see a stable shortlist, then choose when to rebuild it. |
| Accessibility is not a filter | The employer question describes the role. It does not mean the candidate must say they need arrangements. |
| Country and city share one list, and anything else is Others | Employer and candidate have to be compared on the same words. |
| Age comes from date of birth | Candidates should not be asked for an age band as well as a date of birth. |
| Unlock is S$49 and survives a refresh | Payment is for access to that person on that job, not for a place in the current top 25. |

---

## 8. What this page does not cover

- Screen-by-screen field layout and mobile behaviour
- How the engineering tests are run
- How to deploy or configure Stripe and the database

Those stay in the repository documentation.
