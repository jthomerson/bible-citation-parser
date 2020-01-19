'use strict';

module.exports = function zeroPad(v) {
   const s = String(v);

   if (s.length === 1) {
      return ('00' + s);
   } else if (s.length === 2) {
      return ('0' + s);
   }

   return s;
};
