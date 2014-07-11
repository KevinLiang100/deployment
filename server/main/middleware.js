"use strict";

/*
 * MiddleWare for the entire app
*/
var fs = require('fs');
var Imap = require('imap'),
    inspect = require('util').inspect;

module.exports = exports = {
  emailGetter: function(obj){

    var imap = new Imap({
      user: 'bizarroforrest',
      password: 'mailcrunch',
      host: 'imap.gmail.com',
      port: 993,
      tls: true
    });

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {
      openInbox(function(err, box) {
        if (err) throw err;
        imap.search([ 'UNSEEN', '1:50' ], function(err, results){
          if (err) throw err;
             var f = imap.fetch(results, { bodies: '' });
             f.on('message', function(msg, seqno) {
               console.log('Message #%d', seqno);
               var prefix = '(#' + seqno + ') ';
               msg.on('body', function(stream, info) {
                 console.log(prefix + 'Body');
                 stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
               });
               msg.once('attributes', function(attrs) {
                 console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
               });
               msg.once('end', function() {
                 console.log(prefix + 'Finished');
               });
             });
             f.once('error', function(err) {
               console.log('Fetch error: ' + err);
             });
             f.once('end', function() {
               console.log('Done fetching all messages!');
               imap.end();
          });
        });
      });
    });

    imap.once('error', function(err) {
      console.log(err);
    });

    imap.once('end', function() {
      console.log('Connection ended');
    });

    imap.connect();
  },

  logError: function (err, req, res, next) {
    if (err) {
      console.error(err);
      return next(err);
    }
    next();
  },

  handleError: function (err, req, res, next) {
    if (err) {
      res.send(err, 500);
    }
  },
  cors: function (req, res, next) {
    res.header('Access-Controll-Allow-Origin', '*');
    res.header('Access-Controll-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Controll-Allow-Header', 'Cotent-tyope, Authorization');

    if (req.method === 'Options') {
      res.send(200);
    } else {
      return next();
    }
    // I think the passport authentication needs to go here
  }
};