---
layout: post
title: "Non-primitive properties, CoffeeScript inheritance and class macros"
date: 2013-03-03 13:07
comments: true
categories: [JavaScript, CoffeeScript, inheritance]
---

JavaScript's prototypal inheritance paradigm is easy to understand, but can
lead to nasty surprises when it comes to non-primitive properties. While the
issue I discuss here is a purely JavaScript one, the fact that the awesome
CoffeeScript syntax make it so easy to implement classes and extend them leads
developers to run more frequently into this kind of situations.


The Issue with Non-Primitive Properties
---------------------------------------

The issue can occur whenever we have a CoffeeScript class (or JavaScript
constructor) with a property which is not of a primitive type (here an `Array`,
but basically anything which is not `number`, `string`, `boolean`, `null` nor
`undefined`):

```coffeescript
class Person
  needs: ["eat", "drink", "breath"]
```

Now let's create two instances, and let's modify this non-primitive property on
one of them:

```coffeescript
guy   = new Person
maker = new Person

maker.needs.push "create"

console.log maker.needs # => ["eat", "drink", "breath", "create"]
# Ok, looks good

console.log guy.needs   # => ["eat", "drink", "breath", "create"]
# Wait... what? `guy` got the "create" need added too?!?
```

This issue occurs because the `needs` property is stored in the shared
`[[Prototype]]`. If we reassign the property on an instance, it gets its own
version, but if we only modify the property, it stays in the `[[Prototype]]`
and the changes are shared among instances.

<!-- more -->

The Solution
------------

There is a simple solution to this, which is to initialize the property in the
constructor, so that the property is stored in the instance and not in the
`[[Prototype]]`:

```coffeescript
class Person
  constructor: ->
    @needs = ["eat", "drink", "breath"]
```

Alternatively, it is possible to proxy changes to this property through a
method, that takes care of cloning the property in the object before changing
it. It is ok to share the property in the `[[Prototype]]`, and move it in the
object only if and when we modify it:

```coffeescript
class Person
  needs: ["eat", "drink", "breath"]

  addNeed: ( need ) ->
    # Copy over the needs array to the object if it was stored in the
    # [[Prototype]] so far:
    @needs = @needs[..] unless @hasOwnProperty "needs"
    # Now safely add the new item:
    @needs.push need

guy   = new Person
maker = new Person

maker.addNeed "create"

console.log maker.needs # => ["eat", "drink", "breath", "create"]
console.log guy.needs   # => ["eat", "drink", "breath"]
# Working as expected :)
```

This fixes the problem and also maintains the property in the `[[Prototype]]`,
which has the advantage of making the property inheritable when the class is
extended, even if we change the constructor function. Obviously, all changes to
the property need to happen through the accessor methods and not directly
manipulating it (it is a good idea to prefix the property name with "_", to
indicate that it should be considered private).


Inheritance, Class Macros and Non-Primitive Properties
------------------------------------------------------

CoffeeScript makes it easy to implement Ruby-like class macros. A class macro
is a class method which is intended to be called whithin the definition block
of a subclass to enable some feature. An example in Ruby is the `attr_accessor`
method of the `Module` class.

Class macros in CoffeeScript are very easy to implement, as the `class` block
is executed in the scope of the newly-defined class:

```coffeescript
class LivingBeing
  # Class method to be used as a class macro:
  @addNeeds: ( needs... ) ->
    # Create the needs array on `LivingBeing.prototype` if necessary
    @::needs ?= []
    # Push needs
    @::needs.push need for need in needs

class Person extends LivingBeing
  @addNeeds "eat", "drink", "breath"

guy = new Person
console.log guy.needs # => ["eat", "drink", "breath"]
# Ok, works like expected
```

It is clear, though, that we are running into the same issue as before:

```coffeescript
class Maker extends Person
  @addNeeds "create"

maker = new Maker
console.log maker.needs # => ["eat", "drink", "breath", "create"]
# Ok so far

console.log guy.needs # => ["eat", "drink", "breath", "create"]
# Oooops... we added the "create" need to the regular guy too!
```

Again, we can use the strategy described before to fix the `addNeeds` class
macro, maintaining the property deeper in the prototype chain as long as it's
not modified, and copying it over when changed:

```coffeescript
class LivingBeing
  # Class method to be used as a class macro:
  @addNeeds: ( needs... ) ->
    # Create the needs array on `LivingBeing.prototype` if necessary
    @::needs ?= []
    # Copy over the needs array if it was previously stored deeper in the
    # prototype chain:
    @::needs = @::needs[..] unless @::hasOwnProperty "needs"
    # Push needs
    @::needs.push need for need in needs

  addNeed: ( need ) ->
    # instance method to add needs on a particular instance.
    # Implementation is the same as above, and omitted for brevity.
```

This fixes the issue and lets us use the nice class macro paradigm. Of course,
if the property was an object with nested properties, we would need to
deep-copy it. In this case, a `deepCopy` utility comes handy.
