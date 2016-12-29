define(["child_process", "time-helpers", "fs", "path"], function(childProcess, timeHelpers, fs, path) { 
  function run(makeMeasurements, options) {

    const { hrtimeToMicroseconds, maybeTime } = timeHelpers;
    const workDir = options.workDir;
    console.log(options);
    const config = options.config || { include: [], programsPath: "programs/" };
    const programsPath = config.programsPath || "programs/";


    function echoRun(cmd, opts) {
      console.log(cmd);
      return childProcess.execSync(cmd, opts);
    }

    echoRun("make phaseB", {cwd: workDir, stdio: [0, 1, 2]});
    echoRun(`rm -rf ${options.buildDir}/compiled`);

    function compileAndTimeRun(program) {
      const [compileSuccess, , ] = maybeTime(true, () => echoRun(
        `node ${workDir}/src/server/client.js \
              --compiler ${workDir}/build/phaseB/pyret.jarr \
              --program ${program} \
              --outfile ${program}.jarr \
              --builtin-js-dir ${workDir}/src/js/trove \
              --builtin-arr-dir ${workDir}/src/arr/trove \
              --require-config bench-program-config.json \
              --standalone-file ${workDir}/src/js/base/handalone.js \
              --compiled-dir ${options.buildDir}/compiled/`, {stdio: [0, 1, 2]}));

      return maybeTime(compileSuccess, () => echoRun(`node ${program}.jarr`));
    }

    let paths = fs.readdirSync(programsPath);
    console.log("Running for these programs: ", paths);
    paths = paths.filter((p) => p.slice(-4) === ".arr");
    paths = paths.filter((p) => config.include.some((i) => (p.indexOf(i) !== -1)));
    console.log("Running for these programs after filters: ", paths);
    const results = [];
    paths.map((p) => {
      const programPath = path.join(programsPath, p);
      const [runSuccess, , time] = compileAndTimeRun(programPath);
      if(runSuccess) {
        results.push({
            labels: ["bench-program", p],
            measurement: hrtimeToMicroseconds(time),
            unit: "microseconds"
          });
      }
    });

    return makeMeasurements(results);
  }

  return {
    run: run
  };
});

