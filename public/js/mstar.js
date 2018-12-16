let q = 0;

var MStar = function () {
    this.baseurl = "http://financials.morningstar.com/ajax/ReportProcess4CSV.html"
    this.valurl = "http://financials.morningstar.com/valuate/valuation-history.action"
    this.args = {
        "t": "AAPL",
        "region": "usa",
        "culture": "en-US",
        "version": "SAL",
        "cur": "",
        "reportType": "is",
        "type": "price-earnings",
        "period": 12,
        "dataType": "A",
        "order": "asc",
        "columnYear": 10,
        "curYearPart": "1st5year",
        "number": 3
    }
    this.data = {};
    this.header = null;
    this.fields = [
        { field: 'Net income available', label: 'Net income' },
        { field: 'Revenue', label: 'Revenue' },
        { field: 'Total stockholders\' equity', label: 'Total equity' },
        { field: 'Net income available to common shareholders', label: 'Net income' },
        { field: 'Net cash provided by operating activities', label: 'Net cash' },
        { field: 'Free cash flow', label: 'Free cash flow' },
        { field: 'Depreciation & amortization', label: 'Depreciations & amortization' },
        { field: 'Capital expenditure', label: 'Capital expenditure' },
        { field: 'Basic', label: 'Outstanding shares' },
    ]
}

function myAsyncFunction(url) {
}

// the morningstar server does not seem to like requests at more than 
// 1 per second or so, and will just respond with an empty response if 
// it is not feeling well.  So we queue, throttle, and retry.
MStar.prototype.delayFetch = function (url) {
    const self = this;
    return new Promise((resolve, reject) => {
        let fetchInterval = setInterval(() => {
            if (q == 0) {
                clearInterval(fetchInterval)
                q += 1;
                fetch(url)
                    .then(res => res.text())
                    .then(d => {
                        q -= 1;
                        if (d.length < 1) {
                            self.delayFetch(url)
                                .then(resolve);
                        } else {
                            resolve(self.textToCols(d));
                        }
                    })
                    .catch(err => {
                        q -= 1;
                        console.error(err)
                        reject(err)
                    });
            }
        }, 1500);
    })
}

MStar.prototype.fetch = function (reportType) {
    const self = this;
    let symbol = $("#sym").val();
    this.args.t = symbol;
    this.args.reportType = reportType;
    let url = self.baseurl + "?" + $.param(self.args);
    return (self.delayFetch(url));
}

MStar.prototype.overview = function () {
    const self = this;
    return new Promise((resolve, reject) => {
        fetch('http://financials.morningstar.com/cmpind/company-profile/component.action?component=BusinessDesc&region=usa&culture=en-US&t=' + self.args.t)
            .then(res => res.text())
            .then(d => {
                d = d.replace(/[\s\S]*<p class="r_txt6">([\s\S]*)<\/p>[\s\S]*/, "$1")
                resolve(d);
            })
    })
}

MStar.prototype.fetchPE = function () {
    const self = this;
    let symbol = $("#sym").val();
    this.args.t = symbol;
    return new Promise((resolve, reject) => {
        fetch(self.valurl + "?" + $.param(self.args))
            .then(res => res.text()) // parse response as JSON (can be res.text() for plain response)
            .then(d => {
                d = d.replace(/[\s\S]*({data:[\s\S]*?})[\s\S]*/, "$1")
                    .replace(/\s/g, "")
                    .replace(/data/, "\"data\"")
                d = JSON.parse(d).data.filter((element, index) => {
                    return index % 2 == 0;
                }).map(x => x[1]).slice(0, 10);
                self.data.PE = d;
                resolve(d);
            })
            .catch(err => {
                reject(err)
            });
    })
}

