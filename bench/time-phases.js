define(["child_process"], function(childProcess) {

  function maybeTime(shouldRun, f) {
    if(!shouldRun) { return [false, "skipped", 0]; }
    var start = process.hrtime();
    try {
      var ans = f();
      return [true, ans, process.hrtime(start)];
    }
    catch(e) {
      return [false, String(e), process.hrtime(start)]
    }
  }

  function hrtimeToMicroseconds(t) {
    return (t[0] * 1000000) + (t[1] / 1000);
  }

  function run(makeMeasurements, options) {

    const workDir = options.workDir;
    
    const [installSuccess, , timeInstall] = maybeTime(true, () =>
      childProcess.execSync("npm install", {cwd: workDir}));
    const [aSuccess, , timeA] = maybeTime(installSuccess, () =>
      childProcess.execSync("make phaseA", {cwd: workDir}));
    const [bSuccess, , timeB] = maybeTime(aSuccess, () =>
      childProcess.execSync("make phaseB", {cwd: workDir}));
    const [cSuccess, timeC] = maybeTime(bSuccess, () =>
      childProcess.execSync("make phaseC", {cwd: workDir}));

    return makeMeasurements([
      aSuccess && {
        labels: ["js-wall-time", "compiler-build", "phaseA"],
        measurement: hrtimeToMicroseconds(timeA),
        unit: "microseconds"
      },
      bSuccess && {
        labels: ["js-wall-time", "compiler-build", "phaseB"],
        measurement: hrtimeToMicroseconds(timeB),
        unit: "microseconds"
      },
      cSuccess && {
        labels: ["js-wall-time", "compiler-build", "phaseC"],
        measurement: hrtimeToMicroseconds(timeC),
        unit: "microseconds"
      }
    ].filter((a) => a));
  }

  return {
    run: run
  };
});

