var require = require('requirejs');
require(["./checkout-pyret", "child_process", "fs", "command-line-args", "node-uuid", "./measurements"], function(checkoutPyret, childProcess, fs, commandLineArgs, uuid, measurements) {

  const optionDefinitions = [
    { name: 'commits-file', alias: 'c', type: String },
    { name: 'commit', type: String },
    { name: 'repo', alias: 'r', type: String },
    { name: 'outfile', alias: 'o', type: String }
  ];

  const options = commandLineArgs(optionDefinitions)

  var base = options.repo;
  var workDir = "build-space/pyret-lang-time-phases";
  var mkdir = "mkdir -p build-space";

  function parseBranches(str) {
    /* Example output:

$ git branch -r --contains d91dfc7876de3e2ecc589435f973f35be62435d0
  origin/bare
  origin/dag-accum
  origin/return-and-tail
  origin/return-stack


$ git branch -r --contains 119a5e636a09dcc7ad228ee2f7cafdad4a804e06
  origin/return-and-tail

    */
    return str
      .split("\n")
      .filter((s) => s !== "")
      .filter((s) => s.indexOf("HEAD") === -1)
      .map((s) => s.slice(9));
  }

  function measureCommit(commit, runner) {
    childProcess.execSync(mkdir);

    checkoutPyret.cloneIfNeeded(base, workDir);
    checkoutPyret.justCheckout(workDir, commit);

    childProcess.execSync("make clean", {cwd: workDir});

    console.log("Checked out " + commit + " and made clean");

    const runString = (cmd) => String(childProcess.execSync(cmd, { cwd: workDir}));

    const codeDate = new Date(runString("git show -s --format=%ci " + commit));
    const commitInfo = runString("git show --stat " + commit);
    const branches = parseBranches(runString("git branch -r --contains " + commit));
    const date = new Date();

    const repoData = {
      codeDate: codeDate,
      commitInfo: commitInfo,
      branches: branches,
      commit: commit,
      measurementDate: date
    };

    function makeMeasurements(measurements) {
      return measurements.map(function(m) {
        return {
          uuid: uuid.v4(),
          codeDate: codeDate.toISOString(),
          commitInfo: commitInfo,
          branches: branches,
          commit: commit,
          measurementDate: codeDate.toISOString(),
          labels: m.labels,
          measurement: m.measurement,
          unit: m.unit
        };
      });
    }
    
    return runner(makeMeasurements, {
      repoData: repoData,
      workDir: workDir
    });

  }

  let commits = [];

  if(options["commits-file"]) {
    commits = String(fs.readFileSync(options["commits-file"])).split("\n").filter((s) => s !== "");
  }
  else {
    commits = [options.commit];
  }

  const allMeasurements = [];
  commits.forEach((c) =>
    Object.keys(measurements).forEach((k) =>    
      allMeasurements.push.apply(allMeasurements, measureCommit(c, measurements[k]))
    )
  );

  fs.writeFileSync(options.outfile, JSON.stringify(allMeasurements, null, "  "));

})
    


