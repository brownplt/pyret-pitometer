var require = require('requirejs');
require(["./checkout-pyret", "child_process", "fs", "command-line-args", "node-uuid"], function(checkoutPyret, childProcess, fs, commandLineArgs, uuid) {

  const optionDefinitions = [
    { name: 'commits-file', alias: 'c', type: String },
    { name: 'repo', alias: 'r', type: String },
    { name: 'outfile', alias: 'o', type: String }
  ];

  const options = commandLineArgs(optionDefinitions)

  var base = options.repo;
  var workDir = "build-space/pyret-lang-time-phases";
  var mkdir = "mkdir -p build-space";

  function parseBranches(str) {
    /* Example output:

$ git branch --contains d91dfc7876de3e2ecc589435f973f35be62435d0
  bare
  dag-accum
* return-and-tail
  return-stack


$ git branch --contains 119a5e636a09dcc7ad228ee2f7cafdad4a804e06
* (HEAD detached at 119a5e6)
  return-and-tail

    */
    return str
      .split("\n")
      .filter((s) => s !== "")
      .filter((s) => s.indexOf("HEAD") === -1)
      .map((s) => s.slice(2));
  }

  function time(f) {
    var start = process.hrtime();
    var ans = f();
    return [ans, process.hrtime(start)];
  }

  function hrtimeToMicroseconds(t) {
    return (t[0] * 1000000) + (t[1] / 1000);
  }

  function timeCommit(commit) {
    childProcess.execSync(mkdir);

    checkoutPyret.cloneIfNeeded(base, workDir);
    checkoutPyret.justCheckout(workDir, commit);

    childProcess.execSync("make clean", {cwd: workDir});

    console.log("Checked out and made clean");

    const runString = (cmd) => String(childProcess.execSync(cmd, { cwd: workDir}));

    const code_date = new Date(runString("git show -s --format=%ci " + commit));
    const info = runString("git show --stat " + commit);
    const branches = parseBranches(runString("git branch --contains " + commit));

    const [, timeA] = time(() =>
      childProcess.execSync("echo 'make phaseA'", {cwd: workDir}));
    const [, timeB] = time(() =>
      childProcess.execSync("echo 'make phaseB'", {cwd: workDir}));
    const [, timeC] = time(() =>
      childProcess.execSync("echo 'make phaseC'", {cwd: workDir}));

    const date = new Date();

    return [
      {
        id: uuid.v4(),
        labels: ["js-wall-time", "compiler-build", "phaseA"],
        measurement_date: String(date),
        code_date: String(code_date),
        commit: commit,
        branches: branches,
        measurement: hrtimeToMicroseconds(timeA),
        unit: "microseconds"
      },
      {
        id: uuid.v4(),
        labels: ["js-wall-time", "compiler-build", "phaseB"],
        measurement_date: String(date),
        code_date: String(code_date),
        commit: commit,
        branches: branches,
        measurement: hrtimeToMicroseconds(timeB),
        unit: "microseconds"
      },
      {
        id: uuid.v4(),
        labels: ["js-wall-time", "compiler-build", "phaseC"],
        measurement_date: String(date),
        code_date: String(code_date),
        commit: commit,
        branches: branches,
        measurement: hrtimeToMicroseconds(timeC),
        unit: "microseconds"
      }
    ];
  }

  const commits = String(fs.readFileSync(options["commits-file"])).split("\n").filter((s) => s !== "");

  const allMeasurements = [];
  commits.forEach((c) =>
    allMeasurements.push.apply(allMeasurements, timeCommit(c))
  );

  console.log(JSON.stringify(allMeasurements, null, "  "));

})
    


