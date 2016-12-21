define(["child_process"], function(childProcess) {

  function run(makeMeasurements, options) {

    const workDir = options.workDir;

    const lines =
      childProcess.execSync("find ./src/ -name \"*.arr\" | xargs wc -l | tail -n 1", {cwd: workDir});
    const linesNum = Number(String(lines).trim().split(" ")[0]);
    
    return makeMeasurements([
      {
        labels: ["arr-line-count", "source-code"],
        measurement: linesNum,
        unit: "lines"
      }
    ]);
  }

  return {
    run: run
  };
});

