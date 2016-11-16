const request = require('./utils/request');
const memoize = require('./utils/memoize');
const cheerio = require('cheerio');
const R = require('ramda');
const htmlToText = require('html-to-text');
import _ from "lodash";

export default class Product {
  constructor(html, url) {
    this.html = html;
    this.url = url;
  }

  getResult() {
    if (this.html) return this.parseFields(cheerio.load(this.html));

    const url = this.url;
    var p = new Promise(function(resolve, reject) {
      request(url)
        .then(result => resolve(cheerio.load(result)))
        .catch(reject);
    });
    return p.then(result => {
      return this.parseFields(result)
    });
  }

  parseFields($) {
    let fields = {};
    fields.priceStores = this.getPriceStores($, fields);
    this.getInfoRows($, fields);
    fields.attributes = this.getAttrRows($, fields);
    return R.map((field) => field === '' ? undefined : field, fields);
  }

  getLead(val) {
    return val.indexOf('无铅') > -1
  }

  getRohs(val) {
    return val.indexOf('符合RoHS标准') > -1
  }

  getAmount($) {
    const that = this;
    let amount = that.getData($('.itemBuyBg .itemBuyLeft .startText').html());
    amount = _.trim(amount.split(':')[1]);
    amount = amount.split(' ')[0];
    amount = amount.replace(',', '');
    return parseInt(amount);
  }

  getInfoRows($, initFields) {
    let fields = initFields;
    let infoRows = [];

    try {
      var that = this;
      fields.pn = that.getData($('[itemprop=productID]').html());
      fields.mfs = that.getData($('[itemprop=manufacturer] a').html());

      if ($('.itemBuyBg').length > 0) {
        fields.amount = that.getAmount($);
      }

      $('#itemSpec1 li .box_tu3').each(function(i, elem) {
        let val = that.getData($(elem).html());
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

  getData(htmlString) {
    const data = htmlToText.fromString(htmlString, {
      wordwrap: 130
    });
    return data;
  }

  // 規格
  getAttrRows($, fields) {
    let that = this;
    let attrThRows = [];
    let attrTdRows = [];
    let attrs = [];

    $('.itemSpec2 tr th').each(function(i, elem) {
      let title = that.getData($(elem).html());
      let value = that.getData($(elem).next().html());
      if (value) {
        let obj = {};
        obj.key = title;
        obj.value = value;
        attrs.push(obj);

        if (title == '商品信息') fields.description = value;
      }
    });
    return attrs;
  }

  getCurrency($) {
    let that = this;
    let currency = that.getData($('.itemBuyBg .itemBuyRight p')).split('(')[1];
    currency = currency.replace(')', '');
    return currency;
  }

  getPriceStoresPrice($, elem) {
    return parseInt($(elem).find('th').html().replace('&#xFF5E;', ''));
  }

  getPriceStores($, fields) {
    let that = this;
    if ($('.itemBuyBg .itemBuyRight p').length == 0) return;
    fields.currency = that.getCurrency($);
    let dollars = $('.catalog-pricing tr');
    let priceCollection = [];
    $('.itemBuyBg .itemBuyRight table tr').each(function(i, elem) {
      let obj = {};
      obj.amount = that.getPriceStoresPrice($, elem);
      obj.unitPrice = that.getData($(elem).find('td').html());
      priceCollection.push(obj);
    });
    return priceCollection;
  }

}
