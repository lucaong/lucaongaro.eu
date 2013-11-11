---
layout: post
title: "Scala Pattern Matching and Validation of Structured Input"
date: 2013-11-10 20:44
comments: true
categories: [Scala]
---

*Pattern Matching* is for sure one of the most powerful features in Scala
(kindly borrowed from Haskell). Nonetheless, developers approaching the
language for the first time might sometimes wonder where it is actually useful
in real life. In this post, I describe one particular real life scenario in
which Pattern Matching shines: validation of structured input.

For the purpose of the argument, suppose we have an application that deals with
bank accounts, expressed as
[IBAN codes](http://en.wikipedia.org/wiki/International_Bank_Account_Number)
(International Bank Account Numbers). IBAN can have different formats depending
on the country, but they all follow certain rules:

  - They begin with a country code followed by two digits used for the checksum
    calculation
  - They must only contain digits and the 26 latin alphabetic characters from A
    to Z
  - It is possible to validate them by calculating a checksum

Imagine that our system needs to accept an IBAN from user input, validate it,
and decompose it into its part so that we can use it. One naive way would be to
create different methods that takes care of validation and access to the
various components of the IBAN code:

```scala
// Suboptimal example.
// A better solution is explained after
class IBAN( code: String ) {
  def isValid: Boolean = {
    // Perform checksum validation here...
  }

  def country = {
    code.take( 2 )
  }

  def account = {
    code.drop( 4 )
  }
}
```

This imperative style is quite brittle. Whenever we accept an IBAN we want to
validate and decompose it before use, so this solution would lead to a big
amount of repetition and the risk of forgetting to handle invalid codes:

```scala
val iban = new IBAN( userInput )

if ( iban.isValid ) {
  val account = iban.account
  val country = iban.country

  if ( country == "DE" )
    // ...German IBAN, do something
  if ( country == "IT" )
    // ...Italian IBAN, do something else
  else
    // ...IBAN from other country
} else {
  // Handle invalid IBAN. What if we forget?
}
```

A much better way is to create our custom extractor, to enable pattern matching
on valid IBAN strings (explaining custom extractors is not in the scope of this
post, but if needed you can read [this awesome article](http://danielwestheide.com/blog/2012/11/21/the-neophytes-guide-to-scala-part-1-extractors.html)):

```scala
object IBAN {
  def unapply( code: String ): Option[(String, String)] = {
    // Match a Regex for format
    // validation and decomposing
    val IBANPattern = """([A-Z]{2})(\d){2}([A-Z0-9]{12,27})""".r

    code match {
      case IBANPattern( country, check, account ) =>
        if ( checksumIsValid( country, check, account ) )
          // The `check` part is only used for checksum
          // validation, no need to return it
          Some( (country, account) )
        else
          None
      case _ => None
    }
  }

  private def checksumIsValid(
    country: String,
    check:   String,
    account: String
  ): Boolean = {
    // Perform checksum validation here...
  }
}
```

This extractor makes it possible to match a string and, in case it is a valid
IBAN, obtain its components. Pattern matching in this situation makes handling
of valid and invalid IBAN very explicit:

```scala
userInput match {
  case IBAN( country, account ) =>
    // ...valid IBAN, do something with it
  case _ =>
    // ...invalid IBAN, provide proper feedback.
}
```

Note how the compiler would not have let us forget to handle the invalid case.
Also, we can easily handle accounts from different countries separately:

```scala
userInput match {
  case IBAN( "DE", account ) =>
    // ...valid German IBAN
  case IBAN( "IT", account ) =>
    // ...valid Italian IBAN
  case IBAN( country, account ) =>
    // ...valid IBAN from another country
  case _ =>
    // ...invalid IBAN
}
```

The code that handles validation and decomposition stays in one single object,
only responsible of these two operation that always go together. Freed from
validation/decomposition concerns, the rest of the application code also
becomes very legible, with a clear and symmetric way to handle the case of
invalid input.
