var express = require('express');
var router = express.Router();
var http = require('http');
var url = require('url');

/* GET users listing. */
router.get('/bs/:sym', function(req, res) {
    let sym = req.params.sym;
    fetchMstar("bs", sym, data => res.send(data))
});

router.get('/is/:sym', function(req, res) {
    let sym = req.params.sym;
    fetchMstar("is", sym, data => res.send(data))
});

router.get('/cf/:sym', function(req, res) {
    let sym = req.params.sym;
    fetchMstar("cf", sym, data => res.send(data))
});

fetchMstar = function(type, symbol, cb) {
    const requestUrl = url.parse(url.format({
        protocol: 'http',
        hostname: 'financials.morningstar.com',
        pathname: '/ajax/ReportProcess4CSV.html',
        query: {
            t: symbol,
            region: "usa",
            "culture": "en-USA",
            "version": "SAL",
            "reportType": type,
            "type": "price-earnings",
            "period": 12,
            "dataType": "A",
            "order": "asc",
            "columnYear": 10,
            "curYearPart": "1st5year",
            "number": 3
        }
    }));

    http.get({
        hostname: requestUrl.hostname,
        path: requestUrl.path,
        headers: { referer: "http://financials.morningstar.com/income-statement"}
        }, (resp) => {
        let data = '';
      
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk;
        });
      
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          cb(data)
        });
      
      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });      
}

module.exports = router;