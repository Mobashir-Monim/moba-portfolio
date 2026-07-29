# Case study notes

Raw input for BUILD-PLAN 4.2. Dump notes here in any state: fragments, bullets, half sentences,
numbers without context. I structure them into `v2/src/lib/content/case-studies.ts` and
`v2/src/lib/content/prose/case-studies.md` and then build the reader over them.

This file is working material, not shipped content. It stays at the repo root, outside `v2/`.

## How to fill it

One `##` block per project, keyed by the project's slug so it maps straight onto the existing
record. Copy a block from the template below for each one you want to write up. Skip any heading
you have nothing for; an empty section is better than a filled-in guess, and I will ask about the
gaps rather than paper over them.

The five headings are the spec's, in the order a reader wants them:

- **Problem.** What was broken or missing before. The situation, not the ticket.
- **Constraints.** What you could not change: legacy system, team size, deadline, budget,
  compliance, an existing stack you inherited. This is the section that makes a case study read
  as engineering rather than as a feature list.
- **Approach.** What you actually built and why that shape and not another. Decisions and their
  reasons, including the ones you rejected.
- **Outcome.** What shipped and what changed for the people using it.
- **Results.** Numbers. Percentages, durations, counts, cost, error rates, anything measured.
  If a number is an estimate, write it as an estimate and I will label it one. If there are no
  numbers for a project, say so and the section gets dropped rather than filled with adjectives.

Anything that does not fit those five, put under `### Notes` at the end of the block.

## Projects available

All 21 slugs, from `v2/src/lib/content/projects.ts`:

`billing-engine`, `inventory-management`, `point-of-sale`, `service-agreements`,
`calendar-and-scheduling`, `cli-dev-tool`, `bout`, `bout-v2`, `blober`, `busso`, `lightsaml`,
`beep`, `land-reg`, `mongol-tori`, `ecube`, `connect`, `huddle`, `alfred`, `user-validator`,
`lms-usage-report-generator`, `automated-course-management-scripts`

Not every project needs one. A case study is for work with a story in it; the rest stay as the
catalogue entries they already are. The ones with the most visible depth from the existing prose
are `billing-engine`, `busso`, `cli-dev-tool`, `land-reg`, and `bout-v2`, but that is a guess from
the outside and yours is the only informed read.

## Template

```
## slug-goes-here

### Problem

### Constraints

### Approach

### Outcome

### Results

### Notes
```

---

## cli-dev-tool

### Problem

### Constraints

### Approach

### Outcome

### Results

The existing blurb claims feature time cut by nearly 40%. Where did that number come from, and
what was being measured: time to first commit, time to merge, or something else?

### Notes
