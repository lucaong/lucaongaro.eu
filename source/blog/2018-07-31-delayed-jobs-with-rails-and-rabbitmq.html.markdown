---

title: Delayed jobs with Rails and RabbitMQ
date: 2018-07-31 15:34 CEST
tags: activejob, jobs, rabbitmq, rails, sneakers, delayed, ruby, programming

---

I recently had the need to schedule background jobs with a specified delay into
the future from a _Ruby on Rails_ application. I had to implement a retry
mechanism with exponential backoff, so I needed to be able to express something
like "execute job X, but wait Y seconds before doing so". Clearly, I needed this
mechanism to be non-blocking: if a job is scheduled 5 minutes in the future, the
workers should be free to process other jobs in the meantime.

Some popular `ActiveJob` adapters like Resque or Sidekiq implement this feature,
which is exposed in the `ActiveJob` API as the `wait: <seconds>` option:

```ruby
SomeJob.perform_later(some_argument, wait: 5.minutes)
```

My adapter of choice though is [Sneakers](http://jondot.github.io/sneakers/),
which is based on the superb [RabbitMQ](https://www.rabbitmq.com), but
unfortunately, as of July 2018, does not implement delayed jobs out of the box,
as the feature table for `ActiveJob::QueueAdapters` dutyfully reports (copied
from the
[official docs](https://api.rubyonrails.org/classes/ActiveJob/QueueAdapters.html)):

```text
|                   | Async | Queues | Delayed    | Priorities | Timeout | Retries |
|-------------------|-------|--------|------------|------------|---------|---------|
| Backburner        | Yes   | Yes    | Yes        | Yes        | Job     | Global  |
| Delayed Job       | Yes   | Yes    | Yes        | Job        | Global  | Global  |
| Qu                | Yes   | Yes    | No         | No         | No      | Global  |
| Que               | Yes   | Yes    | Yes        | Job        | No      | Job     |
| queue_classic     | Yes   | Yes    | Yes*       | No         | No      | No      |
| Resque            | Yes   | Yes    | Yes (Gem)  | Queue      | Global  | Yes     |
| Sidekiq           | Yes   | Yes    | Yes        | Queue      | No      | Job     |
| Sneakers          | Yes   | Yes    | No         | Queue      | Queue   | No      |
| Sucker Punch      | Yes   | Yes    | Yes        | No         | No      | No      |
| Active Job Async  | Yes   | Yes    | Yes        | No         | No      | No      |
| Active Job Inline | No    | Yes    | N/A        | N/A        | N/A     | N/A     |
```

Sneakers and RabbitMQ are a perfect fit for my specific application: we
leverage the highly available queues and versatile semantics of RabbitMQ for
several use-cases, involving services written in other languages than Ruby. For
example, our RabbitMQ exposes a MQTT frontend that collects metrics from our IoT
devices, and makes it possible to implement several decoupled data processing
pipelines, something cumbersome to implement with Rails-specific queuing
mechanisms. Therefore, changing the queue backend just for this feature was not
a desireable option: I decided to implement the missing feature instead, and I
will show you how.

Luckily, there exists a well designed RabbitMQ plugin that does exactly what I
needed, so I just had to write the adapter logic for it. The plugin is called
[`rabbitmq_delayed_message_exchange`](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange),
and can be easily added to an existing RabbitMQ installation by downloading
the binary build, putting it into the plugins directory, and enabling it.

The plugin is well-documented and fairly straightforward to use, for those
familiar with RabbitMQ and AMQP. In order to schedule delayed messages, one
just has to:

  1. Declare an exchange with type `x-delayed-message`, and an extra
     `x-delayed-type` header to indicate the desired routing semantic after the
     delay elapsed (like "direct", or "topic", etc.).
  2. Publish messages on that exchange, providing an `x-delay` header indicating
     the desired delay in milliseconds.
  3. Queues bound to the exchange will then receive the message after the given
     delay elapses, and from this point on everything works according to the
     standard AMQP protocol.

What was missing was only the integration between this plugin and our
Rails + ActiveJob + Sneakers setup. Essentially, I needed to publish jobs that
specify a `wait: <seconds>` option using a custom publisher that uses a
`x-delayed-message` exchange and sets the `x-delay` header, while leaving jobs
that do not specify a delay to the standard Sneakers publisher.

Here's the code I ended up writing, using `ActiveSupport::Concern` to make it
easily pluggable to an existing `ActiveJob` class:

```ruby
require 'sneakers'

module PerformDelayed
  extend ActiveSupport::Concern

  class_methods do
    def perform_later(*args, opts)
      # If a job does not specify `:wait`, just process it normally
      return super unless opts.is_a?(Hash) && opts[:wait]

      # Otherwise, publish it on the delayed message exchange setting the
      # `x-delay` header
      job = new(*args, opts.without(:wait))
      delayed_publisher.publish(
        ActiveSupport::JSON.encode(job.serialize),
        headers: { 'x-delay' => opts[:wait].to_i * 1000 },
        routing_key: job.queue_name)

      # Log in the usual ActiveJob format, to make debugging easier
      Rails.logger.info("[ActiveJob] #{self.name} (Job ID: #{job.job_id}) to PerformDelayed(#{job.queue_name}) with arguments: #{args.map(&:inspect).join(', ')}, #{opts.inspect}")
    end

    def delayed_publisher
      # Cache the publisher at the class level, so that all job instances of
      # the including class will reuse the same
      @delayed_publisher ||= create_delayed_publisher!
    end

    private def create_delayed_publisher!
      # Idempotently create the delayed message exchange and the queue, then
      # create a publisher for them
      opts = {
        exchange: 'delayed.exchange',
        exchange_options: {
          type: 'x-delayed-message',
          arguments: { 'x-delayed-type' => 'direct' },
          durable: true,
          auto_delete: false
        }
      }
      delayed_publisher = Sneakers::Publisher.new(opts)
      delayed_publisher.ensure_connection!
      queue = delayed_publisher.channel.queue(queue_name,
        Sneakers::CONFIG.merge(opts)[:queue_options])
      queue.bind(delayed_publisher.exchange, routing_key: queue_name)
      delayed_publisher
    end
  end
end
```

In order to schedule a delayed job, I then just have to include this concern in
the job class:

```ruby
class SomeJob < ApplicationJob
  include PerformDelayed
  queue_as :default

  def perform(*args)
    # actually perform work
  end
end
```

I can now schedule delayed jobs with a given delay using the standard `wait:
<seconds>` option:

```ruby
SomeJob.perform_later(some_argument, wait: 5.minutes)
```

## Wrapping up

RabbitMQ is an excellent messaging queue system (although merit and demerit,
when speaking about technologies, is
[always contextual](/blog/2017/11/13/on-software-engineering-and-trade-offs.html),
so be skeptical of anyone saying "if you don't use X, you're doing it wrong").
Sneakers offers a nice adapter to use RabbitMQ as a backend for `ActiveJob` in
Ruby on Rails, but unfortunately it does not implement delayed jobs out of the
box.

Luckily, this feature is easy to implement, as shown in this post. With a little
more effort, one can also implement support for the `wait_until: <point in
time>` option, which is left as an excercise to the reader :)
