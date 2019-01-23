var express = require('express');
var router = express.Router();
const fetch = require("node-fetch");
var fs = require('fs');

/* GET users listing. */
router.get('/:db', function(req, res, next) {
    let db = req.params.db;
    var obj;
    if (fs.existsSync('./data/' + db + ".json")) {
        fs.readFile('./data/' + db + '.json', 'utf8', function (err, data) {
            if (err) throw err;
            res.send("ok");
          });
    } else {
        fs.writeFile('./data/' + db + '.json', JSON.stringify({}) , 'utf-8');
        res.send("Well I did not find that database so I created a new one.")
    }
});

router.get('/:db/:key', function(req, res, next) {
    let db = req.params.db;
    var obj;
    if (fs.existsSync('./data/' + db + ".json")) {
        fs.readFile('./data/' + db + '.json', 'utf8', function (err, data) {
            if (err) throw err;
            if (db[req.params.key]) {
                res.send(db[req.params.key])
            } else {
                res.send("ERROR: Key does not exist.");
            }
        });
    } else {
        res.send("That database does not exist.")
    }
});

router.put('/:db/:key', function(req, res, next) {
    let db = req.params.db;
    console.log(req.body);
    var obj;
    if (fs.existsSync('./data/' + db + ".json")) {
        fs.readFile('./data/' + db + '.json', 'utf8', function (err, data) {
            if (err) throw err;
            if (db[req.params.key]) {
                res.send(db[req.params.key])
            } else {
                res.send("ERROR: Key does not exist.");
            }
        });
    } else {
        res.send("That database does not exist.")
    }
});

module.exports = router;