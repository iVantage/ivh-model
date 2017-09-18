'use strict'

const expect = require('chai').expect

describe('IvhModel', function() {

  const IvhModel = require('../lib/index')

  it('should have a list of fields', function() {
    expect(IvhModel.fields).to.be.an.instanceof(Array)
  })

  it('should have method to create new models', function() {
    expect(IvhModel.create).to.be.an.instanceof(Function)
    expect(IvhModel.create({})).to.be.an.instanceof(IvhModel)
  })

  it('should be able to create instances with Array#map', function() {
    const optsAndOpts = [{}, {}, {}]
    const models = optsAndOpts.map(IvhModel.create)
    expect(models.length).to.equal(3)
    models.forEach(m => {
      expect(m).to.be.an.instanceof(IvhModel)
    })
  })

  describe('extended', function() {

    class Sub extends IvhModel {
      static get fields() {
        return [
          'foo',
          {
            name: 'bar',
            mapping: 'b.a.r'
          }, {
            name: 'barZ',
            mapping: 'b.a.r.Z.Z.Z',
            defaultValue: 'Z'
          }, {
            name: 'wowza',
            defaultValue: 5
          }, {
            name: 'snapper',
            convert: (opts, model) => {
              return opts.foo + model.get('bar') + model.get('wowza')
            }
          }
        ]
      }
    }

    let m

    beforeEach(function() {
      m = new Sub({
        foo: 1,
        b: {a: {r: 2}}
        // wowza: 5 <-- defaults
        // snapper (converted)
      })
    })

    it('should get vals by name', function() {
      expect(m.get('foo')).to.equal(1)
    })

    it('should get values by path', function() {
      expect(m.get('bar')).to.equal(2)
    })

    it('should fall back on default values', function() {
      expect(m.get('wowza')).to.equal(5)
    })

    it('should use defaults for missing maps', function() {
      expect(m.get('barZ')).to.equal('Z')
    })

    it('should process calculated fields', function() {
      expect(m.get('snapper')).to.equal(8)
    })

    it('should not clobber IvhModel field lists', function() {
      expect(IvhModel.fields.length).to.equal(0)
    })

    it('should not throw when null values are found', function() {
      class Nully extends IvhModel {
        static get fields() {
          return [{
            name: 'foo',
            mapping: 'stuff.stuff.stuff'
          }]
        }
      }

      expect(() => {
        Nully.create({stuff: null})
      }).to.not.throw(Error)
    })
  })

  describe('setters', function() {
    class SetterSub extends IvhModel {
      static get fields() {
        return [
          'foo',
          'bar',
          {
            name: 'wowza',
            convert: (opts, model) => model.get('foo') + model.get('bar')
          }
        ]
      }
    }

    let m

    beforeEach(function() {
      m = new SetterSub({
        foo: 1,
        bar: 2
      })
    })

    it('should be able to set a value', function() {
      const m2 = m.set('foo', 5)
      expect(m2.get('foo')).to.equal(5)
    })

    it('should not modify the original model when setting', function() {
      m.set('foo', 5)
      expect(m.get('foo')).to.equal(1)
    })

    it('should allow chaining set calls', function() {
      const m2 = m
        .set('foo', 5)
        .set('bar', 10)
      expect(m2.get('foo')).to.equal(5)
      expect(m2.get('bar')).to.equal(10)
    })

    it('should be able to set a calculated field', function() {
      const m2 = m.set('wowza', 100)
      expect(m2.get('wowza')).to.equal(100)
    })

    it('should not throw when convert fn expects deep properties', function() {
      class Foo extends IvhModel {
        static get fields() {
          return ['alias', {
            name: 'blargus',
            convert: opts => opts.attrs.deep.bar
          }]
        }
      }

      const f = new Foo({
        alias: 'Alias',
        attrs: {
          deep: {
            bar: 'Unicorn'
          }
        }
      })

      expect(() => f.set('alias', 'Narwhal')).to.not.throw(Error)
    })
  })

  describe('extract', function() {
    class ExtracSub extends IvhModel {
      static get fields() {
        return [
          'foo',
          {
            name: 'bar',
            mapping: 'attributes.bar'
          }, {
            name: 'wowza',
            convert: (opts, model) => model.get('foo') + model.get('bar')
          }
        ]
      }
    }

    let m

    beforeEach(function() {
      m = new ExtracSub({
        foo: 1,
        attributes: {
          bar: 2
        }
      })
    })

    it('should provide a method to get back raw options', function() {
      expect(m.extract()).to.deep.equal({
        foo: 1,
        attributes: {
          bar: 2
        }
      })
    })

    it('should respect values that have been set', function() {
      m = m.set('bar', 9)
      expect(m.extract()).to.have.deep.property('attributes.bar', 9)
    })
  })

  describe('custom extract', function() {
    class CustomExtract extends IvhModel {
      static get fields() {
        return ['a']
      }
      static extract(extracted, model) {
        extracted.foo1 = extracted.a + '1'
        extracted.foo2 = model.get('a') + '2'
      }
    }

    it('should provide a hook for modifying extracted content', function() {
      const m = CustomExtract.create({a: 'bar'})
      expect(m.extract()).to.deep.equal({
        a: 'bar',
        foo1: 'bar1',
        foo2: 'bar2'
      })
    })
  })

  describe('createSet', function() {
    class CSSub extends IvhModel {
      static get fields() {
        return [{
          name: 'foo',
          mapping: 'f.o.o'
        }]
      }
    }

    it('should provide an alternate with model attribute names', function() {
      const m = CSSub.createSet({
        foo: 'bar'
      })
      expect(m.get('foo')).to.equal('bar')
    })

    it('should still be extactable', function() {
      const m = CSSub.createSet({
        foo: 'bar'
      })
      expect(m.extract()).to.have.deep.property('f.o.o', 'bar')
    })
  })

  describe('clone', function() {
    class Sub extends IvhModel {
      static get fields() {
        return [{
          name: 'foo',
          mapping: 'f.oo'
        }, {
          name: 'bar',
          defaultValue: 5
        }, {
          name: 'wowza',
          convert: (opts, model) => model.get('bar') + 6
        }]
      }
    }

    it('should return a new instance', () => {
      const m1 = new Sub({
        f: { oo: 1 }
      })
      const m2 = m1.clone()
      expect(m1).to.not.equal(m2)
    })

    it('should copy all attributes', () => {
      const m1 = new Sub({
        f: { oo: 1 }
      })
      const m2 = m1.clone()
      expect(m2.get('foo')).to.equal(1)
      expect(m2.get('bar')).to.equal(5)
      expect(m2.get('wowza')).to.equal(11)
    })
  })

})
