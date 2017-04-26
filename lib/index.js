'use strict'

class IvhModel {
  /**
   * The list of fields supported by this module
   *
   * You should override this accessor in your custom models. Note that it is an
   * getter and not a static property. Because, reasons.
   *
   * This is pretty heavily modeled after Ext data models :P
   *
   * Each item in the field list may be a string literal or a field
   * configuration object. The items in this list are used to set model
   * properties on initialization.
   *
   * Field config objects may have the following properties:
   *
   * ### name
   *
   * The name by which the field is referenced within the model. Note that when
   * a string literal is used in the field list it is interpreted as a config
   * object with name and mapping properties equal to that string.
   *
   * Example: `'foobar'`
   *
   *
   * ### mapping (optional)
   *
   * A JavaScript like string expression denoting the path to the field.
   * Defaults to the field name.
   *
   * Example: `'attributes.foobar'`
   *
   * Given:
   *
   * ```
   * {
   *   attributes: {
   *     foobar: 'fooious',
   *     wowza: 'super blargus'
   *   }
   * }
   * ```
   *
   * ### convert
   *
   * A function mapping raw values to "business" values. Useful for e.g.
   * combining fields or creating "logical/virtual" fields. The function will be
   * passed two arguments: `values`, the raw values hash provided to the
   * constructor; and `model`, the model itself as determined thus far. Note
   * that fields which do not require converters will be processed before any
   * that do and thus their presence may be relied upon within converted
   * functions.  Other fields (i.e. those with converters) will be processed in
   * the order listed.
   *
   * Note that omitted values without converters will be assigned their
   * configured `defaultValue` if one is given.
   *
   *
   * ### type (optional) @todo
   *
   * An error is logged whenever a (converted) value is not of the type
   * specified here. `type` may be either a string or object. When a string is
   * given a `typeof` check will be performed, otherwise we check in that the
   * field value is an `instanceof` the provided object.
   *
   *
   * ### defaultValue (optional)
   *
   * Something to assign to the model when no value exists for the field.
   */
  static get fields() {
    return []
  }

  /**
   * Internal helper to put feids in a convenient format
   *
   * Basically ensured everything is an object with (minimally) a name and a
   * mapping
   */
  static get normalizedFields() {
    return this.fields.map(f => {
      if('string' === typeof f) {
        f = { name: f }
      }
      f.mapping = f.mapping || f.name
      return f
    })
  }

  /**
   * An alternative constructor for functional greatness
   *
   * Note this is an accessor instead of a regular static function so that we
   * can bind the returned function to our constructor and not worry about how
   * it is invoked.
   *
   * I.e.
   *
   * ```
   * [stuff].map(IvhModel.create)
   * ```
   *
   * Should still work.
   */
  static get create() {
    return opts => new this(opts)
  }

  /**
   * An alternate constructor for convenience using attribute names
   *
   * This is essentially shorthand for create().set(...).set(...)...
   *
   * Your model must be create-able with an empty hash
   */
  static get createSet() {
    return opts => Object.keys(opts)
      .reduce((m, key) => m.set(key, opts[key]), new this())
  }

  /**
   * Override this method to modify extracted content before it is returned
   */
  static extract(extractedData, model) { // eslint-disable-line no-unused-vars
    // Hi! I'm just a stub.
  }

  /**
   * Parses the given `opts` hash in the context of `fields`
   */
  constructor(opts = {}) {
    const fields = this.constructor.normalizedFields
    const data = this.data = {}
    this.rawData = opts

    // Apply our default values as a base layer.
    fields
      .filter(f => f.hasOwnProperty('defaultValue'))
      .forEach(f => {
        data[f.name] = f.defaultValue
      })

    // Collect the non-converted fields
    fields
      .filter(f => !f.hasOwnProperty('convert'))
      .forEach(f => {
        let val = opts
        f.mapping
          .split('.')
          .filter(attr => attr.length)
          .forEach(attr => {
            if(null !== val && 'undefined' !== typeof val) {
              val = val[attr]
            }
          })
        if(null !== val && 'undefined' !== typeof val) {
          data[f.name] = val
        }
      })

    // Collected converted fields,
    fields
      .filter(f => f.hasOwnProperty('convert'))
      .forEach(f => {
        data[f.name] = f.convert(opts, this)
      })
  }

  /**
   * Preferring explicit getters to e.g. Object.defineProperty for love of
   * parens
   */
  get(fieldName) {
    return this.data[fieldName]
  }

  /**
   * Sets should return a new model instance with the updated value rather than
   * mutate this model
   */
  set(fieldName, newValue) {
    const newModel = this.constructor.create(this.rawData)
    newModel.data = Object.assign({}, this.data, {[fieldName]: newValue})
    return newModel
  }

  /**
   * Get data back out in a way that looks like how it went in
   *
   * This is meant to facilitate e.g. sending changes back to a server after
   * making updates to your model locally.
   */
  extract() {
    const fields = this.constructor.normalizedFields
    const extractedData = {}

    // Collect data from non-converted fields which have been set
    fields
      .filter(f => !f.hasOwnProperty('convert'))
      .filter(f => this.data.hasOwnProperty(f.name))
      .forEach(f => {
        let base = extractedData
        f.mapping
          .split('.')
          .filter(attr => attr.length)
          .forEach((attr, ix, arr) => {
            base = base[attr] = ix === arr.length - 1 ?
              this.data[f.name] :
              base[attr] || {}
          })
      })

    this.constructor.extract(extractedData, this)

    return extractedData
  }
}

module.exports = IvhModel
