define(["child_process"], function(childProcess) {

  function time(f) {
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
    
    childProcess.execSync("npm install", {cwd: workDir});
    const [aSuccess, , timeA] = time(() =>
      childProcess.execSync("make phaseA", {cwd: workDir}));
    const [bSuccess, , timeB] = time(() =>
      childProcess.execSync("make phaseB", {cwd: workDir}));
    const [cSuccess, timeC] = time(() =>
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

