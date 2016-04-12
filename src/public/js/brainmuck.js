var libs = [
  "stream_read",
  "stream_write"
];

function Core (libraries) {
  var table = document.getElementById('cpuTable');
  var code = document.getElementById('code');
  var input = document.getElementById('inputStream');
  var output = document.getElementById('outputStream');
  var cpuSpeed = document.getElementById('cpuSpeed');
  var run = document.getElementsByTagName('button')[0];
  var stop = document.getElementsByTagName('button')[1];
  var direct = document.getElementsByTagName('button')[2];
  var library = libraries.join('\n');
  var cpu;
  var core;
  var lines;

  var editor = CodeMirror.fromTextArea(code, {
    lineNumbers: true,
    styleActiveLine: true,
    mode: {name: 'gas', architecture: 'ARMv6'},
    theme: 'monokai',
    gutters: ['running', 'CodeMirror-linenumbers']
  });

  var marker = document.createElement('div');
  marker.style.color = 'lime';
  marker.innerHTML = '»';

  function execute (direct) {
    output.innerText = '';
    var alias = {
      'PC': 'r31',
      'BR': 'r30',
      'SP': 'r29',
      'RP': 'r28',
      'DP': 'r27'
    };
    core = {
      register: new Int32Array(32), // r0 .. r31
      memory: new Int32Array(65535),

      set: function (what, value) {
        var register = /^r(\d+)/.exec(what);
        var pointer = /^@r(\d+)/.exec(what);
        var address = /^(-?[a-f0-9A-F]+)(h)?/.exec(what);

        if (pointer) {
          core.memory[core.register[+pointer[1]]] = +value(core.memory[core.register[+pointer[1]]]);
        } else if (register) {
          core.register[+register[1]] = +value(core.register[+register[1]]);
        } else if (address) {
          var r = address[1];
          switch (address[2]) {
            case 'h':
              r = parseInt(r, 16);
              break;
            default:
              r = +r;
              break;

          }
          core.memory[r] = +value(core.memory[r]);
        } else return false;
        return true;
      },

      get: function (what, allow) {
        (allow || (allow = true));

        var register = /^r(\d+)/.exec(what);
        var immediately = /^#(-?[a-f0-9A-F]+)(h|b|o)?/.exec(what);
        var pointer = /^@r(\d+)/.exec(what);
        var address = /^(-?[a-f0-9A-F]+)(h)?/.exec(what);

        if (pointer) {
          return core.memory[core.register[+pointer[1]]];
        } else if (immediately) {
          if (allow) {
            var r = immediately[1];
            switch (immediately[2]) {
              case 'h':
                r = parseInt(r, 16);
                break;
              default:
                r = +r;
                break;

            }
            return r;
          }
          return false;
        } else if (register) {
          return core.register[+register[1]];
        } else if (address) {
          var r = address[1];
          switch (address[2]) {
            case 'h':
              r = parseInt(r, 16);
              break;
            default:
              r = +r;
              break;

          }
          return core.memory[r];
        } else return false;
      }
    };

    core.register[29] = core.memory.length - 1;

    var instructions = [
      {
        reg: /simulation memory +([\w@#\-]+)/,
        run: function (param) {
          if ((param = core.get(param)) === false) return false;
          core.memory = new Int32Array(param);
          core.register[29] = core.memory.length - 1;
          return true;
        }
      }, {
        reg: /mov +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function () {
            return value;
          });
        }
      }, {
        reg: /out +([\w@#\-]+)/,
        run: function (value) {
          if ((value = core.get(value)) === false) return false;
          output.innerText += String.fromCharCode(value);
          return true;
        }
      }, {
        reg: /in +([\w@#\-]+)/,
        run: function (param) {
          return core.set(param, function (p) {
            var char = input.innerText.charCodeAt(0);
            input.innerText = input.innerText.substring(1);

            return isNaN(char) ? 0 : char;
          });
        }
      }, {
        reg: /add +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p + value;
          });
        }
      }, {
        reg: /inc +([\w@#\-]+)/,
        run: function (param) {
          return core.set(param, function (p) {
            return p + 1;
          });
        }
      }, {
        reg: /dec +([\w@#\-]+)/,
        run: function (param) {
          return core.set(param, function (p) {
            return p - 1;
          });
        }
      }, {
        reg: /sub +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p - value;
          });
        }
      }, {
        reg: /mul +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p * value;
          });
        }
      }, {
        reg: /mod +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p % value;
          });
        }
      }, {
        reg: /left +shift +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p << value;
          });
        }
      }, {
        reg: /right +shift +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p >>> value;
          });
        }
      }, {
        reg: /div +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((value = core.get(value)) === false) return false;
          return core.set(param, function (p) {
            return p / value;
          });
        }
      }, {
        reg: /pop +([\w@#\-]+)/,
        run: function (param) {
          return core.set(param, function () {
            return core.memory[core.register[29]++];
          });
        }
      }, {
        reg: /push +([\w@#\-]+)/,
        run: function (param) {
          if ((param = core.get(param)) === false) return false;
          core.memory[--core.register[29]] = param;
          return true;
        }
      }, {
        reg: /(\w+): *db ([^]+)/,
        run: function (alias, text) {
          var err = false;
          var group = text.split(',').map(function (o) {
            var isString = /^\s*"((?:[^\\"]|\\\\|\\")*)"\s*$/.exec(o);
            var isNumber = /^\s*(\d+)\s*$/.exec(o);
            var isHex = /^\s*([0-9A-Fa-f]+)[hH]\s*$/.exec(o);
            var isChar = /^\s*'(.)'\s*$/.exec(o);

            if (isString) {
              return isString[1];
            } else if (isChar) {
              return isChar[1];
            } else if (isHex) {
              return String.fromCharCode(parseInt(isHex[1], 16));
            } else if (isNumber) {
              return String.fromCharCode(isNumber[1]);
            }

            err = true;
          });

          if (err) return false;
          text = group.join('');
          var address = core.register[27], i = 0;
          positions[alias] = address;
          for (; i < text.length; i++) core.memory[i + address] = text.charCodeAt(i);
          core.register[27] += i;
          return true;
        }
      }, {
        reg: /branch exit/,
        run: function () {
          if (core.register[30]) {
            core.register[31] = -1 >>> 5;
          }
          return true;
        }
      }, {
        reg: /branch back/,
        run: function () {
          if (core.register[30]) {
            core.register[31] = core.register[28] + 1;
          }
          return true;
        }
      }, {
        reg: /branch +([\w@#\-]+)/,
        run: function (address) {
          if ((address = core.get(address)) === false) return false;

          if (core.register[30]) {
            core.register[31] = +address - 1;
          }
          return true;
        }
      }, {
        reg: /jump back/,
        run: function () {
          core.register[31] = core.register[28] + 1;
          return true;
        }
      }, {
        reg: /jump exit/,
        run: function () {
          core.register[31] = -1 >>> 5;
          return true;
        }
      }, {
        reg: /jump +([\w@#\-]+)/,
        run: function (address) {
          if ((address = core.get(address)) === false) return false;

          core.register[31] = +address - 1;
          return true;
        }
      }, {
        reg: /call +([\w@#\-]+)/,
        run: function (address) {
          if ((address = core.get(address)) === false) return false;

          core.register[28] = core.register[31] - 1;
          core.register[31] = +address - 1;
          return true;
        }
      }, {
        reg: /branch not +([\w@#\-]+)/,
        run: function (address) {
          if ((address = core.get(address)) === false) return false;

          if (!core.register[30]) {
            core.register[31] = +address - 1;
          }
          return true;
        }
      }, {
        reg: /not +equal +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((param = core.get(param)) === false) return false;
          if ((value = core.get(value)) === false) return false;

          core.register[30] = +(param != value);
          return true;
        }
      }, {
        reg: /equal +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((param = core.get(param)) === false) return false;
          if ((value = core.get(value)) === false) return false;

          core.register[30] = +(param == value);
          return true;
        }
      }, {
        reg: /big +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((param = core.get(param)) === false) return false;
          if ((value = core.get(value)) === false) return false;

          core.register[30] = +(param > value);
          return true;
        }
      }, {
        reg: /small +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((param = core.get(param)) === false) return false;
          if ((value = core.get(value)) === false) return false;

          core.register[30] = +(param < value);
          return true;
        }
      }, {
        reg: /big +equal +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((param = core.get(param)) === false) return false;
          if ((value = core.get(value)) === false) return false;

          core.register[30] = +(param >= value);
          return true;
        }
      }, {
        reg: /small +equal +([\w@#\-]+), *([\w@#\-]+)/,
        run: function (param, value) {
          if ((param = core.get(param)) === false) return false;
          if ((value = core.get(value)) === false) return false;

          core.register[30] = +(param <= value);
          return true;
        }
      }, {
        reg: /(^\s*|nop)$/,
        run: function () {
          return true;
        }
      }
    ];

    if (cpu) {
      clearInterval(cpu);
    }

    var simpleLines = editor.getValue().trim().replace(/<br>|\r\n|\n\r|\r|\n/g, '\n').split(/\n/);
    lines = simpleLines.concat(library.trim().replace(/<br>|\r\n|\n\r|\r|\n/g, '\n').split(/\n/));

    editor.setValue(lines.join('\n'));

    var positions = {};

    var logicUnit = function () {
      var line = lines[core.register[31]].trim().replace(/\$(\w+)/, function (a, m) {
        if (alias[m]) return alias[m];
        return '#' + positions[m];
      });

      var ok = instructions.some(function (instruction) {
        var r = instruction.reg.exec(line);

        if (r == null) {
          return false;
        }

        r.shift();

        return instruction.run.apply(core.register[31], r);
      });

      core.register[31]++;
      drawMemory();
      editor.setGutterMarker(core.register[31], 'running', marker);

      if (!ok || core.register[31] >= lines.length) {
        setTimeout(function () {
          editor.setOption('readOnly', false);
          editor.setValue(simpleLines.join('\n'));
          if (!ok) output.innerText = 'error at ' + core.register[31];
        }, cpuSpeed.value);
        clearInterval(cpu);
        return false;
      }
      return true;
    };


    if (!direct) {
      cpu = setInterval(logicUnit, cpuSpeed.value > 1000 ? 1 : cpuSpeed.value < 1 ? 1000 : 1000 / cpuSpeed.value);
    }

    lines.every(function (line, index) {
      var control = /^(\w+):/.exec(line);
      if (control) {
        if (positions[control[1]]) {
          clearInterval(cpu);
          output.innerText = 'error at ' + (index++);
          return false;
        }

        positions[control[1]] = index;
      }
      return true;
    });

    stop.onclick = function () {
      editor.setOption('readOnly', false);
      editor.setValue(simpleLines.join('\n'));
      clearInterval(cpu);
    };

    if (direct) {
      while (logicUnit() != false) {
      }
    }
  }

  function drawMemory () {
    var m = '', i;

    for (i = 0; i < core.register.length; i++) {
      m += '<tr><td>r' + i + '</td><td>' + core.register[i] + '</td></tr>';
    }

    for (i = 0; i < Math.min(10, core.memory.length); i++) {
      m += '<tr><td>' + i + '</td><td>' + core.memory[i] + '</td></tr>';
    }

    table.innerHTML = m;
  }

  run.onclick = function () {
    editor.setOption('readOnly', true);
    localStorage.setItem('last', editor.getValue());
    execute();
  };

  var last = localStorage.getItem('last');
  if (last) {
    editor.setValue(last);
  }


  direct.onclick = function () {
    execute(true);
  }
}

function download (lib, callback) {
  var xhr = new XMLHttpRequest();

  xhr.onload = function (e) {
    callback(xhr.response)
  };

  xhr.open("GET", "bin/" + lib + ".asm");
  xhr.send();
}

(function () {
  libs.iterate(function (l, done) {
    download(l, function (data) {
      done(data);
    });
  }, function (err, results) {
    if (err) {
      return console.log("files can't loaded :(");
    }

    results.unshift("jump exit");
    Core(results);
  }, 10000);

})();
