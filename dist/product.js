'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('./utils/request');
var memoize = require('./utils/memoize');
var cheerio = require('cheerio');
var R = require('ramda');
var htmlToText = require('html-to-text');

var Product = function () {
  function Product(html, url) {
    _classCallCheck(this, Product);

    this.html = html;
    this.url = url;
  }

  _createClass(Product, [{
    key: 'getResult',
    value: function getResult() {
      var _this = this;

      if (this.html) return this.parseFields(cheerio.load(this.html));

      var url = this.url;
      var p = new Promise(function (resolve, reject) {
        request(url).then(function (result) {
          return resolve(cheerio.load(result));
        }).catch(reject);
      });
      return p.then(function (result) {
        return _this.parseFields(result);
      });
    }
  }, {
    key: 'parseFields',
    value: function parseFields($) {
      var fields = {};
      fields.priceStores = this.getPriceStores($, fields);
      this.getInfoRows($, fields);
      fields.attributes = this.getAttrRows($, fields);
      return R.map(function (field) {
        return field === '' ? undefined : field;
      }, fields);
    }
  }, {
    key: 'getLead',
    value: function getLead(val) {
      return val.indexOf('无铅') > -1;
    }
  }, {
    key: 'getRohs',
    value: function getRohs(val) {
      return val.indexOf('符合RoHS标准') > -1;
    }
  }, {
    key: 'getAmount',
    value: function getAmount($) {
      var that = this;
      var amount = that.getData($('.itemBuyBg .itemBuyLeft .startText').html());
      amount = _lodash2.default.trim(amount.split(':')[1]);
      amount = amount.split(' ')[0];
      amount = amount.replace(',', '');
      return parseInt(amount);
    }
  }, {
    key: 'getInfoRows',
    value: function getInfoRows($, initFields) {
      var fields = initFields;
      var infoRows = [];

      try {
        var that = this;
        fields.pn = that.getData($('[itemprop=productID]').html());
        fields.mfs = that.getData($('[itemprop=manufacturer] a').html());

        if ($('.itemBuyBg').length > 0) {
          fields.amount = that.getAmount($);
        }

        $('#itemSpec1 li .box_tu3').each(function (i, elem) {
          var val = that.getData($(elem).html());
          if (i == 0) {
            fields.lead = that.getLead(val);
            fields.rohs = that.getRohs(val);
          }
          if (i == 1) fields.category = val.split(' ')[0];
          if (i == 3) fields.sku = val.split('：')[1];
        });
      } catch (e) {
        console.error('e:', e.message);
      }
      return fields;
    }
  }, {
    key: 'getData',
    value: function getData(htmlString) {
      var data = htmlToText.fromString(htmlString, {
        wordwrap: 130
      });
      return data;
    }

    // 規格

  }, {
    key: 'getAttrRows',
    value: function getAttrRows($, fields) {
      var that = this;
      var attrThRows = [];
      var attrTdRows = [];
      var attrs = [];

      $('.itemSpec2 tr th').each(function (i, elem) {
        var title = that.getData($(elem).html());
        var value = that.getData($(elem).next().html());
        if (value) {
          var obj = {};
          obj.key = title;
          obj.value = value;
          attrs.push(obj);

          if (title == '商品信息') fields.description = value;
        }
      });
      return attrs;
    }
  }, {
    key: 'getCurrency',
    value: function getCurrency($) {
      var that = this;
      var currency = that.getData($('.itemBuyBg .itemBuyRight p')).split('(')[1];
      currency = currency.replace(')', '');
      return currency;
    }
  }, {
    key: 'getPriceStoresPrice',
    value: function getPriceStoresPrice($, elem) {
      return parseInt($(elem).find('th').html().replace('&#xFF5E;', ''));
    }
  }, {
    key: 'getPriceStores',
    value: function getPriceStores($, fields) {
      var that = this;
      if ($('.itemBuyBg .itemBuyRight p').length == 0) return;
      fields.currency = that.getCurrency($);
      var dollars = $('.catalog-pricing tr');
      var priceCollection = [];
      $('.itemBuyBg .itemBuyRight table tr').each(function (i, elem) {
        var obj = {};
        obj.amount = that.getPriceStoresPrice($, elem);
        obj.unitPrice = that.getData($(elem).find('td').html());
        priceCollection.push(obj);
      });
      return priceCollection;
    }
  }]);

  return Product;
}();

exports.default = Product;