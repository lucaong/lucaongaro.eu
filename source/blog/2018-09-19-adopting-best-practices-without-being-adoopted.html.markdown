---

title: Adopting best practices without being adopted by them
date: 2018-09-19 16:03 CEST
tags: TDD, design patterns, practices, programming

---

I recently got asked for my opinion regarding an issue that a developer was
facing: when practicing Test Driven Development (abbreviated as TDD), they feel
that the resulting code tends not to follow design patterns. How can one achieve
well structured code, that follows the Design Patterns, through TDD?

I feel that this is an interesting question, because it uncovers some important
considerations on the way software development is taught and practiced.

The issue, in my opinion, stems from a wrong (but understandable) assumption:
that TDD and Design Patterns are best practices that a professional software
developer is supposed to follow. Hence the feeling that something must be
missing or wrong, if both cannot be achieved at the same time.

TDD and Design Patterns are both tools, not goals. They can be of great help,
but they are in no way necessary attributes of good software development, nor
rules to abide to.


## Design Patterns: the good and the bad

Knowledge of Design Patterns is, in my opinion, much more useful for
communication than for architecturing software. Patterns assign names to common
"shapes" of software programs, and thus give us useful vocabulary to talk with
other developers about code we need to collaborate on, pointing out, for
example, how one class implements a "visitor pattern" in order to solve a
problem. In this sense, knowing and studying design patterns is useful.

On the other hand, patterns are NOT a benchmark to measure how good some code
is, and also not a menu of the proper ways to solve problems with software.
First, they are obviously not an exhaustive list of all the possible valid ways
to structure code. The original "Gang of Four" classic book lists 23 design
patterns, but good design is clearly not about picking the right option out of
these 23. Also, those patterns are heavily focused on Object Oriented design,
which is just one possible programming discipline: in other contexts, like
functional programming, most of those patterns do not have much meaning, while
different patterns emerge.

Thinking in terms of patterns when designing code might even be limiting: it's
easy to end up "shoehorning" a solution into a pattern, and failing to recognize
simpler solutions. Or worse, recognizing those simpler solutions, but still
following the pattern for fear of judgement or to pass a code review.

In other words, patterns are names for structures that we often recognize in
code. It's good to explore them and to give them names, because that empowers us
to communicate ideas. But they are not a menu of options, nor a benchmark to
measure against. By all means study them, they will enrich your knowledge, but
use them as tools, not as a limit on what can be done.


## Test Driven Development: a powerful tool, but still a tool

Test Driven Development is a technique, the means to a goal. It's a powerful and
often counter-intuitive method that can guide us in the implementation of a
solution. It is definitely not a mandatory way to write software, nor a
necessary condition for good code.

Learning to write code test-first is not easy, and takes discipline, but it
yields great benefits. It's important for a well-rounded software developer to
learn TDD, and mastering it can take years, but is well worth the effort. That
said, tools are things that we _choose_ to use: we should not feel forced to
adopt them in all cases.

TDD is especially good when one is faced with a problem that is well understood,
even if the implementation can be tricky: it guides us through the
implementation, helping us to move in little steps and to formalize what we
intend to do in each iteration. Also, it ensures by nature that the code we
produce is tested.

When uncertainty is high and the problem is not well understood yet, it's often
necessary to explore the problem space first, by implementing tentative
solutions, or by researching and experimenting. In those cases, working in a
strictly iterative way gets cumbersome and counter-productive, and it is
perfectly reasonable to avoid TDD. Ultimately, you should make sure that you
_can_ practice TDD, but if you find yourself hindered by it in a situation,
don't be ashamed to avoid it.

In most situations you should really make sure you write good tests: having good
tests decreases the cost of changing your code, and makes it possible to
collaborate and evolve the code base productively. But whether you should choose
to write tests first or last depends on what is more conductive to good code and
tests, in your specific case: TDD is often, but _not always_, the answer.


## Conclusion: sharpen your tools, and mute non-constructive judgement

In conclusion, TDD and Design Patterns (but also Pair Programming, OOD, DDD,
Agile, etc.) are tools at your disposal. You should understand why they were
conceived, and what issues they help to avoid. You should spend due time
learning and mastering them, if you want to be a well-rounded software crafter.
Still, once you know them well, remember to keep your critical thinking alert,
and to retain the choice of which tools to use in each specific situation.

Unfortunately, these disciplines have often being misused as judgement criteria.
One reason is that assuming that there is "One True Way™" to do things well
makes the task of teaching and evaluating performance a lot easier (and
sterile). Both in education and in professional settings, it's often too
tempting for teachers, recruiters, and supervisors to evaluate developers
against a checklist. Moreover, communities are formed around practices, with the
goal of promoting their adoption. Those communities tend to protect their
identity from change, sometime forgetting the original motivation for the
practice. That way, even genuinely good practices can get stretched outside
their boundaries and become akin to cults. The antidote is to always demand to
know _why_ something is better, without accepting tautological answers.

Our aim should be to master our art more and more every day, and for that we
need our critical thinking well sharpened. The satisfaction and peace of mind
that derives from a continuous pursue of mastery is a lot more valuable than the
temporary reward of satisfying other people's checklist of expectations, or of
pledging our unconditionate belonging to an established group. Surrendering to
peer pressure even when our best judgement suggests something different is a
false relief.

This does not mean that you should disregard others' informed opinion, nor that
your own judgement will always be correct. But if you have properly considered
and understood the options, and you still think there's a better way, then
follow your intuition with an open mind. Either you will prove yourself right,
or you will understand your mistake: in both cases you will have learned
something.
