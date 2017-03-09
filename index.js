'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IvhModel = function () {
  _createClass(IvhModel, null, [{
    key: 'fields',

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
    get: function get() {
      return [];
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

  }, {
    key: 'create',
    get: function get() {
      var _this = this;

      return function (opts) {
        return new _this(opts);
      };
    }

    /**
     * Parses the given `opts` hash in the context of `fields`
     */

  }]);

  function IvhModel() {
    var _this2 = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, IvhModel);

    var fields = this.constructor.fields.map(function (f) {
      if ('string' === typeof f) {
        f = { name: f };
      }
      f.mapping = f.mapping || f.name;
      return f;
    });

    var data = {};

    // Apply our default values as a base layer.
    fields.filter(function (f) {
      return f.hasOwnProperty('defaultValue');
    }).forEach(function (f) {
      data[f.name] = f.defaultValue;
    });

    // Collect the non-converted fields
    fields.filter(function (f) {
      return !f.hasOwnProperty('convert');
    }).forEach(function (f) {
      var val = opts;
      f.mapping.split('.').filter(function (attr) {
        return attr.length;
      }).forEach(function (attr) {
        if ('undefined' !== typeof val) {
          val = val[attr];
        }
      });
      if ('undefined' !== typeof val) {
        data[f.name] = val;
      }
    });

    this.data = data;

    // Collected converted fields,
    fields.filter(function (f) {
      return f.hasOwnProperty('convert');
    }).forEach(function (f) {
      _this2.data[f.name] = f.convert(opts, _this2);
    });
  }

  /**
   * Preferring explicit getters to e.g. Object.defineProperty for love of
   * parens
   */


  _createClass(IvhModel, [{
    key: 'get',
    value: function get(fieldName) {
      return this.data[fieldName];
    }

    /**
     * Sets should return a new model instance with the updated value rather than
     * mutate this model
     */

  }, {
    key: 'set',
    value: function set(fieldName, newValue) {
      var newModel = this.constructor.create();
      newModel.data = Object.assign({}, this.data, _defineProperty({}, fieldName, newValue));
      return newModel;
    }
  }]);

  return IvhModel;
}();

module.exports = IvhModel;