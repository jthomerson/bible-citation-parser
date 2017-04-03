'use strict';

var _ = require('underscore'),
    BCP = require('../src/index'),
    expect = require('expect.js'),
    books = require('../src/book-info/english.json');

describe('bible-citation-parser', function() {
   var parser = new BCP('english');

   describe('findMatches', function() {

      function runTest(str, expectations) {
         expect(parser.findMatches(str)).to.eql(expectations);
      }

      it('handles empty strings correctly', function() {
         runTest('', []);
         runTest(false, []);
         runTest(undefined, []);
      });

      it('finds matches correctly', function() {
         runTest('The Bible starts with Ge 1:1 and ends with Re 22:21', [
            { text: 'Ge 1:1', range: '1001001', start: 22, end: 27, book: _.findWhere(books, { number: 1 }) },
            { text: 'Re 22:21', range: '66022021', start: 43, end: 50, book: _.findWhere(books, { number: 66 }) },
         ]);
      });

      it('matches multiple-chapter ranges correctly', function() {
         runTest('Read Mt 5-7, 9 and Re 1-3; 3Jo 1-3 for a test', [
            { text: 'Mt 5-7', range: '40005000-40007999', start: 5, end: 10, book: _.findWhere(books, { number: 40 }) },
            { text: '9', range: '40009000-40009999', start: 13, end: 13, book: _.findWhere(books, { number: 40 }) },
            { text: 'Re 1-3', range: '66001000-66003999', start: 19, end: 24, book: _.findWhere(books, { number: 66 }) },
            { text: '3Jo 1-3', range: '64001001-64001003', start: 27, end: 33, book: _.findWhere(books, { number: 64 }) },
         ]);
      });

   });

   describe('replaceCitations', function() {

      it('replaces basic strings correctly', function() {
         var expected;

         expect(parser.replaceCitations('The Bible starts with Ge 1:1 and ends with Re 22:21'))
            .to
            .eql('The Bible starts with [Ge 1:1](bible://1001001) and ends with [Re 22:21](bible://66022021)');

         expected = 'Test [Ge 1:1](bible://1001001), [2-4](bible://1001002-1001004), [7](bible://1001007);';
         expected = expected + ' [3Jo 1-3](bible://64001001-64001003), [4](bible://64001004);';
         expected = expected + ' [2Th 1:1](bible://53001001) this';
         expect(parser.replaceCitations('Test Ge 1:1, 2-4, 7; 3Jo 1-3, 4; 2Th 1:1 this'))
            .to
            .eql(expected);
      });

   });

});
