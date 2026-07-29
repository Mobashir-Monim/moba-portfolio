# Case studies

Prose for the case study records. Keys match `CaseStudy.slug`, which is the project's slug with
`-case-study` on the end. Everything before the first `### ` is the lead; each `### ` opens a
section, and the section order here is the order the reader draws them in.

The five section headings are fixed by `content.test.ts`: Problem, Constraints, Approach, Outcome,
Results. A study omits Results rather than filling it with adjectives.

**Provenance.** These six were assembled from the project write-ups in `projects.md`, the feature
lists in `projects.ts`, and the employment records, restructured into the five sections. Nothing
here asserts a fact those three do not already carry, and no number appears that was not already
recorded. `CASE-STUDIES.md` at the repo root is where the first-hand notes go, and it replaces
this file section by section as they arrive.

## billing-engine-case-study

The Billing Engine charges gym members through several payment processors, across card, ACH and cash, on schedules that retry when a payment fails.

It is GymRevenue's client-end billing module: membership fee calculation, invoice generation, payment processing, and subscription management, for a business whose revenue arrives in more than one shape.

### Problem

A gym does not have one way of taking money. Membership is recurring and dated. The counter sells inventory, services, and subscriptions in the moment. Service agreements carry their own terms, their own billing dates, and their own annual dues. Each of those ends in a payment, and each payment can fail for reasons the gym did not cause and cannot see.

Handling them separately means the same arithmetic for fees, tax, and retries written more than once, in places that then disagree.

### Constraints

No single payment processor could be assumed. The module had to work against several vendors, which rules out building the billing logic around any one vendor's model of a transaction.

Sales tax is a function of where the sale happened, and the rates change without asking. A rate compiled into the system is a rate that is wrong at some point after release.

A failed payment is not an error to log and move past. It is money the business is owed, so every attempt has to leave a record that a human can act on later.

### Approach

Vendor support is a seam rather than a branch: the module speaks to multiple payment processors, and to card, ACH, and cash, through the same billing path.

Recurring payments and billing run on the schedule the agreement sets. Failures fall to automated retries first, and to a manual retry when a person needs to intervene. Late fees are calculated on the same schedule, automatically, so the fee and the charge it is attached to are never computed by two different rules.

Sales tax is applied by location and updated automatically, which is the only shape that survives a rate change.

Payment status and payment attempts are tracked as separate things, because a payment that eventually succeeded after three attempts is a different fact from a payment that succeeded.

### Outcome

One module covers membership fee calculation, invoice generation, payment processing, and subscription management, with recurring billing, retries, late fees, and location-based tax handled in the same place rather than repeated per sales path.

## cli-dev-tool-case-study

The CLI Dev Tool generates a new domain's scaffolding in GymRevenue from a single command, and cut feature delivery time by close to 40%.

It is the internal tool that sits beside the product rather than inside it, and the only one of these projects whose payoff was measured directly in developer time.

### Problem

GymRevenue's architecture put the same set of files behind every new domain. Adding one meant writing that set again by hand, which is slow the first time and worse afterwards: every hand-written copy drifts a little from the last, so the shape the architecture assumes stops being the shape the code has.

### Constraints

The tool writes source files into a working tree, which is a capability worth keeping well away from anything running in production. It was deliberately configured to execute only in a local environment, and to refuse to run in a server environment at all.

That was a design decision rather than a limitation discovered late, and it is the reason the tool has no deployment story to speak of.

### Approach

Code generation from templates, with the templates customisable by the team rather than fixed in the tool, and parameterised per domain. The generated output is the same shape every time, which is the actual product: consistency, not typing saved.

### Outcome

One command replaces the scaffolding pass at the start of a feature. The architecture's conventions live in the templates, so they are applied rather than remembered.

### Results

Feature delivery time fell by close to 40%.

## bout-v2-case-study

Bout V2 is a ground-up rebuild of Bout that had to reach feature parity with the original before it was allowed to add anything of its own.

Bout is the faculty evaluation and student information system underneath both: evaluation collection, evaluation analysis, and student records for a university.

### Problem

Bout worked, and a rebuild of something that works is only worth doing if the new one is better along an axis the old one could not reach. The first version was a Laravel and Bootstrap application, server-rendered throughout, in a product whose most-used screens are forms and result views that want to respond without a round trip.

### Constraints

Parity gates everything. A rebuild that ships without something the original did is a downgrade to the person using it, whatever its stack looks like underneath. So the whole of the original had to land first: permissioning, evaluation distribution and analysis, the student information store, and course and section management.