MStar.prototype.textToCols = function (d) {
    const self = this;
    let lines = d.split("\n")
    let res = "<table>"
    field_ids = self.fields.map(f => f.field);
    field_labels = self.fields.map(f => f.label);
    let shares = false; // will use this to bypass earnings per share
    lines.forEach(function (e) {
        e = self.removeQuotedCommas(e)
        let vals = e.split(",").slice(0, 11)
        if (vals[0].match(/Fiscal/)) {
            vals.shift();
            res += "<tr><td class='rowname'> </td>";
            self.header = "<tr><td class='rowname'> </td>";
            vals.forEach(function (v) {
                self.header += "<td class='header', align='right'>" + v + "</td>";
                res += "<td class='header', align='right'>" + v + "</td>";
            })
            res += "<td class='sparkline header'>Sparkline</td><td class='header'>Mean Delta</td><td class='header'>Median Delta</td><td class='header'>EK Velocity</td></tr>";
            self.header += "<td class='sparkline'>Sparkline</td><td class='header'>Mean Delta</td><td class='header'>Median Delta</td><td class='header'>EK Velocity</td></tr>";

        } else if (vals[0].match(/Weighted average shares/)) {
            shares = true;
        } else if (field_ids.indexOf(vals[0]) > -1) {
            var rn = vals.shift();
            if (rn == "Basic" && !shares) return;
            rn = field_labels[field_ids.indexOf(rn)]
            res += "<tr><td class='rowname'>" + rn + "</td>";

            vals.forEach(function (v) {
                res += "<td class='data', align='right'>" + v + "</td>";
            })
            self.data[rn] = JSON.parse(JSON.stringify(vals));
            vals.shift()
            res += "<td class='inlinesparkline'>" + vals.join(",") + "</td>";
            res += "<td class='data', align='right'>" + self.avchange(vals) + "</td>";
            res += "<td class='data', align='right'>" + self.medchange(vals) + "</td>";
            res += "<td class='data', align='right'>" + self.ekvel(vals) + "</td><tr>";
        }
    })
    res += "</table>"
    return (res);
}

MStar.prototype.objectArrToRows = function (d) {
    const self = this;
    let res = "";
    for (var k in d) {
        let vals = d[k];
        var rn = k;
        res += self.dataTableRow(rn, vals)
    }
    return (res);
}

MStar.prototype.dataTableRow = function (rn, d, c = 'data', augmented = true) {
    let self = this;
    let res = ["<td class='rowname'>" + rn + "</td>"];
    res = res.concat(d.map(x => { return ("<td align='right' class='" + c + "'>" + x + "</td>") }));
    if (augmented) {
        res.push("<td class='inlinesparkline'>" + d.join(",") + "</td>");
        res.push("<td class='data'>" + self.avchange(d) + "</td>");
        res.push("<td class='data'>" + self.medchange(d) + "</td>");
        res.push("<td class='data'>" + self.ekvel(d) + "</td>");
    }
    return ("<tr>\n" + res.join("\t\n") + "\n</tr>");
}

MStar.prototype.calculated = function () {
    let self = this;
    let res = "<table>" + this.header;
    let cap = this.data['Capital expenditure']
    let oe = this.data["Free cash flow"]
    let shares = self.data['Outstanding shares']
    let tc = oe.map((x, i) => { return (Math.round((10 * x) / shares[i])) });
    let netinc = this.data['Net income']
    let eps = netinc.map((x, i) => Math.round(100 * x / shares[i]) / 100)
    let pe = this.data['PE']
    res += this.objectArrToRows({ 'Owner earnings': oe, 'Ten Cap': tc, 'EPS': eps, 'PE': pe });
    res += "</table>";
    return (res);
}

// Depreciation & Amortization		 $10,903 
// Net Change Accounts Receivable		 $(5,322)
// Net Change Accounts Payable		 $9,175 
// Income Tax		 $(5,000)
// "Maintenance Capital Expenditures
// (May need to be estimated from total capital expenditures)"		 $(13,313)
// OWNER EARNINGS		 $55,974 
// TEN CAP PRICE		 $117.96 

MStar.prototype.removeQuotedCommas = function (s) {
    s = s.replace(/"[^"]+"/g, function (match) {
        return match.replace(/,/g, '');
    });
    s = s.replace(/\"/g, "");
    return (s)
}

// % change for each member of vector relative to preceding member
MStar.prototype.diff = function (v) {
    return (v.slice(1).map((x, i) => (x - v[i]) / x));
}

MStar.prototype.avchange = function (v) {
    let x = math.mean(this.diff(v))
    return ((x * 100).toFixed(2) + '%');
}

MStar.prototype.medchange = function (v) {
    let x = math.median(this.diff(v))
    return ((x * 100).toFixed(2) + '%');
}

MStar.prototype.fit = function (y) {
    const x = y.map((d, i) => i + 1)
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {

        sum_x += x[i];
        sum_y += y[i];
        sum_xy += (x[i] * y[i]);
        sum_xx += (x[i] * x[i]);
        sum_yy += (y[i] * y[i]);
    }

    let slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    return slope;
}

