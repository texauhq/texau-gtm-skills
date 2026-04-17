---
name: outreach-expert
version: 1.0.0
description: |
  Cold outreach strategist. Distills current best practice from Lemlist, Smartlead,
  Instantly, Reply.io, Woodpecker, and Apollo sequences into concrete decisions —
  sending infrastructure (warmup, SPF/DKIM/DMARC, tracking domains, inbox rotation),
  sequence design (cadence, timing, step count, break-up), deliverability (spam
  triggers, open-rate invalidation under Apple MPP, plain-text discipline), multi-channel
  orchestration (LinkedIn + email + voicemail drop), AI reply classification, and
  CAN-SPAM / GDPR / CASL compliance. Use whenever the user is planning, launching,
  or diagnosing a cold campaign. Proactively invoke on "write a sequence", "plan a
  campaign", "my emails go to spam", "warmup", "what subject line", "sending from
  a new domain", "pick a sending tool".
benefits-from: [texau-gtm, build-prospect-list, enrich-and-verify, list-hygiene, crm-sync-expert]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
  - AskUserQuestion
triggers:
  - write a sequence
  - plan a campaign
  - my emails go to spam
  - domain warmup
  - SPF DKIM DMARC
  - pick a sending tool
  - outreach cadence
  - cold email review
  - subject line help
  - compliance CAN-SPAM
---

# outreach-expert

An advisor, not an executor. This skill doesn't send email — it tells the user what to send, from where, at what cadence, and how to keep it out of spam.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — classify the ask

Outreach questions fall into one of six categories. Start by naming which one.

| Bucket | Typical user prompts |
|---|---|
| **Infrastructure** | "new domain", "warmup", "SPF/DKIM/DMARC", "dedicated IPs", "sending from my Google Workspace" |
| **Sequence design** | "write a cold sequence", "what cadence", "how many steps", "break-up email" |
| **Copy & personalization** | "review my email", "first-line personalization", "which subject line", "variables / merge tags" |
| **Deliverability diagnosis** | "my emails go to spam", "open rate dropped", "reply rate is zero", "bounces climbing" |
| **Tool selection** | "Lemlist vs Smartlead vs Instantly vs Reply.io", "what should I buy" |
| **Compliance** | "CAN-SPAM", "GDPR", "CASL", "unsubscribe", "physical address requirement" |

If the user is asking two things, answer the most load-bearing one first, then stack the others. Never dump everything you know in one reply.

## 1 — Sending infrastructure

The single highest-leverage thing a B2B outbound operator can get right. Bad infra = every other optimization wasted.

### Domain strategy

- **Never send cold from your primary domain.** A blocklist on `yourcompany.com` kills both cold outbound *and* support/sales replies on your warm domain.
- Buy **2–5 lookalike domains** per main brand (e.g. `trytexau.com`, `get-texau.com`, `texau.io`). Mix hyphens and TLDs. Point them at MX that lets you auth properly — Google Workspace and Outlook 365 are the practical choices.
- One sending mailbox = **30–50 cold sends per day maximum**, forever. Scale by adding mailboxes, never by cranking one.
- Warm up every new mailbox for **14–21 days** before the first real send. Lemlist, Smartlead, Instantly, Warmy, and Mailwarm all do automated warmup.

### Authentication — mandatory, not optional

Every sending domain needs all three:

- **SPF** — `v=spf1 include:_spf.google.com include:sendgrid.net ~all` (match your senders). Miss this → 60-80% inbox drop.
- **DKIM** — 2048-bit key, rotate annually. Both Google and Outlook publish DKIM automatically; verify with `dig txt google._domainkey.yourdomain.com`.
- **DMARC** — start at `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`. Monitor reports for 30 days, then move to `p=quarantine`. Never skip straight to `p=reject` on a live sending domain.
- **BIMI** (optional but rising) — requires DMARC at `p=quarantine` or stricter + VMC certificate ($1.5k/year). Adds your logo next to the From line in Gmail/Yahoo. Worth it for brand recall.

