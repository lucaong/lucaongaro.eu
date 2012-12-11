---
layout: post
title: "Polyfilling the details tag"
date: 2012-12-10 22:54
comments: true
categories: [HTML5, DOM, JavaScript, CSS]
---

A common feature in many UIs is a widget that can be hidden or shown by clicking on some handle. Some examples are "accordions" or collapsible/expandable sections and navigation menus. Usually the functionality is quite simply achieved with some JavaScript code that toggles the `display` property of some elements when a handle is clicked.

HTML5 adds two new tags that can theoretically be used to achieve the same effect without any JavaScript code: the `details` and the `summary` tags. Here is an excerpt from the [HTML5 spec](http://www.whatwg.org/specs/web-apps/current-work/multipage/interactive-elements.html#the-details-element):

> The details element represents a disclosure widget from which the user can obtain additional information or controls. [...]
>
> The first summary element child of the element, if any, represents the summary or legend of the details. If there is no child summary element, the user agent should provide its own legend (e.g. "Details").
>
> The rest of the element's contents represents the additional information or controls.
>
> The open content attribute is a boolean attribute. If present, it indicates that both the summary and the additional information is to be shown to the user. If the attribute is absent, only the summary is to be shown.

In other words, `details` is a block-level tag with a boolean `open` attribute that controls its visibility, and it usually have a nested `summary` tag that is always visible and represent the "handle" that toggles the `open` attribute, and thus the visibility, on and off.

Cool, isn't it? Well, unfortunately support is currently quite poor, as at the moment only WebKit seems to properly implement it. The big question is: can we easily polyfill it and start using it in the real world?

<!-- more -->

Polyfilling: an action plan
---------------------------

Provided that we could write a reasonably good polyfill, we could start using this feature right now. The general idea is:

1. Detecting support for the interactive behavior of the `details` tag
2. If not available natively, adding support for setting/unsetting the `open` attribute when clicking on the `summary` element with JavaScript
3. Styling the open and not open states with CSS, so that the widget looks the same in all browsers

Feature detection
-----------------

This is easy in theory:

```javascript
var detailsSupported = (function() {
    return ( 'open' in document.createElement('details') );
})();
```

While simple and quick, this feature detection technique unfortunately gives false positives in some old Chrome versions (like version 10), as noted [here](http://mathiasbynens.be/notes/html5-details-jquery#comment-35). I personally think that in most practical applications this is good enough, but `Modernizr` has a feature detection method that, despite being longer and more complicated, it is virtually bulletproof (it basically adds a `details` element to the body, toggles its `open` attribute and check if the `offsetHeight` changes).

Adding interactivity in modern browsers
---------------------------------------

If support for IE8 or earlier is not a concern (in a fictional ideal world :P ), things can be very easy. On the JavaScript side it is just a matter of binding to click events on the `summary` and toggling the `open` attribute. We will use event delegation to make the polyfill robust to DOM insertions:

```javascript
(function() {
  // If interactive behavior of `details` element is not supported
  // we have to manually toggle its `open` attribute
  if ( !detailsSupported ) {

    // Bind to click events on document
    document.addEventListener( "click", function( evt ) {

        var target = evt.target,
            parent = target.parentElement;

        // We are only interested in `summary` elements
        // which are children of `details` elements
        if ( target.tagName.toLowerCase() !== "summary" || !parent || parent.tagName.toLowerCase() !== "details" ) {
            return;
        }

        // toggle the "open" attribute on `details`
        if ( parent.hasAttribute("open") ) {
            parent.removeAttribute("open");
        } else {
            parent.setAttribute( "open", "open" );
        }

    }, false );
  }​
})();
```

For what regards CSS, we basically need to hide everything in the `details` tag apart from `summary` when `open` is not set, and display everything when `open` is set. There are only two minor difficulties here:

First, we cannot set `display: none` on `details`, because otherwise we would have no way to show the nested `summary` element. Furthermore, we want to hide the **content** of the `details` tag, not the element itself. This can be solved by hiding the _text content_ of `deatils` by setting `font-size` and `line-height` to 0 and `color` to trasparent (with the short-hand `font: 0/0 a; color: transparent;` used by the excellent [Bourbon](http://bourbon.io/)), and then setting `display: none` to all children but `summary`.

Second, if we hid the inner elements by default, when `open` is set we would need to restore the original `display` value of inner elements, which in theory could be anything like `block`, `inline`, `inline-block`, etc. Instead, the solution is to do the opposite and use the `:not` pseudo-class to hide all children of `details` when `open` is not present or, in CSS jargon, `:not([open])`.

The resulting CSS is something like the following:

```css
\* Hide the marker in Chrome *\
summary::-webkit-details-marker {
    display: none;
}

\* hide the text content of `details` when not open *\
details:not([open]) {
    display: block;
    font: 0/0 a;
    color: transparent;
}

\* hide children of `details` when not open *\
details:not([open]) * {
    display: none;
}

\* always show `summary` *\
details summary, details:not([open]) summary {
    display: block;
    font-size: 16px;
    line-height: 1.15em;
    color: black;
    outline: none;
}
```

IE8 and earlier, where things starts to suck
--------------------------------------------

So far so good, but many times, even if reluctant, we have to support the infamous legacy IE versions. The main problem is that IE8 and earlier do not support the `:not` CSS pseudo-class, which is vital for our polyfill. Also, the JavaScript event-handling logic is non-standard. One possible solution is to use JavaScript to set a `not-open` class whenever we remove the `open` attribute, so that we can select for it. Unfortunately old IE version discard the entire rule when they encounter a selector that they do not support, so we have either to duplicate CSS or to make use of this `not-open` class only, also in browsers that would support the `:not` pseudo-class.

Also, we have to set this class on every non-open `details` tag upon page load and whenever new `details` elements are added to the DOM. This deviates from the standard behavior, and needs additional effort whenever we make use of lazy client-side rendering.

The resulting JavaScript becomes something like:

```javascript
// If interactive behavior of "details" element is not supported
// we have to manually toggle its "open" attribute
if ( !detailsSupported ) {
    (function() {
        var details_tags = document.getElementsByTagName("details");
            clickHandler = function( evt ) {
              var target = evt.target || evt.srcElement,
                  parent = target.parentElement;


              // We are only interested in "summary" elements children of
              // "details" elements
              if ( target.tagName.toLowerCase() !== "summary" || !parent || parent.tagName.toLowerCase() !== "details" ) {
                  return;
              }

              // If parent is a "details" element
              // toggle its "open" attribute (and "not-open" class)
              parent.className = parent.className.replace(/(\b)(not-open)(\b)/, function( match, sub1, sub2, sub3 ) {
                  return ( sub1 + sub3 ).replace(/\s+/, " ");
              });
              if ( parent.hasAttribute("open") ) {
                  parent.removeAttribute("open");
                  parent.className += " not-open";
              } else {
                  parent.setAttribute( "open", "open" );
              }
          };
    
        // Bind to click events on document
        if ( document.addEventListener ) {
          document.addEventListener( "click", clickHandler, false );
        } else {
          document.attachEvent( "onclick", clickHandler );
        }
    })();
}​

// At the end of the body, we can set the `not-open` class
// where needed. This should be done also whenever new `details`
// tags are added to the DOM...
(function() {
  for ( var i = 0, len = details_tags.length; i < len; i++ ) {
      if ( !details_tags[ i ].hasAttribute("open") && !details_tags[ i ].className.match(/\bnot-open\b/) ) {
          details_tags[ i ].className += " not-open";
      }
  }
})();
```

And the resulting CSS is the same as before, but using the `not-open` class instead of `:not([open])`:

```css
\* Hide the marker in Chrome *\
summary::-webkit-details-marker {
    display: none;
}

\* hide the text content of `details` *\
details.not-open {
    display: block;
    font: 0/0 a;
    color: transparent;
}

\* hide children of `details` when not open *\
details.not-open * {
    display: none;
}

\* always show `summary` *\
details summary, details.not-open summary {
    display: block;
    font-size: 16px;
    line-height: 1.15em;
    color: black;
    outline: none;
}​
```


Conclusion
----------

The HTML5 `details` and `summary` tags are a very useful addition to the DOM, as they cover a very common use case in UI design. The real problem is not really the lack of support, but more the difficulty of implementing a proper cross-browser polyfill that respects the HTML5 spec, without being too overkill. While on modern browsers we can start using this feature now, on old IE versions polyfilling has drawbacks and is arguably less nice than a full JavaScript solution that does not try to patch support for `summary`.