MStar.prototype.ekvel = function (v) {
    v = v.map(x => Number(x))
    let x = this.fit(v) / math.median(v);
    return ((x * 100).toFixed(2) + '%');
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function chartData(sym, w, interval='daily') {
    let points = { x: [], y: [], 
                    mode: 'lines',
                    line: {
                        color: "#777777"
                    }
    }
    let lines = { x: [], y: [], mode: 'lines'}
    let x = 100;
    let layout = {
        xaxis: {
            tickfont: {
              family: 'sans-serif',
              size: 8,
              color: '#aaaaaa'
            }
          },
          yaxis: {
            tickfont: {
              family: 'sans-serif',
              size: 8,
              color: '#aaaaaa'
            }
          },
          margin: {
            l: 0,
            r: 0,
            b: 40,
            t: 0,
            pad: 0
          },
          hoverlabel: {
            bgcolor: '#EBEFF1',
            font: {size: '9', family: 'Raleway', color: '#50656D' }
          }
    }

    config = {
        displayModeBar: false,
    }

    let resource = "TIME_SERIES_" + interval.toUpperCase();
    let url = '/alpha/' + interval + '?sym=' + sym;
    console.log(url)
    fetch(url)
    .then(res => res.text())
    .then(d => {
        if(d.match(/Thank you/)) {
            let prev = $("#quote")
            $("#quote").remove();
            $("#chart-container").prepend("<span id=quote>Too many requests...wait 15s.</span>")
            setTimeout(() => {
                $("#quote").remove();
                $("#chart-container").prepend(prev)
                $("#daily").click(() => { chartData($("#sym").val(), $("#chart")[0], "daily")})
                $("#monthly").click(() => { chartData($("#sym").val(), $("#chart")[0], "monthly")})
            }, 10000);
            return(0);
        }
        let h = JSON.parse(d);
        h = h[Object.keys(h)[1]];
        for(k in h) {
            points.y.push(h[k]['4. close']);
            points.x.push(k);
            x -= 1;
        }
        let data = [ points ];
        let price = points.y[0];
        $("#quote").remove();
        $("#chart-container").prepend("<span id=quote><span class='quote_sym'>" + sym.toUpperCase() + 
                                      "</span><span class='quote_price'> " + price + "</span><span class='quote_sym'> " +
                                      "<span class='interval pointer' id='daily'> &nbsp &nbsp daily |</span>" +
                                      "<span class='interval pointer' id='monthly'> monthly </span></span>")
        $("#daily").click(() => { chartData($("#sym").val(), $("#chart")[0], "daily")})
        $("#monthly").click(() => { chartData($("#sym").val(), $("#chart")[0], "monthly")})
        Plotly.newPlot(w, data, layout, config);    
    })
}

function calcMOS() {
    let growth = $("#windage_growth").val() / 100;
    let eps = $("#windage_eps").val();
    let pe = $("#windage_pe").val();
    let future_eps = ((1 + growth) ** 10) * eps;
    let future_price = future_eps * pe;
    let sticker_price = future_price / 4 // working back at 15% growth--the minimum acceptable

    $("#mos").html("$" + Math.round(sticker_price / 2));
}

$(function () {
    let quoter = new MStar();
    $(".windage_input").change(calcMOS);
    $('.inlinesparkline').sparkline();
    $("#submit").click(() => {
        $(".toggle").css('visibility', 'hidden');
        $(".loader").css('display', 'block');
        var reports = ["is", "bs", "cf"]
        var q = reports.map(r => quoter.fetch(r));
        q.push(quoter.fetchPE());
        q.push(quoter.overview());
        Promise.all(q)
            .then((r) => {
                $("#income").html(r[0]);
                $("#balance").html(r[1]);
                $("#cash").html(r[2]);
                $("#overview").html(r[4]);
                $("#earnings").html(quoter.calculated());
                $('.inlinesparkline').sparkline("html",
                    {
                        type: 'bar',
                        barColor: '#444',
                        negBarColor: "#f00",
                        barWidth: 5,
                        barSpacing: 2
                    })
                chartData($("#sym").val(), $("#chart")[0], "monthly")
                $(".loader").css('display', 'none');
                $(".toggle").css('visibility', 'visible');

            })
    })
});
