define(["child_process"], function(childProcess) {

  function time(f) {
    var start = process.hrtime();
    var ans = f();
    return [ans, process.hrtime(start)];
  }

  function hrtimeToMicroseconds(t) {
    return (t[0] * 1000000) + (t[1] / 1000);
  }


  function run(makeMeasurements, options) {

    const workDir = options.workDir;
    
    childProcess.execSync("npm install", {cwd: workDir});
    const [, timeA] = time(() =>
      childProcess.execSync("make phaseA", {cwd: workDir}));
    const [, timeB] = time(() =>
      childProcess.execSync("make phaseB", {cwd: workDir}));
    const [, timeC] = time(() =>
      childProcess.execSync("make phaseC", {cwd: workDir}));

    return makeMeasurements([
      {
        labels: ["js-wall-time", "compiler-build", "phaseA"],
        measurement: hrtimeToMicroseconds(timeA),
        unit: "microseconds"
      },
      {
        labels: ["js-wall-time", "compiler-build", "phaseB"],
        measurement: hrtimeToMicroseconds(timeB),
        unit: "microseconds"
      },
      {
        labels: ["js-wall-time", "compiler-build", "phaseC"],
        measurement: hrtimeToMicroseconds(timeC),
        unit: "microseconds"
      }
    ]);
  }

  return {
    run: run
  };
});

