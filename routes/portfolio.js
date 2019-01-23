var express = require('express');
var router = express.Router();
const fetch = require("node-fetch");

/* GET users listing. */
router.get('/weekly', function(req, res, next) {
    let resource = "TIME_SERIES_WEEKLY";
    let sym = req.query.sym;
    let url = 'https://www.alphavantage.co/query?function=' + resource + '&symbol=' + sym + '&apikey=P7RYKX65S2VYXVBY';
    fetch(url)
    .then(res => res.text())
    .then(d => { res.send(d) })
});

router.get('/monthly', function(req, res, next) {
    let resource = "TIME_SERIES_MONTHLY";
    let sym = req.query.sym;
    let url = 'https://www.alphavantage.co/query?function=' + resource + '&symbol=' + sym + '&apikey=P7RYKX65S2VYXVBY';
    fetch(url)
    .then(res => res.text())
    .then(d => { res.send(d) })
});

router.get('/daily', function(req, res, next) {
    let resource = "TIME_SERIES_DAILY";
    let sym = req.query.sym;
    let url = 'https://www.alphavantage.co/query?function=' + resource + '&symbol=' + sym + '&apikey=P7RYKX65S2VYXVBY';
    fetch(url)
    .then(res => res.text())
    .then(d => { res.send(d) })
});

module.exports = router;
