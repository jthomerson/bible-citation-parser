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

      it('matches multi-line text correctly', function() {
         runTest('Mt 1:1, 2-4\nMr 2:1\nRe 6:1\nPhm 1-3, 5, 7', [
            { text: 'Mt 1:1', range: '40001001', start: 0, end: 5, book: _.findWhere(books, { number: 40 }) },
            { text: '2-4', range: '40001002-40001004', start: 8, end: 10, book: _.findWhere(books, { number: 40 }) },
            { text: 'Mr 2:1', range: '41002001', start: 12, end: 17, book: _.findWhere(books, { number: 41 }) },
            { text: 'Re 6:1', range: '66006001', start: 19, end: 24, book: _.findWhere(books, { number: 66 }) },
            { text: 'Phm 1-3', range: '57001001-57001003', start: 26, end: 32, book: _.findWhere(books, { number: 57 }) },
            { text: '5', range: '57001005', start: 35, end: 35, book: _.findWhere(books, { number: 57 }) },
            { text: '7', range: '57001007', start: 38, end: 38, book: _.findWhere(books, { number: 57 }) },
         ]);
      });

      it('matches multiple-chapter ranges correctly', function() {
         runTest('Read Mt 5-7, 9 and Re 1-3; 3Jo 1-3 for a test', [
            { text: 'Mt 5-7', range: '40005000-40007999', start: 5, end: 10, book: _.findWhere(books, { number: 40 }) },
            { text: '9', range: '40009000-40009999', start: 13, end: 13, book: _.findWhere(books, { number: 40 }) },
            { text: 'Re 1-3', range: '66001000-66003999', start: 19, end: 24, book: _.findWhere(books, { number: 66 }) },
            { text: '3Jo 1-3', range: '64001001-64001003', start: 27, end: 33, book: _.findWhere(books, { number: 64 }) },
         ]);

         runTest('Read Mt 5-7, 9, 21-24 and Re 1-3; 3Jo 1-3 for a test', [
            { text: 'Mt 5-7', range: '40005000-40007999', start: 5, end: 10, book: _.findWhere(books, { number: 40 }) },
            { text: '9', range: '40009000-40009999', start: 13, end: 13, book: _.findWhere(books, { number: 40 }) },
            { text: '21-24', range: '40021000-40024999', start: 16, end: 20, book: _.findWhere(books, { number: 40 }) },
            { text: 'Re 1-3', range: '66001000-66003999', start: 26, end: 31, book: _.findWhere(books, { number: 66 }) },
            { text: '3Jo 1-3', range: '64001001-64001003', start: 34, end: 40, book: _.findWhere(books, { number: 64 }) },
         ]);
      });

      it('matches verses in single-chapter books correctly', function() {
         runTest('Test Philemon 2; Obadiah 1, 2, 3-5; 2Jo 1-3', [
            { text: 'Philemon 2', range: '57001002', start: 5, end: 14, book: _.findWhere(books, { number: 57 }) },
            { text: 'Obadiah 1', range: '31001001', start: 17, end: 25, book: _.findWhere(books, { number: 31 }) },
            { text: '2', range: '31001002', start: 28, end: 28, book: _.findWhere(books, { number: 31 }) },
            { text: '3-5', range: '31001003-31001005', start: 31, end: 33, book: _.findWhere(books, { number: 31 }) },
            { text: '2Jo 1-3', range: '63001001-63001003', start: 36, end: 42, book: _.findWhere(books, { number: 63 }) },
         ]);
      });

      it('rejects ch:vs citations for single chapter books', function() {
         runTest('Test Philemon 2; Obadiah 1:2; 2:3; 4; 2Jo 1-3', [
            { text: 'Philemon 2', range: '57001002', start: 5, end: 14, book: _.findWhere(books, { number: 57 }) },
            { text: '2Jo 1-3', range: '63001001-63001003', start: 38, end: 44, book: _.findWhere(books, { number: 63 }) },
         ]);

         runTest('Test Philemon 2; Obadiah 1; 2:3; 4; 2Jo 1-3', [
            { text: 'Philemon 2', range: '57001002', start: 5, end: 14, book: _.findWhere(books, { number: 57 }) },
            { text: '2Jo 1-3', range: '63001001-63001003', start: 36, end: 42, book: _.findWhere(books, { number: 63 }) },
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
