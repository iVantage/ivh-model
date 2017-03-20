# IVH Model

> Models for JavaScript

Super lightweight and largely inspired by ExtJS data models.

`IvhModel` allows you to convert value objects into robust, immutable models.
It protects your app from API changes and provides a nice abstraction layer for
business entities.

## Getting Started

Install with npm:

```
npm install --save ivh-model
```

Now get `IvhModel` via commonjs or es6 imports:

```javascript
const IvhModel = require('ivh-model')

// or

import IvhModel from 'ivh-model'
```

## Usage

Typical use invovles extending `IvhModel` and declaring your model's fields.
All model constructors accept a single options hash. For example:

```javascript
// Basic usage
class Thing1 extends IvhModel {
  // All model attributes are found by looking up options of the same name. Note
  // this is an accessor method.
  static get fields() {
    return [
      'id',
      'alias',
      'power'
    ]
  }
}

const opts = {
  id: 123,
  alias: 'Vageta',
  power: 550
}

// Using "new"
const t1 = new Thing1(opts)

// Using IvhMode.create
const t2 = Thing1.create(opts)

// IvhMode.create also works when handed off to e.g. Array.prototype.map
const models = [opts, opts].map(IvhModel.create)

t1.get('alias')
// --> 'Vageta'

t2.get('power')
// --> 550

// Fancy fields
class Thing2 extends IvhModel {
  static get fields() {
    return [
      // Fields can be pulled from options of the same name...
      'id',

      // .. or somewhere else entirely...
      {
        name: 'alias',
        mapping: 'attributes.alias'
      },

      // ... it's ok if a value is missing, but...
      {
        name: 'missing',
        mapping: 'attributes.from.somewhere.missing'
      },

      // ... you may want to set a default value...
      {
        name: 'power',
        defaultValue: 9001
      },

      // ... or even use a calculated/virtual field.
      {
        name: 'id_alias',
        convert: (opts, model) => {
          return `${opts.id}_${model.get('alias')}`
        }
      }
    ]
  }
}

const t3 = Thing2.create({
  id: 456,
  attributes: {
    alias: 'Goku',
    unused: 'foobar'
  }
})

t3.get('alias')
// --> 'Goku'

t3.get('missing')
// --> undefined

t3.get('unused')
// --> undefined

t3.get('power')
// --> 9001

t3.get('id_alias')
// --> '123_Goku'
```

You may want to extend the base `IvhModel` centralize data access:

```javascript
class MyBase extends IvhModel {
  static fetch(where) {
    return fetch(this.endpoint, {
        body: JSON.stringify(where)
      })
      .then(resp => resp.json().map(this.create))
  }
}

class Thingy extends MyBase {
  static endpoint = '/place/to/get/thingies'

  static get fields() {
    return ['id', 'alias']
  }

  watsDat() {
    return 'a senzu bean'
  }
}

Thingy.fetch({alias: 'Go*'}).then(/* ... */)

Thingy.create({id: 1, alias: 'Goku'}).watsDat()
// --> 'a senzu bean'
```

You can set model attributes. This will return a new model with the updated
values rather than mutating the given model.

```javascript
const t1 = Thing1.create({
  id: 'foo',
  alias: 'Foo',
  power: 6
})

const t2 = t1.set('power', 11)

t1.get('power')
// --> 6

t2.get('power')
// --> 11
```

After setting all those values you might want to save your changes back to a
database somewhere.

```javascript
class SillyThing extends IvhModel {
  static get fields() {
    return [
      'id',
      {
        name: 'alias',
        mapping: 'attributes.Label'
      }, {
        name: 'power',
        defaultValue: 9001
      }
    ]
  }
}

let s1 = SillyThing.create()
s1 = s1.set('alias', 'Goku')
s1.extract()
// --> {power: 9001, attributes: {Label: 'Goku'}}
```

Note that fields with a `convert` function will not be extracted.

See the tests and comments in `lib/index.js` for more examples.

## License

MIT
