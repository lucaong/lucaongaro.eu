---
layout: post
title: "DOM Selection without jQuery"
date: 2012-11-26 00:26
comments: true
categories: [JavaScript, DOM, HTML5]
---

Because jQuery is so easy to use, we sometimes rely on it even for task that could be easily achieved using native browser APIs. While there is nothing wrong with jQuery, going native makes our code more portable and often more performant.

DOM selection is one example of something straightforward to achieve without jQuery: the **HTML5 Selectors API** has been around for quite some time now, and it's supported in all modern browsers and in IE down to version 8. Its implementation is based on the `querySelector` family of methods, that includes four members:

- `document.querySelector( selector )` takes a CSS selector string and returns the first DOM element that matches the query, or `null` if no match is found.

- `element.querySelector( selector )` does the same, but searching only among the descendants of `element`.

- `document.querySelectorAll( selector )` takes a CSS selector string and returns a non-live `NodeList` of all the DOM elements matching the query. If no element matches the selector, an empty list is returned.

- `element.querySelectorAll( selector )` does the same as its counterpart defined on `document`, but again searching only among the descendants of `element`.


NodeList vs. Array
------------------

One important gotcha is that `querySelectorAll` methods return a `NodeList`, which looks like an array but, a part the fact that its elements can be accessed by index, and that it has a `length` property, it does not support any of the array methods.

Do _not_ try to turn it into an array with something like `Array.prototype.slice.apply( nodeList )`: although it does work in some browsers, it fails in others, as `NodeList` is a _host object_ and, as such, there is no guarantee that Array methods like `slice` can be applied on it. Instead, the only reliable way to turn it into an array is to loop through all its items and populate an array:

```javascript
var ary = [],
    list = document.querySelectorAll(".foo");

for (var i = 0; i < list.length; i++ ) {
	ary[ i ] = list[ i ];
}
```

The good news is that there seem to be no performance losses compared to the `Array.prototype.slice` method. Also, as soon as ES.next will make its appearence in the browser world, we will get a very useful `Array.from` method, that will turn `NodeList` (and other not-quite-an-array objects like `arguments`) into a proper Array in a breeze.


Building a nano-library
-----------------------

With these things in mind, it is trivial to build a microscopic but very efficient library for DOM selection:

```javascript
// Build the DOM selection query
function $q( selector, ctx ) {

  // Return methods for lazy evaluation of the query
  return {

    // Return array of all matching
    all: function() {
      var list, ary = [];
      ctx = ctx || document;
      list = ctx.querySelectorAll( selector );
      for ( var i = 0; i < list.length; i++ ) {
        ary[ i ] = list[ i ];
      }
      return ary;
    },

    // Return first match
    first: function() {
      ctx = ctx || document;
      return ctx.querySelector( selector );
    },

    // Return last match
    last: function() {
      ctx = ctx || document;
      var list = ctx.querySelectorAll( selector );
      return list.length > 0 ? list[ list.length - 1 ] : null;
    }

  };

}
```

This nano-library is only about 30 lines long, but it is way more performant than jQuery or Zepto for DOM selection tasks (try benchmarking it yourself with JSPerf), and it is still very straightforward to use and legible:

```javascript
var query = $q(".foo .bar"); // build the query

query.first() // => first element matching the selector, or null
query.all()   // => all elements matching the selector

// Or restrict the query to the descendant of an element:
var query2 = $q(".foo", elem); // Assuming that elem is a DOM element

query2.first() // => first descendant of elem matching the selector, or null
query2.all()   // => all descendant of elem matching the selector
```


One last missing feature
------------------------

A useful addition for this nano library would be a `matches` method, that returns true if a selector matches an element, and false otherwise. A trivial but inefficient way to do this is running a query using the selector, and then searching if the element is present among the results. A simpler approach will soon be available with the **Selectors API Level 2**, using the `element.matchesSelector( selector )` method. Firefox and Chrome already provide a prefixed version of this method in their latest versions (`element.mozMatchesSelector` and `element.webkitMatchesSelector`), and hopefully a standard implementation will come soon on all browsers.

Read more on this topic
-----------------------

- [Selectors API on MDN](https://developer.mozilla.org/en-US/docs/DOM/Locating_DOM_elements_using_selectors)
- [Selectors API Level 2 working draft](http://www.w3.org/TR/selectors-api2/)