---

title: Delayed jobs with Rails and RabbitMQ
date: 2018-07-31 15:34 CEST
tags: activejob, jobs, rabbitmq, rails, sneakers, delayed, ruby, programming

---

I recently had the need to schedule background jobs with a specified delay into
the future from a Ruby on Rails application. I had to implement a retry
mechanism with backoff, so I needed to be able to express something like
"execute job X, but wait Y seconds before doing so". Clearly, I needed this
mechanism to be non-blocking: if a job is scheduled 5 minutes in the future, the
workers should be free to process other jobs in the meantime.

Some popular `ActiveJob` adapters like Resque or Sidekiq implement this feature,
which is exposed in the `ActiveJob` API as the `wait: <seconds>` option:

```ruby
SomeJob.set(wait: 5.minutes).perform_later(some_argument)
```

My adapter of choice though is [Sneakers](http://jondot.github.io/sneakers/),
which is based on the superb [RabbitMQ](https://www.rabbitmq.com).
Unfortunately, as of July 2018, the Sneakers adapter does not implement delayed
jobs out of the box, as the feature table for `ActiveJob::QueueAdapters`
dutyfully reports (copied from the [official
docs](https://api.rubyonrails.org/classes/ActiveJob/QueueAdapters.html)):

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

Sneakers and RabbitMQ are a perfect fit for my specific application: we leverage
the highly available queues and versatile AMQP semantics for several use-cases,
involving services written in other languages than Ruby. For example, our
RabbitMQ exposes a MQTT frontend that collects metrics from our IoT devices, and
makes it possible to implement several decoupled data processing pipelines,
something cumbersome to implement with Rails-specific queuing mechanisms.
Therefore, changing the queue backend just for this feature was not a desireable
option: I decided to implement the missing feature instead, and I will show you
how.

Luckily, there exists a well designed RabbitMQ plugin that does exactly what I
needed, so I just had to write the adapter logic for it. The plugin is called
[`rabbitmq_delayed_message_exchange`](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange),
and can be easily added to an existing RabbitMQ installation by downloading
the binary build, putting it into the plugins directory, and enabling it.

The plugin is well-documented and fairly straightforward to use, for those
familiar with RabbitMQ and AMQP. In order to schedule delayed messages, one
just has to:

  1. Declare an exchange with type `x-delayed-message`, and an extra
     `x-delayed-type` header to indicate the desired routing semantic to follow
     after the delay elapses (like "direct", or "topic", etc.).
  2. Publish messages on that exchange, providing an `x-delay` header indicating
     the desired delay in milliseconds.
  3. Queues bound to the exchange will then receive the message after the given
     delay elapses, and from this point on everything works according to the
     standard AMQP protocol.

What was missing was only the integration between this plugin and our Rails +
ActiveJob + Sneakers setup. Essentially, I needed to publish jobs that specify a
delay on a `x-delayed-message` exchange, setting the `x-delay` header. Also, it
was necessary to make sure that the delayed exchange actually exists, and that
the queue on which we want to route the job is bound to it.

Here's the code that I ended up writing. It re-defines the `enqueue_at` method
on the `SneakersAdapter` (the original implementation just raises a
`NotImplementedError`, so augmenting the original class is a reasonable option
here):

```ruby
require 'sneakers'

module Sneakers
  module DelayedJobSupport
    def enqueue_at(job, timestamp)
      delay = timestamp - Time.current.to_f
      # Just enqueue job if delay is zero or negative
      return enqueue(job) if delay < 0

      # Ensure queue is bound to the delayed message exchange
      self.class.ensure_delayed_exchange_bound(job.queue_name)

      # Publish on the delayed message exchange
      self.class.delayed_publisher.publish(
        ActiveSupport::JSON.encode(job.serialize),
        headers: { 'x-delay' => (delay.to_f * 1000).to_i },
        routing_key: job.queue_name)
    end

    module ClassMethods
      def delayed_publisher
        @delayed_publisher ||= Sneakers::Publisher.new({
          exchange: 'delayed.exchange',
          exchange_options: {
            type: 'x-delayed-message',
            arguments: { 'x-delayed-type' => 'direct' },
            durable: true,
            auto_delete: false
          }
        })
      end

      # The first time a queue receives a delayed job, make sure
      # that the queue is bound to the delayed message exchange
      def ensure_delayed_exchange_bound(queue_name)
        @bound_to_delayed_exchange ||= {}
        return nil if @bound_to_delayed_exchange[queue_name].present?
        delayed_publisher.ensure_connection!
        queue = delayed_publisher.channel.queue(queue_name, Sneakers::CONFIG[:queue_options])
        queue.bind(delayed_publisher.exchange, routing_key: queue_name)
        @bound_to_delayed_exchange[queue_name] = true
      end
    end
  end
end

module ActiveJob
  module QueueAdapters
    class SneakersAdapter
      # Add support for delayed jobs to SneakersAdapter
      extend Sneakers::DelayedJobSupport::ClassMethods
      prepend Sneakers::DelayedJobSupport
    end
  end
end
```

I can now schedule jobs with a given delay using the standard `wait: <seconds>`
or `wait_until: <timestamp>` options:

```ruby
SomeJob.set(wait: 5.minutes).perform_later(some_argument)

SomeJob.set(wait_until: 10.minutes.from_now).perform_later(some_argument)
```

## Wrapping up

RabbitMQ is an excellent messaging queue system (although merits and demerits,
when speaking about technologies, are
[always contextual](/blog/2017/11/13/on-software-engineering-and-trade-offs.html),
so be skeptical of anyone saying "if you don't use X, you're doing it wrong").
Sneakers offers a nice adapter to use RabbitMQ as an `ActiveJob` backend in
Ruby on Rails. Unfortunately, it does not implement delayed jobs out of the
box.

Luckily, with the help of a nice semi-official plugin, this feature is easy to
implement, as shown in this post.
