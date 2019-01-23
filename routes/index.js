var express = require('express');
var router = express.Router();
const request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Stock View' });
});

router.get('/lectionary', function(req, res, next) {
  request('https://lectionary.library.vanderbilt.edu/feeds/lectionary.xml', (err, resp, body) => {
    if (err) { return console.log(err); }
    url = body.replace(/[\s\S]*<guid.*?>(.*)<\/guid[\s\S]*/, "$1");
    title = body.replace(/[\s\S]*<title>(.*)<\/title[\s\S]*/, "$1");
    console.log(title)
    request(url, (err, resp, body) => {
      body = body.replace(/[\s\S]*?(<span class=\"citation[\s\S]*?)<\/div[\s\S]*/, "$1");
      body = body.replace(/<br.*?>/g, "");
      body = body.replace(/\d+\:(\d+) /g, "<sup class=verse>$1</sup>");
      res.render('lectionary', { title: title, text: body });
    })
  });
});

module.exports = router;
