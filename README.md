# Interruption Counter

Browser extension (Chrome-based and Firefox-based) to **record and measure interruptions in programmers' work**, with a special focus on interruptions caused by the **immediate manager**.

> Almost everything about interruptions is invisible and unmeasured. Companies measure deliveries, story points, and hours — but nobody measures how many times a developer was interrupted or how much it cost. This project turns a diffuse, anecdotal cost ("I feel like I'm not getting anything done") into concrete data ("I was interrupted 14 times today, ~5h of estimated resumption cost").

The full technical plan is in [PLANO-IMPLEMENTACAO.md](PLANO-IMPLEMENTACAO.md).

---

## The motivation: why interruptions are especially harmful to programmers

### 1. The cost of the mental context switch

Programming requires holding a complex mental model in your head: the structure of the code, the state of the variables, the flow being debugged, the hypotheses under test. That model isn't saved anywhere — it exists only in working memory. A 30-second interruption can destroy something that took 20 minutes to build. The classic analogy: it's like knocking down a nearly finished house of cards.

### 2. Resumption time is far longer than the interruption itself

Research by Gloria Mark (UC Irvine) measured an average of **~23 minutes** to fully return to the original task after an interruption [[1]](#references). Studies specific to developers (Parnin & Rugaber, analyzing Visual Studio usage data) showed that after an interruption, a programmer takes **10–15 minutes** just to get back to editing code, and resumes work in under one minute only ~10% of the time [[2]](#references). In other words: 5 "quick" interruptions per day can cost 1–2 hours of real productivity.

### 3. Interruptions don't add up — they multiply

An 8-hour day fragmented into 30-minute blocks is not equivalent to 8 hours of work — complex tasks (architecture, hard debugging, refactoring) simply *don't fit* into small blocks [[3]](#references). The programmer ends up filling the day with shallow tasks and postponing the important ones, producing the feeling of "I worked all day and got nothing done" [[4]](#references).

### 4. More bugs

Resuming code in the middle of an interrupted line of reasoning increases the chance of error: the person thinks they remember where they were, but the reconstructed mental model is incomplete. Studies on resuming programming tasks show that editing code right after a context resumption raises the probability of introducing defects [[2]](#references)[[5]](#references).

### 5. Emotional cost and burnout

Interrupted work is compensated with haste: people work faster to make up the time, at the cost of more stress, frustration, and perceived pressure [[1]](#references). In the long run, this feeds burnout — and programmers frequently cite "I can't concentrate at the office" as a reason for working at night or preferring remote work [[6]](#references).

### 6. The "flow" state problem

The state of deep concentration (Csikszentmihalyi) takes around 15–25 minutes to reach [[7]](#references). In an environment where a Slack/Teams message arrives every 10 minutes, the programmer literally never enters flow — they spend the entire day in shallow concentration [[6]](#references).

### Typical sources of interruption in IT environments

- **Corporate messaging** (Slack, Teams) with a cultural expectation of immediate response;
- **Meetings scattered** throughout the day, chopping up the schedule — a 2 p.m. meeting "kills" the 1:30–2:00 block, because it's not worth starting anything;
- **In-person interruptions** ("just a quick question") — the most costly, because they are synchronous and impossible to defer;
- **Notifications** from email, CI/CD, monitoring alerts;
- **Self-interruptions**: after a fragmented day, the brain itself gets used to it and starts interrupting itself every few minutes [[8]](#references).

---

## The special case: interruptions from the immediate manager

Interruptions coming from the immediate manager are, in several respects, the most damaging of all — which is why they are the **primary focus** of this project.

### Why the boss's interruption is worse than the others

**1. It cannot be refused or deferred.** A message from a colleague can wait; a notification can be silenced. But when the immediate manager interrupts — at your desk, by call, or with "got 5 minutes?" — there is a power asymmetry that demands an immediate response. The programmer loses even the most basic defense mechanism: choosing *when* to be interrupted. Interruptions at inopportune moments (in the middle of a subtask, rather than at a boundary between tasks) cost far more [[5]](#references) — and the boss interrupts at *their* moment, not at the developer's opportune moment.

**2. Double cognitive load: the task + the hierarchy.** Besides destroying the mental model of the code, the manager's interruption activates social concerns: "am I being evaluated?", "I need to look productive". This post-interruption rumination extends resumption time beyond the average ~23 minutes, because the mind keeps processing the interaction after it has ended.

**3. The "status at any time" pattern creates permanent vigilance.** When the boss asks for status outside of any ritual ("hey, how's that thing going?"), the damage is not just the interruption itself — it's the **anticipation** of it. The developer starts working in a state of alert, avoiding deep dives because "I could be called at any moment". Even on a day with no interruptions at all, the constant *possibility* already prevents deep concentration — an effect analogous to the documented impact of a phone's mere presence on the desk, which degrades available cognitive capacity [[9]](#references).

**4. Managerial interruptions often switch the task, not just pause it.** A colleague asks and leaves; the boss interrupts and often **reprioritizes**: "drop that, look at client X's bug first". This turns an interruption into a full *task switch* — the cost is not just resuming, it's abandoning context, building another from scratch, and later reconstructing the first [[3]](#references)[[8]](#references). With frequent reprioritizations, 80%-done work piles up and nothing ships.

**5. A signal of distrust → drop in motivation and autonomy.** Micromanagement by interruption communicates, even unintentionally: "I don't trust that you're working". This erodes autonomy — which, together with mastery and purpose, is one of the pillars of intrinsic motivation (self-determination theory, Deci & Ryan [[10]](#references); popularized by Daniel Pink [[11]](#references)). Low perceived autonomy predicts lower engagement and higher intention to leave the company — and turnover in IT is extremely expensive.

**6. Cascade effect on the team.** The manager's behavior sets the cultural norm. If the manager interrupts freely, peers feel authorized to do the same, and the whole team loses the notion that focus is a resource to protect.

**7. The productivity irony: the boss interrupts to speed things up and manages to slow them down.** Every status request *delays the very progress* they want to track. Paul Graham's essay "Maker's Schedule, Manager's Schedule" describes exactly this conflict: the manager operates in 30–60 minute blocks and doesn't realize that, for the maker, a meeting or interruption in the middle of the afternoon costs the entire afternoon [[12]](#references).

### Summary of harms specific to the immediate manager

| Harm | Mechanism |
|---|---|
| Slower resumption than ordinary interruptions | Social rumination after interacting with an authority figure |
| No possible defense | Power asymmetry prevents deferring or refusing |
| State of constant vigilance | Anticipating the interruption already prevents flow |
| Forced multitasking | Reprioritizations pile up 80%-done work |
| Drop in motivation and autonomy | Frequent interruption signals distrust |
| Interruption culture in the team | The manager sets the norm that peers copy |
| Turnover | Loss of autonomy is a strong predictor of leaving in IT |

---

## From the discussion to the tool

The conclusions above directly shaped the extension's design:

- **A single, immediate CTA** — the moment the interruption happens, the developer presses a button that pauses all audio/video in the browser, starts a stopwatch, and creates the record. Logging must not cost attention: the interruption has already cost enough.
- **Manual resumption** — only the developer knows when they actually got back to work; the stopwatch measures the real duration of the interruption, not an estimate.
- **Pre-classification as `chefia` (boss)** — the project's priority source is the most frequent and most costly case; the other categories (`colega`/colleague, `reuniao`/meeting, `mensagem`/message, `pessoal`/personal, `outro`/other) live in a secondary reclassification flow in the day's detail view.
- **Estimated resumption cost** — the daily report multiplies interruptions by the ~23 minutes from the literature [[1]](#references). Showing the manager that 40% of the team's interruptions come from them, with the cost estimated in hours, is the kind of data that changes behavior without turning into personal confrontation.

## References

1. **Mark, G., Gudith, D., & Klocke, U. (2008).** *The Cost of Interrupted Work: More Speed and Stress.* Proceedings of CHI 2008. ACM. — The study that measured the ~23-minute average for full resumption and the increase in stress and haste as compensation. https://www.ics.uci.edu/~gmark/chi08-mark.pdf
2. **Parnin, C., & Rugaber, S. (2011).** *Resumption strategies for interrupted programming tasks.* Software Quality Journal, 19(1). — Analysis of real programmer data in Visual Studio: 10–15 min to get back to editing code; only ~10% of resumptions in under 1 minute.
3. **Czerwinski, M., Horvitz, E., & Wilhite, S. (2004).** *A Diary Study of Task Switching and Interruptions.* Proceedings of CHI 2004. ACM (Microsoft Research). — Work fragmentation and the difficulty of resuming complex tasks after context switches.
4. **Meyer, A. N., Fritz, T., Murphy, G. C., & Zimmermann, T. (2014).** *Software Developers' Perceptions of Productivity.* Proceedings of FSE 2014. ACM. — Developers associate productive days with few context switches and few interruptions.
5. **Iqbal, S. T., & Horvitz, E. (2007).** *Disruption and Recovery of Computing Tasks: Field Study, Analysis, and Directions.* Proceedings of CHI 2007. ACM (Microsoft Research). — The recovery cost of interrupted tasks and the effect of the interruption's timing.
6. **DeMarco, T., & Lister, T. (2013).** *Peopleware: Productive Projects and Teams* (3rd ed.). Addison-Wesley. — The classic on work environments in software engineering; the concept of flow applied to programmers and the cost of the interruptive office.
7. **Csikszentmihalyi, M. (1990).** *Flow: The Psychology of Optimal Experience.* Harper & Row. — The theoretical foundation of the deep concentration state.
8. **Mark, G., González, V. M., & Harris, J. (2005).** *No Task Left Behind? Examining the Nature of Fragmented Work.* Proceedings of CHI 2005. ACM. — Fragmentation of knowledge work and the phenomenon of self-interruptions in already fragmented environments.
9. **Ward, A. F., Duke, K., Gneezy, A., & Bos, M. W. (2017).** *Brain Drain: The Mere Presence of One's Own Smartphone Reduces Available Cognitive Capacity.* Journal of the Association for Consumer Research, 2(2). — The mere possibility of a demand already consumes cognitive capacity, even without an actual interruption.
10. **Ryan, R. M., & Deci, E. L. (2000).** *Self-Determination Theory and the Facilitation of Intrinsic Motivation, Social Development, and Well-Being.* American Psychologist, 55(1). — Autonomy as a pillar of intrinsic motivation.
11. **Pink, D. H. (2009).** *Drive: The Surprising Truth About What Motivates Us.* Riverhead Books. — Popularization of autonomy, mastery, and purpose as drivers of motivation in creative work.
12. **Graham, P. (2009).** *Maker's Schedule, Manager's Schedule.* — Essay on the structural conflict between the schedule of those who manage and those who make. http://www.paulgraham.com/makersschedule.html

---

*Academic project — a study on counting and measuring interruptions in the IT work environment.*