### Custom tracking domain

If your ESP uses shared click-tracking (Lemlist's `l.lemlist.com`, Instantly's `trk.instantly.ai`), your links inherit whatever blocklist state those subdomains are in. Buy a dedicated tracking CNAME (`click.yourdomain.com` → your ESP's target). All four tools above support it; Reply.io and Smartlead make it the most painless.

### Inbox rotation

If you need 200+ sends/day, you need **rotation** — distributing the day's sends across 5-10 mailboxes so no one mailbox exceeds safe volume. Smartlead and Instantly lead on this feature; Lemlist v2 has it; Reply.io supports it in higher plans.

## 2 — Sequence design

### Structure

The evidence-backed default for B2B cold:

```
Step 1 — Intro (day 0)
         Hook + why now + one soft CTA.
Step 2 — Value add (day 3–4)
         New angle: data point, resource, or question.
Step 3 — Social proof (day 7–8)
         Customer quote, case study, or logo.
Step 4 — Break-up (day 12–14)
         "Close the loop — should I stop following up?"
```

Anything past step 4 has diminishing returns for cold prospects. Longer sequences work for *warm* audiences (event attendees, content subscribers) — not strangers.

### Timing

- **Tue / Wed / Thu** inbox well. **Mon** morning drowns in weekend backlog. **Fri afternoon** vanishes.
- Send between **08:00–11:00 local to the recipient**. Most ESPs automate time-zone send-time optimization (Lemlist, Reply.io, Instantly).
- Never send weekends for B2B. Exceptions: creators, DTC, hospitality verticals.
- Avoid holidays and the week of major industry events in the target segment.

### Step-count vs reply-rate data

| Steps | Typical positive reply rate | Note |
|---|---|---|
| 1 | 0.8–1.5% | Undersells |
| 2 | 1.5–3% | Start here for high-ICP lists |
| 4 | 3–5% | Default for most B2B cold |
| 6+ | 4–6% | Diminishing returns; more unsubscribes, higher spam risk |

Source of truth: cross-referencing 2024–2025 public benchmarks from Lemlist State of Cold Email, Smartlead's deliverability reports, Reply.io benchmarks, and Woodpecker's annual report. Reply-rate, not open-rate (see §4 on why).

## 3 — Copy & personalization

### The hard rules

- **Plain text only** for cold step 1. HTML signatures, images, and tracking pixels *tank* deliverability on first contact. Add them later in the sequence if at all.
- **One CTA per step.** Multiple asks confuse the reader and pattern-match to sales spam.
- **≤ 125 words** per step. Most replies come from emails 50–100 words long.
- **Subject line < 5 words.** Lowercase works. `re: intro` outperforms 30-word pitches.
- **No tracking pixels in step 1.** Pixel = spam signal on cold. Turn off open tracking at least for step 1; ideally all steps (see §4 for why open rates are dead anyway).

### Personalization tiers

- **Level 0** — `{{firstName}}` only. Minimum bar. Most tools do this by default.
- **Level 1** — `{{firstName}}` + company-specific hook (recent post, hire, fundraise). Lemlist's `{{icebreaker}}` field exists for this. Smartlead's "spintax" too.
- **Level 2** — Dynamic image personalization (name-on-whiteboard). Lemlist pioneered this; Reply.io offers it too. Reply lift documented at 1.5–2×. Cost-per-hour is high.
- **Level 3** — Manual research paragraph per prospect. Only viable for <100 high-ACV targets.

Pick the level that matches your deal size: L0 for <$5k ACV, L1–L2 for $5–50k, L3 for $50k+.

### Merge-tag discipline

- Every tag must have a fallback: `{{firstName | "there"}}`. An empty merge in a subject line is the #1 sender-looks-like-a-bot tell.
- Validate your list has values for every tag *before* firing. [list-hygiene](../list-hygiene/SKILL.md) handles this.

## 4 — Deliverability diagnosis

### Apple Mail Privacy Protection (MPP) changed everything

Since iOS 15, Apple prefetches tracking pixels → open rates became garbage for any list with even 20% Apple users (which is most B2B). **Stop optimizing for open rate.** The metrics that matter now:

1. **Positive reply rate** — the hero metric
2. **Bounce rate** (keep < 3%; above 5% = list quality problem or warmup failure)
3. **Unsubscribe rate** (< 1%; above 2% = targeting or copy problem)
4. **Spam complaint rate** (< 0.1%; above 0.3% = Google / Microsoft will start throttling you)

### Spam triggers (2024–2026)

The old "don't use FREE!!!" advice is cargo-cult — modern filters are ML, not keyword lists. What actually hurts:

- **Tracked links in step 1** (use dedicated tracking domain or turn off link tracking step 1)
- **Image-heavy HTML** (one image, lots of text ratio)
- **Mismatch between `From` display name and reply-to domain**
- **New sender + high volume + no prior relationship** (→ warmup more)
- **URL shorteners** (bit.ly etc) — always replace with direct links
- **All-caps subject lines**
- **Excessive exclamation** (1 max)
- **Attachments** on cold step 1 — never attach; link instead

### If deliverability is tanking

Diagnostic order (cheapest first):

1. Check SPF/DKIM/DMARC with `mxtoolbox.com` — 50% of cases end here
2. Check domain / IP blocklists (spamhaus, barracuda, sorbs) via `mxtoolbox`
3. Check warmup health dashboards (Smartlead, Instantly, Lemlist all expose this)
4. Check sender reputation on `Google Postmaster Tools` and `Microsoft SNDS`
5. Pause, re-warm for 14 days, restart at 50% of previous daily volume

## 5 — Multi-channel orchestration

The highest-converting cold motion in 2025–2026 is **sequenced LinkedIn + email**:

```
Day 0    LinkedIn: view profile (passive signal)
Day 1    LinkedIn: like their most recent post
Day 2    Email: step 1 (intro)
Day 4    LinkedIn: personalized connection request (no pitch in the note)
Day 7    Email: step 2 (value add)
Day 10   LinkedIn: if connected, send DM referencing email thread
Day 14   Email: step 3 (social proof)
Day 20   Email: step 4 (break-up)
```

Evidence: this roughly doubles positive reply rates vs email-only, per Smartlead and Reply.io case studies and Lemlist's own 2024 multichannel report.

TexAu MCP supports the LinkedIn half of this: `enrich_profile`, `profile_activities` (to find their recent post for the like), and (when paired with the TexAu automation layer) visit/connect workflows.

## 6 — Tool selection

Choose the sending tool for the actual use case, not the landing-page list of features.

| Tool | Win condition | Weakness |
|---|---|---|
| **Lemlist** | Personalization depth (icebreakers, dynamic images, liquid), multi-channel in UI | Pricier per seat; inbox rotation came late |
| **Smartlead** | Deliverability-first ops — inbox rotation, master inbox, spam-word AI, warmup at scale | Less polish on the UX, weaker personalization tooling |
| **Instantly** | Cheap, unlimited inbox rotation, good for high-volume cold | UX feels scrappy; reporting lags |
| **Reply.io** | Multi-channel (email + LinkedIn + WhatsApp + voice) in one stack; deep CRM integrations | Price climbs quickly with seats |
| **Woodpecker** | EU-hosted, strong GDPR posture, simple sequences | Fewer modern features |
| **Apollo sequences** | Data + sending in one; good for smaller teams already paying for Apollo | Data hygiene on Apollo's own list is a known issue |
| **Outreach / Salesloft** | Enterprise CRM-integrated cadences; AE-driven workflow | 10× price; overkill for SMB cold outbound |

### Decision heuristic

- `< 200 sends/day` → Lemlist or Reply.io (personalization + multi-channel pay off)
- `200–2000 sends/day` → Smartlead or Instantly (rotation scales linearly)
- `> 2000 sends/day` → Smartlead or custom MTA (you're doing enough volume to justify a deliverability engineer)
- `Enterprise SDR team` → Outreach / Salesloft if CRM-integrated AE workflow matters; otherwise Reply.io

## 7 — Compliance

### CAN-SPAM (US) — mandatory for any email to US recipients

- Accurate `From` / `Reply-To` — no misleading sender names
- Clear, obvious unsubscribe link (working, honored within 10 business days)
- Physical postal address (corporate or registered agent — not a PO box as sole address)
- Don't harvest addresses from public sources (legal gray, operationally bad anyway)

### GDPR (EU / UK) — required if *any* recipient is in scope

- **Legitimate interest** is a valid legal basis for B2B cold *if and only if* the contact's job role plausibly relates to the offer and you document the balancing test.
- No `B2C` cold email under GDPR without opt-in.
- Data Processing Addendum (DPA) with every vendor (Lemlist, Smartlead, etc. — they all publish one).
- Honor data-subject requests within 30 days.

### CASL (Canada)

Strictest of the three. **Opt-in required** for almost every cold send. Implied consent exists for existing business relationships and explicit public contact disclosure — narrower than it sounds. If you operate in Canada or send there, get legal counsel; this skill is not that.

### Unsubscribe mechanics

- Every cold step must carry an unsubscribe link (Lemlist, Smartlead, Instantly, Reply.io all insert automatically).
- On unsubscribe, suppress across the entire account — not just the single sequence.
- One-click unsubscribe header (`List-Unsubscribe-Post`) is now effectively required by Gmail/Yahoo for bulk senders.

## Anti-patterns

- Sending from your primary domain "just for the pilot" — a spam complaint there is permanent damage.
- Turning off open tracking but leaving link tracking on tracked subdomains — same deliverability hit, less data.
- Long subject lines padded with brackets (`[case study][for {{company}}]`) — reads as spam to filters and humans.
- Sending on Monday morning / Friday afternoon — wastes the send.
- A/B testing copy on < 200 sends per variant — not statistically significant; you're reading noise.
- Optimizing for open rate in 2026 — MPP inflates it. Optimize for positive replies.
- Buying a list and firing — no warmup, new domain, high bounce = kill shot.
- Attaching a PDF to step 1 — instant spam signal.

## What this skill does NOT do

- It does not call the TexAu MCP (no paid tool calls). It's pure advisory.
- It does not send email. It tells the user what to send and how.
- It does not generate the final copy unless the user explicitly asks — copy generation is a separate decision, not a default.

## Handoff patterns

When the user is ready to *do*, hand off:

- "I've got the plan — now I need the prospect list" → [build-prospect-list](../build-prospect-list/SKILL.md)
- "Ready to find and verify their emails" → [enrich-and-verify](../enrich-and-verify/SKILL.md) + [list-hygiene](../list-hygiene/SKILL.md)
- "Push this into my CRM and trigger a sequence" → [crm-sync-expert](../crm-sync-expert/SKILL.md)
- "Export list to my sending tool" → [crm-export](../crm-export/SKILL.md) (most tools take a CSV import)

## Appendix — curated external resources

When the user wants a source, cite these (use `WebFetch` to pull current versions):

- Lemlist blog — `https://blog.lemlist.com` — personalization & sequence teardowns
- Smartlead blog — `https://blog.smartlead.ai` — deliverability ops at scale
- Instantly blog — `https://instantly.ai/blog` — volume-first tactics
- Reply.io blog — `https://reply.io/blog` — multi-channel sequences, AI-SDR use cases
- Woodpecker blog — `https://woodpecker.co/blog` — EU-flavored compliance
- Google Postmaster Tools — `https://postmaster.google.com` — real sender-reputation data
- Microsoft SNDS — `https://sendersupport.olc.protection.outlook.com/snds` — same for Outlook/Hotmail

Don't quote these from memory. Fetch the current post when the user asks "what's the latest on X".