The new stack also had to keep the existing Laravel work worth something rather than throwing it away wholesale.

### Approach

React on the front end for the interaction, Firestore for the data that suits a document store, and Laravel kept behind them. Feature parity first, then the additions the original had no place for: evaluation collection management, anonymous evaluation collection, a form builder so evaluations can be defined without a developer, and thesis registration management.

The form builder is the one that changes what the system is. An evaluation system whose evaluations are hard-coded is a system the administrators queue behind; one with a builder is a system they operate.

### Outcome

Everything the original did, plus four capabilities it did not, on a stack where the interactive screens are interactive.

## busso-case-study

BuSSO is a single sign-on service that speaks both SAML 2.0 and OpenID Connect, so services with different authentication expectations share one login.

It carries the access control and the audit trail alongside the authentication, which is what turns a login service into something an administrator can answer questions with.

### Problem

An institution accumulates services faster than it standardises them. Each arrives with its own login, its own idea of who a user is, and its own protocol, and the person using them ends up with one identity split across several accounts.

Consolidating the logins is the easy half. The harder half is that the services do not agree on how to ask.

### Constraints

The protocol could not be dictated to the service providers. Some speak SAML, some speak OpenID Connect, and a service that already exists is not going to be rewritten to suit the sign-on. So both had to be supported generically, rather than one being supported and the other bridged.

Access to an institutional service is also something that has to be answerable after the fact, not only enforced at the moment of the request.

### Approach

Generic SAML and OIDC support, with service provider management so a new service is configured rather than coded.

Access is controlled on two axes: by email, which handles the individual exception, and by role, which handles the rule. Both are needed, because every real access policy is a rule with exceptions.

Two logs, kept apart on purpose: an access log of who reached what, and a data change log of what was altered in the service itself. They answer different questions and would be less useful merged.

### Outcome

One login across services that never agreed on a protocol, with a record of who reached what and of what changed.

## land-reg-case-study

Land Reg is a prototype land registry built on Council Protocol, a delegated proof of stake consensus designed for Bangladesh's land records.

It is research rather than product: the registry exists to demonstrate the consensus protocol, and the protocol is the contribution.

### Problem

A land registry is a ledger whose entries decide who owns what, which makes both its history and its access to that history worth attacking. Transparency, security, and the time a transfer takes are the three things a paper registry is worst at, and they are the three a distributed ledger is usually reached for to fix.

Reaching for a general purpose chain does not fix them on its own, because the assumptions those chains are built on are not a registry's assumptions.

### Constraints

The participants in a land registry are known institutions, not anonymous miners. A consensus that spends energy proving identity does not need to be paid for here, and a registry that settles slowly is a registry nobody uses.

That is the condition delegated proof of stake exists for, and it is why the protocol is the research rather than the application on top of it.

### Approach

Council Protocol: block generation by a delegated set, sized to the institutions that actually hold registry authority. Around it, the parts a registry needs to be one at all: land owner verification, land registration, ownership transfer, and management of the network the whole thing runs on.

### Outcome

A working prototype that demonstrates the protocol end to end, from verifying an owner to transferring the land they hold.

## user-validator-case-study

User Validator checks accounts on Brac University's OpenEdx platform against the real student and faculty rolls and removes the ones that match nobody.

It was built during the pandemic, at the moment the platform's user base grew faster than anyone could vouch for it in person.

### Problem

Brac University's OpenEdx platform launched into remote learning, when the usual check on who is on campus had stopped applying. Accounts arrived that belonged to no student and no member of faculty, some of them opportunistic and some outright scams.

For an academic institution the cost is not the storage. It is that the platform stops being able to claim its users are its students.

### Constraints

The only evidence available is what the account claims about itself, set against the institution's own rolls. That comparison is never exact: names are spelled differently, ordered differently, and carry middle names in one record and not the other, so an equality check finds almost nothing and a loose match finds far too much.

No single factor is decisive either, which means the thresholds cannot be fixed in code by whoever writes it first.

### Approach

Name based similarity indexing rather than equality, so a near miss is scored instead of discarded.

Validation is weighted across several factors rather than decided by any one of them, and both the factors and their weights are customisable, so the operator tunes the balance between removing a real account and keeping a fake one.

### Outcome

Fake and scam accounts identified and removed, with the roll itself as the reference rather than a heuristic about how a real account behaves.
