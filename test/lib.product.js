import fs from 'fs';
import path from 'path';

import {
  ProductFields, ProductFullFields
}
from './field';

var GrabStrategy = require('../lib/product').default;

function checklist(result) {
  result.sku.should.be.a('string');
  result.mfs.should.be.a('string');
  result.pn.should.be.a('string');
  result.description.should.be.a('string');
  result.lead.should.be.a('boolean');
  result.rohs.should.be.a('boolean');
  result.attributes.should.be.a('array');
  result.attributes.length.should.above(0);
  result.attributes[0].should.have.keys(['key', 'value']);
}

function getHtml(fileName) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path.join(__dirname, fileName), function(err, data) {
      if (err) return console.log(err);
      resolve(data.toString());
    })
  });
}

describe('product page', function() {
  it('case 1', async(done) => {
    try {
      let html = await getHtml(
        'sample.html'
      );
      let grabStrategy = new GrabStrategy(html,
        'http://www.chip1stop.com/web/TWN/zh/dispDetail.do?partId=TI01-0329806&mpn=INA137UA'
      );
      let result = await grabStrategy.getResult();
      result.should.have.keys(ProductFields);
      checklist(result);
      done();
    } catch (e) {
      done(e);
    }
  });

  it('case 2', async(done) => {
    try {
      let html = await getHtml(
        'sample2.html'
      );
      let grabStrategy = new GrabStrategy(html,
        'http://www.chip1stop.com/web/TWN/zh/dispDetail.do?partId=STMI-0041892&mpn=L298N'
      );
      let result = await grabStrategy.getResult();
      result.should.have.keys(ProductFullFields);
      checklist(result);
      result.currency.should.be.a('string');
      result.amount.should.be.a('number');
      result.priceStores.should.be.a('array');
      result.priceStores.length.should.above(0);
      result.priceStores[0].should.have.keys(['amount', 'unitPrice']);
      result.priceStores[0].amount.should.be.a('number');
      done();
    } catch (e) {
      done(e);
    }
  });
});
