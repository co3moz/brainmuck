// https://gist.githubusercontent.com/co3moz/0fc4694c84da16db34c4/raw/7e2500f3a24eff8aae37ce670ba44e2e490d5610/iterate.js
Array.prototype.iterate = function (cb, done, timeout) {
  ((timeout != undefined) || (typeof timeout == "object") || (timeout = 5000));

  var total = this.length;
  var result = [];

  if (total == 0) {
    return done(null, result);
  }

  var sent = false;
  this.forEach(function (e, i) {
    setTimeout(function () {
      cb(e, function (data) {
        if (data instanceof Error) {
          if (!sent) {
            done(data, null);
            sent = true;
          }
        } else {
          result[i] = data;

          if (--total == 0 && !sent) {
            done(null, result);
            sent = true;
          }
        }
      })
    });
  });

  if (timeout != null) {
    setTimeout(function () {
      if (total != 0 && !sent) {
        done(Error("timeout"), null);
        sent = true;
      }
    }, timeout);
  }
};