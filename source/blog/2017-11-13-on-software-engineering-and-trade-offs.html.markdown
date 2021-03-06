---

title: On Engineering Software and Trade-Offs
date: 2017-11-13 13:36 UTC
tags: engineering, trade-offs, programming

---

As software developers, we tend to be quite opinionated about our tools and
techniques. Our own specific education and experiences shape our preferences,
and we often identify with several schools of thought. We might be, for example,
advocates of functional programming, practitioners of test driven development,
or microservices enthusiasts. On top of this, we all have our preferences when
it comes to technology: our favorite programming languages, databases,
infrastructure… These preferences shape our identity as software developers,
and exert a profound influence on the way we think: we view problems through
those lenses, and determine the way we envision solutions.

On one hand, this is often a good thing: these disciplines provide us with a
useful model of the programming reality and with ways to navigate it. On the
other, strong beliefs might cause us to end up stuck defending our own stance,
unable to see the merits of a different view point. It is not unusual to witness
developers belonging to different schools of thought vehemently argue over some
technical decision, each strenuously defending their own view of the
(programming) World.

While there is nothing wrong in recognizing the merits of a technique and in
adopting it, we should never forget one fundamental point: _pretty much every
technical discipline or tool embodies a trade-off. Techniques and technologies
are solutions to specific problems, and their merits or flaws are never
absolute, but always bound to the context._ Being aware of where these
trade-offs lie is necessary not only to operate the right choices of tech, but
also to maintain an open and flexible mind, capable of changing approach when
necessary. Moreover, knowing where costs and benefits lie, provide us with the
opportunity to innovate in ways that shift the trade-offs in a better direction.

## Static vs. Dynamic Typing

One prominent example of something that many software developers hold strong
opinions about, is statically versus dynamically typed languages. Advocates of
static typing on one hand often maintain that strong typing is absolutely
necessary for any serious project, while -- on the other hand -- users of
dynamically typed languages regard static typing as a tedious and mostly
unnecessary ceremony.

Despite these strong beliefs, evidence shows that both approaches can be
extremely successful, ruling out a single objective winner of the diatribe. If
dynamic typing cannot scale, how can we explain the existence of numerous large
projects written in JavaScript, Python, Ruby, etc.? Let alone the immense
success of C as a system programming language, which, while definitely not
dynamically typed, can hardly be considered a strong type system. Equally, if it
was true that static typing only hinders productivity and expressiveness, how
could we account for the vast number of widely adopted strongly type languages,
and their evident success on the field? The situation is not different if we
turn our attention to demerits: no matter how opinionated we might be on one
side or the other, we can at least agree that terrible code can be written in
any practical language, no matter the type system.

Therefore, instead of adopting an absolute view point, let's try to focus
on the trade-offs of these two approaches. One way to look at it, is that static
typing reduces the number of runtime errors, at the cost of requiring more
effort to express solutions in code. Seen through these lenses, we can start
appreciating how contextual the specific merits of both disciplines are. The
cost of runtime errors is indeed vastly different for each specific application.

In a web application for example, "runtime" often means the development machine
on which code is written, or the automated test environment. In a non-critical
application adopting continuous delivery, even when the occasional bug slips to
production, it can easily be reverted or patched with a new deployment. In these
situations, favoring a language that makes it convenient to write automated
tests, and shortens the test-code-deploy cycle, might often be the right choice.
As a counter example, native mobile applications and embedded software follow
release cycles that make it costly to deploy a fix to all users, if a runtime
bug is discovered. In this cases, a strong type system can help catching defects
and inconsistencies before it's too late, and is worth some more effort to get
our software to compile.

One objection to this line of reasoning could be that we should strive to
minimize defects, no matter if they are more or less costly. That is of course
true, but the point is that this minimization is subject to a cost structure,
and the optimal solution depends on those costs. If that wasn't the case, we
would witness a world of absolutely bug-free software. The reality is quite
different, and our job as engineers comes necessarily with a fair share of risk
management considerations.

Of course there are other trade-offs at play, such as the extent to which IDEs
can help us, versus the redundancy of the hints we have to give to compilers for
them to help us catching inconsistencies. Again, the point is that being aware
of them makes us better equipped to make informed decisions.

