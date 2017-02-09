define(["child_process", "pyret-ar-print"], function(childProcess, pyretARPrint) {

  function run(makeMeasurements, options) {

    const workDir = options.workDir;

    childProcess.execSync("make phaseB", {cwd: workDir});


    function PitometerARCallback() {
      var data = {sum: 0, count: 0};
      return {
        data: data,
        callback: function(node) {
          data.sum += node.arguments[4].elements.length;
          data.count++;
        }
      };
    }

    var cb = PitometerARCallback();
    pyretARPrint.processFile(workDir + "/build/phaseB/pyret.jarr", cb);

    return makeMeasurements([
      {
        labels: ["avg-ar-size", "activation-records", "js-output"],
        measurement: cb.data.sum / cb.data.count,
        unit: "variables"
      },
      {
        labels: ["total-ar-size", "activation-records", "js-output"],
        measurement: cb.data.sum,
        unit: "variables"
      },
      {
        labels: ["total-ar-count", "activation-records", "js-output"],
        measurement: cb.data.count,
        unit: "variables"
      }
    ]);
  }

  return {
    run: run
  };
});

