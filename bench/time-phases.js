define(["child_process", "time-helpers"], function(childProcess, timeHelpers) {

  function run(makeMeasurements, options) {

    const { hrtimeToMicroseconds, maybeTime } = timeHelpers;
    const workDir = options.workDir;

    childProcess.execSync("make clean", {cwd: workDir});
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

