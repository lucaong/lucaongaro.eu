---

title: MiniSearch, a client-side full-text search engine
date: 2019-01-30 16:08 CET
tags: javascript, programming, search, full-text, algorithms, data structures

---

This blog post is to introduce
[MiniSearch](https://github.com/lucaong/minisearch), a JavaScript library that
provides **client-side full-text search** capabilities. It has zero runtime
dependencies, and uses a space optimized index to support memory constrained
environments like mobile browsers. It offers **prefix search**, **fuzzy match**,
**boosting**, **auto suggestions**, and many of the features expected from a
server-side search engine like Solr or ElasticSearch.

**MiniSearch** is designed to be flexible and easy to use, and I think that a
quick example can introduce it better than a long explanation:

```javascript
// A collection of documents we want to search among
const documents = [
  { id: 1, title: 'Moby Dick', text: 'Call me Ishmael. Some years ago...' },
  { id: 2, title: 'Zen and the Art of Motorcycle Maintenance', text: 'I can see by my watch...' },
  { id: 3, title: 'Neuromancer', text: 'The sky above the port was...' },
  { id: 4, title: 'Zen and the Art of Archery', text: 'At first sight it must seem...' },
  // ...and more
]

// Create the search engine, and set `title` and `text` as searchable fields
let miniSearch = new MiniSearch({ fields: ['title', 'text'] })

// Index all documents (this is fast!)
miniSearch.addAll(documents)

// Search with default options. It will return the id of the matching documents,
// along with a relevance score and match information
miniSearch.search('zen art motorcycle')
// => [ { id: 2, score: 2.77258, match: { ... } }, { id: 4, score: 1.38629, match: { ... } } ]

// Search only within specific fields
miniSearch.search('zen', { fields: ['title'] })

// Boost some fields to give them more importance (here "title")
miniSearch.search('zen', { boost: { title: 2 } })

// Prefix search (so that 'moto' will match 'motorcycle')
miniSearch.search('moto', { prefix: true })

// Fuzzy search, in this example, with a max edit distance of 0.2 * term length.
// The mispelled 'ismael' will match 'ishmael'.
miniSearch.search('ismael', { fuzzy: 0.2 })

// Get suggestions for a partial search
miniSearch.autoSuggest('zen ar')
// => [ { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
//      { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 } ]
```

Here is a small demo application to play with, and experiment with different
options:

<iframe src='https://lucaong.github.io/minisearch/examples/'
style='border: none; background: white; box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
border-radius: 5px; width: 100%; height: 440px; margin: 0 0 1.81em 0;'></iframe>

As can be tested in the demo, the **~5000 songs** are indexed client-side upon
each page load in a fraction of a second, and the search happens in **real
time** as the user types, with no detectable latency.


## What's the point of a client-side search engine?

Recently, for a web application I was working on, I needed to allow users to
search for products in the inventory of several resellers. Each of these
resellers typically offers several thousands different products. The app needed
to offer advanced full-text features like **fuzzy match** (finding results also
when a term does not match exactly, for example due to a mispell), **prefix
search** (searching for the initial part of a term should already yield results
before the whole word is typed in), and proper **ranking of results** (more
relevant results should appear first).

Normally, for such use cases, a search engine like **Solr** or **ElasticSearch**
would be the obvious choice. The challenge though, was to make search as fast as
possible, but also resilient to spotty Internet connections on users'
smartphones. I started to think whether it would make sense to implement the
search index **client-side instead of server-side**: it might sound a bit
unorthodox, but a client-side search engine has several advantages.

First, once the index is loaded, a temporary interruption of the Internet
connectivity would not affect the search experience: if the search index lives
on the client side, **no network request is necessary**. Moreover, there would
be no need to setup and run a search server, making the architecture simpler.
Running the search engine client-side is also **inherently scalable**: no
additional load is placed on the server when more users access the platform, as
each of them is running their own instance of the search engine in their
browser. Finally, with a good implementation, search can be made much faster, as
network latency is eliminated entirely, and results can be computed in real time
as the user types.

Of course, there are limits to how big a collection of documents can be in order
to fit in the browser memory, but these limits are **surprisingly high**,
especially when using the right data structures. Some use cases that are served
well by client-side search are, for example, product search for a medium-sized
online shop, search through a blog, or address book search. Proper full-text
search can give a much better user experience compared to a crude string
comparison or regular expression search, due to better ranking of results and
handling of mispelled terms.

## Implementing the index

As a rough calculation, if we have 5000 documents to search among, and each
document is on average 200 characters long (either documents are small, or we
are only iterested in searching by title, or within a small description), then
storing all the documents in uncompressed form takes roughly 2MB (JavaScript
strings are typically stored using 2 bytes per character). That is more or less
the size of a good quality image, and usually more than acceptable to store in
memory.

There is one problem with this calculation though: it is only taking into
account the size of the raw documents, not of the search index data. Typical
implementations of inverse indexes for full-text search, **trade off space
utilization for lookup efficiency**, and therefore take a lot more space than
the original documents. This is not a problem for search engines running
server-side, where data can be stored on disk, and also RAM is plenty, but it is
not acceptable if the index data has to live in the browser memory. Can we
devise a data structure that is **at the same time compact and efficient**?

Luckily, there are some good candidates. One data structure that fits our
requirements particularily well, and therefore the one I ended up choosing, is
the [radix tree](https://en.wikipedia.org/wiki/Radix_tree): it is a variant of a
prefix tree that further optimizes space by merging nodes that are the only
children with their parent. A radix tree is a great candidate for our space
constrained inverted index because:

  1. It supports **efficient lookup** of a term, in time proportional to the
     length of the term being searched. The same holds for insertion and
     deletion.
  2. Being it a prefix tree, searching for all terms **having a certain prefix**
     is also efficient, and takes time proportional to the length of the prefix.
  3. The data structure is compact, because **common prefixes are stored only
     once**. Because of that, in some cases the index could even be smaller than
     the original collection of documents. In general, the index size will be of
     the same order of dimension as the size of the collection of documents.
  4. **"Fuzzy" search**, which is searching for terms within a maximum [edit
     distance](https://en.wikipedia.org/wiki/Edit_distance) from a given term,
     can also be implemented. It cannot be as efficient as in other techniques
     like [n-gram](https://en.wikipedia.org/wiki/N-gram) indexes, but for small
     edit distances it can be made efficient enough. Also, as the search happens
     client-side, it makes sense to use a bit more CPU, while keeping the index
     smaller. Other data structures allowing for efficient fuzzy search would
     take a lot more space.

Implementing a radix tree in JavaScript takes a little patience, but with a good
amount of testing [it is not
difficult](https://github.com/lucaong/minisearch/blob/master/src/SearchableMap/SearchableMap.js)
(and can be quite enjoyable if you are a data structure enthusiast like me).
Along with the necessary unit tests, I find especially valuable in algorithmic
code to add some generative **property based tests**, to discover unforeseen
corner cases.

Building on the foundations of a well-tested radix tree implementation, the
search engine is mostly a matter of building up the index in a way that supports
all the planned features (boosting, search in a specific field, etc.), and
following well researched ranking algorithms like
[Tf-Idf](https://en.wikipedia.org/wiki/Tf–idf). The most complex part was
implementing fuzzy search, which is done by traversing the radix tree while
maintaining a "budget" of edits: if we are looking for the word "color" within
an edit distance of 2, we will find "colour" (edit distance 1), and "connor"
(edit distance 2), but not "colorful" (edit distance 3, exceeding budget).

A suite of [performance
benchmarks](https://github.com/lucaong/minisearch/tree/master/benchmarks) also
provides a convenient way to measure performance improvements and avoid
regressions. Measuring performance in a rigorous way is especially important for
algorithmic code, where it is otherwise far too common to make the mistake of
implementing "optimizations" that obfuscate the code while not giving any
tangible benefit.

## Comparison with other libraries

**MiniSearch** is not the only library of its kind. There are a few other
libraries with similar goals, among which [Lunr.js](https://lunrjs.com) and
[Fuse.js](http://fusejs.io). These libraries are well implemented, and although
they all provide client-side full-text search, they have different use cases and
feature sets.

**Fuse.js** is optimized for smaller collections of documents: it uses the
[Bitap algorithm](https://en.wikipedia.org/wiki/Bitap_algorithm), that provides
good fuzzy matching, but iterates through the whole collection of documents upon
each search. For this reason it is not ideal for my use case, where Fuse.js
incurs in a noticeable delay. Despite this shortcoming, for small collections
Fuse.js works quite well and is easy to use.

**Lunr.js** is probably the most similar library. Its implementation is quite
similar to MiniSearch, and it performs similarily. The project is well
maintained, and I can definitely recommend it, having used it in several
projects before switching to MiniSearch. The main differences with MiniSearch
are the following:

  1. MiniSearch index takes **sensibly less space** than Lunr's one. On my
     applications, MiniSearch typically uses less than half of the space used by
     Lunr, for the same collection. This was one of the main design goals of
     MiniSearch, in order to support memory-constrained cases like mobile apps.
     That said, Lunr is already quite space optimized, so for many use cases
     this difference won't be too important.
  2. Lunr comes with **stemming and language support**. MiniSearch provides the
     facilities to add those, but does not provide them out of the box.
     Stemming and language support are useful features, but they are often not
     needed, make the library bigger, and can sometimes lead to unexpected
     results. For these reasons, I chose to leave them out of scope for
     MiniSearch, and explain instead in the docs how to add them, if needed.
     That said, if you know you need them, Lunr might be an easier choice.
  3. Lunr index cannot be changed after creation. MiniSearch instead makes it
     possible to **add and remove documents** to the index at any moment. If
     documents in your collection can be edited by the user, then MiniSearch
     makes it possible to index just the documents that change, instead of
     re-indexing the whole collection.
  4. Lunr provides an **advanced query language** that can express some queries
     that are currently not possible in MiniSearch. For example, Lunr can search
     for terms that start with "uni" and end with "ty", but have any character
     in the middle, like "unity" and "university". On the other hand, if you do
     not need those, you might find MiniSearch API simpler to use.
  5. MiniSearch offers an **auto-suggestion** feature out of the box. For
     example, for the partial search "uni", MiniSearch could suggest
     "university", "unicorn", etc. The suggestions are calculated on the actual
     documents, and sorted by relevance. This feature can be used to implement
     auto-completion, like in the demo application shown above. Lunr does not
     currently offer this feature.

Notably, MiniSearch, Lunr, and Fuse.js all come with zero runtime dependencies,
which is quite a good surprise for JavaScript packages!

## Conclusion

I hope I managed to give a good enough introduction to client-side full-text
search, its pros and cons, and the design decisions behind **MiniSearch**. I had
quite some fun implementing this library, and I am happy to see it used in
production by now on way more use cases than I initially forecasted. It was also
a teachful experience to delve through the code of other similar projects: each
of them came to different interesting solutions to the tricky problem of
implementing efficient client-side full-text search.

If you are considering to adopt MiniSearch for a project, more detailed
information is available in the
[documentation](https://lucaong.github.io/minisearch/) and the [API
reference](https://lucaong.github.io/minisearch/modules/_minisearch_.html).
MiniSearch is open-source software, and contributions to its code and
documentation are more than welcome!
