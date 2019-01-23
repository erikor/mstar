$(function () {
    let url = "http://feed2js.org//feed2js.php?src=https%3A%2F%2Flectionary.library.vanderbilt.edu%2F%2Ffeeds%2Flectionary.xml&chan=y&desc=1&utf=y&html=y"
    parseRSS(url, function(d) {
        console.log(d)
    })
});



function parseRSS(url, callback) {
    $.getJSON(url,  callback)
  }