There are numerous examples of innovations on both sides that all rely on an
awareness of these trade-offs and a conscious effort to improve on them. Type
inference is an effort to reduce the additional effort of writing statically
typed code, and got to the point that some static languages, like
[Crystal](https://crystal-lang.org/), hardly require any type annotation at all.
On the other hand, there are dynamic languages that add some static analysis
capabilities to their toolbox, as seen in
[Dialyzer](http://erlang.org/doc/man/dialyzer.html) for Erlang and Elixir, or
[Flow](https://flow.org/) for JavaScript, making the static vs. dynamic typing
distinction more like a gradient of possibilities than a binary choice.

## Microservices vs. Monolith

Another example of a polarizing diatribe is microservices versus monolithic
architectures. The term "monolith" is already subtly conveying an association
with something old and clumsy, almost prehistoric, testifying how heated the
debate is. Equally, the Internet is bubbling with examples of microservice
architectures gone awry. But once again, let's try to steer the conversation
away from fruitless animosity by focusing on trade-offs of the respective
solutions.

Microservices divide an application in separate and independent artifacts
communicating with each other passing messages through standardized interfaces,
usually (but not exclusively) implemented as HTTP APIs. As such, microservice
architectures make it easier to evolve and improve at the level of the single
service: as long as the interface stays the same, a service can be completely
rewritten without the other services even noticing. On the other hand,
microservices make the boundaries between services way more rigid: changing
those boundaries requires careful coordination between different services, and
often between different teams.

Depending on the life cycle of a project, and on how stable the functional
boundaries are expected to be, this trade-off can change dramatically, making
one approach or the other preferable or problematic. This dynamic is not
exclusive of our industry: in management studies, this trade-off is known as
modularity vs. integrality, and there are plenty of case studies showing how
each approach has proved beneficial or detrimental to companies in different
contexts.

Once again, being aware of these costs and benefits, makes it possible to
consider the context in which we operate our decisions. Moreover, we often have
the possibility to shift the balance or hedge the risks, for example by adopting
a modular architecture even within a single service, or splitting our services
only where boundaries are well known and stable.

## Distributed Systems vs. Centralized Systems

One final example is distributed systems versus centralized ones. There has been
a lot of innovation in the field of distributed systems in recent years, and we
have witnessed a proliferation of new decentralized solutions dealing with
storage, configuration management, messaging queues, and more. Proponents of
this approach outline the benefits of distribution when it comes to scaling and
resilience, but the wave of innovation brought also a certain disdain for
centralized solutions.

Distributed systems are a welcome addition to our choice of technologies, but
once again, their advantages do not come without a cost. A distributed system
reduces the chances of a failure of the whole system, at the cost of having to
run and coordinate several nodes, therefore incurring in some overhead, and
increasing the chances that any single node will fail, requiring intervention.
This might seem like a reasonable trade-off to accept, but there are products or
teams where an occasional short downtime is more acceptable than a sustained
higher effort on operations.

A centralized system is harder to scale, but on the other hand it is not
susceptible to network partitions, hence it is not subject to the [CAP
theorem](https://en.wikipedia.org/wiki/CAP_theorem) and can be at the same time
available and consistent. Therefore, depending on the scale and requirements of
a particular project, different approaches are preferable.

By keeping this trade-off in mind, and by knowing the specific context and
requirements of a project, we are able to make informed decisions, and to
consciously mitigate the risks that come with our technology of choice.
Furthermore, centralized systems can be backed-up and replicated, and
distributed systems can alleviate the operational burden by automating some
operations, and by adopting an application design that takes into consideration
from the beginning the limits of the system, when it comes to consistency or
availability.

## Conclusions

In conclusion, the software development universe is full of polarizing
dichotomies, and engineers often have strong opinions: functional programming
versus object orientation, client-side versus server-side rendering, performance
versus maintainability, and so on. Experience should teach us that in each of
those dichotomies lies a trade-off, as well as different boundaries of
applicability. Reflecting on costs and benefits helps us keeping a flexible mind
and recognizing opportunities to adopt different strategies. Reminding ourselves
that every solution is contextual and never absolute is an exercise of
intellectual honesty, if we strive to be well-rounded engineers. Finally,
focusing on trade-offs and context, rather than on position and beliefs, makes
technical discussions a lot more enjoyable and less prone to end with an
impasse.
