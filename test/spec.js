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
    const models = optsAndOpts.map(IvhModel.create())
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

  })

})
