/* eslint-disable no-console */
/* eslint-disable no-process-env */

(async () => {
  var semver = require("semver");
  var nodeVersion = semver.parse(process.version);
  if (nodeVersion.major < 12 || (nodeVersion.major == 12 && nodeVersion.minor < 9)) {
    console.error("ERROR: Node.JS 12+ (>=12.9) required in this version!");
    console.error("Node.JS version running this bot:", process.version);
    process.exit(1);
  }

  var childProcess = require("child_process");
  var http = require("http");
  var fs = require("fs");
  var path = require("path");

  //Heroku: Run a dummy HTTP server. Why? https://i.imgur.com/KgsYleA.png
  var herokuCompatible = http.createServer(function (req, res) {
    res.writeHead(200, "OK", {
      "Content-Type": "text/plain"
    });
    res.write(`This is just a dummy HTTP server to fool Heroku. https://i.imgur.com/KgsYleA.png \r\nC3CBot - https://github.com/lequanglam/c3c`);
    res.end();
  });
  herokuCompatible.listen(process.env.PORT || 0, "0.0.0.0");

  function spawn(cmd, arg) {
    return new Promise(resolve => {
      var npmProcess = childProcess.spawn(cmd, arg, {
        shell: true,
        stdio: "pipe",
        cwd: __dirname
      });
      npmProcess.on("close", function (code) {
        resolve(code);
      });
    });
  }

  /**
   * C3CLoader Function
   *
   * @param   {boolean}    first  First time?
   *
   * @return  {undefined}         Nothing
   */
  async function loader(first) {
    if (!first) {
      console.log();
      console.log(`[Loader] 7378278/RESTART error code found. Restarting...`);
    }
    if (fs.existsSync(path.join(__dirname, "c3c-nextbootupdate"))) {
      await (spawn("npm", ["--production", "install"])
        .then(() => spawn("npm", ["--depth", "9999", "update"]))
        .then(() => {
          fs.unlinkSync(path.join(__dirname, "c3c-nextbootupdate"));
        })
        .catch(_ => { }));
    }
    var child = childProcess.spawn("node", ["--trace-warnings", "main.js"], {
      cwd: __dirname,
      maxBuffer: 16384 * 1024,
      stdio: 'inherit',
      shell: true
    });
    child.on("close", async (code) => {
      //UNIX, why? (limited to 8-bit)
      //Original code: 7378278
      if (code % 256 == 102) {
        await loader(false);
        return;
      }

      console.log();
      console.log(`[Loader] main.js throw ${code} (not 7378278/RESTART). Shutting down...`);
      process.exit();
    });
    child.on("error", function (err) {
      console.log();
      console.log("[Loader] Error:", err);
    });
  }
  await loader(true);
})();
