var require = require('requirejs');
require(["./checkout-pyret", "child_process", "fs", "path", "command-line-args", "node-uuid", "s3"], function(checkoutPyret, childProcess, fs, path, commandLineArgs, uuid, s3) {

  const optionDefinitions = [
    { name: 'commits-file', alias: 'c', type: String },
    { name: 'commit', type: String },
    { name: 'config', type: String },
    { name: 'repo', alias: 'r', type: String },
    { name: 'outdir', alias: 'o', type: String, defaultValue: "results/" },
    { name: 'aws-dir', type: String, defaultValue: "all-results/" },
    { name: 'test-upload', type: String },
    { name: 'test-upload-target', type: String },
    { name: 'list-results', type: Boolean },
    { name: 'list-results-contents', type: Boolean },
  ];

  const options = commandLineArgs(optionDefinitions)

  var client = s3.createClient({
    s3Options: {
      accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
      secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
    },
  });


  // Example return:
  /*
   [ { Key: 'bench-results/test-file1.json',
       LastModified: 2017-09-01T16:41:13.000Z,
       ETag: '"50bf0c88f3e034823ef6ffd499934100"',
       Size: 48,
       StorageClass: 'STANDARD' },
     { Key: 'bench-results/test-file2.json',
       LastModified: 2017-09-01T16:41:33.000Z,
       ETag: '"50bf0c88f3e034823ef6ffd499934100"',
       Size: 48,
       StorageClass: 'STANDARD' },
     { Key: 'bench-results/test-file3.json',
       LastModified: 2017-09-01T16:41:37.000Z,
       ETag: '"50bf0c88f3e034823ef6ffd499934100"',
       Size: 48,
       StorageClass: 'STANDARD' } ],
  */
  function getJSONFiles() {
    return new Promise((resolve, reject) => {
      var objectsList = [];
      var objects = client.listObjects({
        s3Params: {
          Bucket: "pyret-pitometer",
          Prefix: awsdir
        }
      });
      objects.on('error', function(err) {
        console.error("unable to list:", err.stack);
        reject(err);
      });
      objects.on('data', function(data) {
        objectsList = objectsList.concat(data.Contents);
      });
      objects.on('end', function() {
        resolve(objectsList);
      });
    });
  }

  function getJSONs(allJSONFiles) {
    return allJSONFiles.map((fileInfo) => {
      return new Promise((resolve, reject) => {
        var params = {
          Bucket: "pyret-pitometer",
          Key: fileInfo.Key,
        };
        var downloader = client.downloadBuffer(params);
        downloader.on('error', function(err) {
          console.error("unable to download:", err.stack);
          reject(err);
        });
        downloader.on('end', function(buffer) {
          resolve(String(buffer));
        });
      });
    });
  }

  function mergeJSONs(allJSONResults) {
    return Promise.all(allJSONResults.map((str) => {
      return str.then((str) => {
        return JSON.parse(str);
      });
    })).then((jsons) => {
      return jsons.reduce((l, r) => { return l.concat(r); });
    });
  }

  function getAndMergeJSONs() {
    return getJSONFiles().then(getJSONs).then(mergeJSONs);
  }

  function saveJSONFile(path, targetPath) {
    return new Promise((resolve, reject) => {
      var params = {
        localFile: path,
       
        s3Params: {
          Bucket: "pyret-pitometer",
          Key: targetPath
        },
      };
      var uploader = client.uploadFile(params);
      uploader.on('error', function(err) {
        console.error("unable to upload:", err.stack);
        reject(false);
      });
      uploader.on('progress', function() {
        console.log("progress", uploader.progressMd5Amount,
                  uploader.progressAmount, uploader.progressTotal);
      });
      uploader.on('end', function() {
        console.log("done uploading " + path);
        resolve(true);
      });
    });
  }

  if(options["test-upload"]) {
    var target = "test-upload-target";
    console.log("Uploading");
    saveJSONFile(options["test-upload"], options["test-upload-target"]);
    return;
  }

  console.log(options);

  if(options["list-results"]) {
    getAllJSONs();
    return;
  }

  if(options["list-results-contents"]) {
    getAndMergeJSONs().then((result) => {
      console.log(result); 
    });
    return;
  }


  var base = options.repo;
  var workDir = "build-space/pyret-lang";
  var outdir = options.outdir;
  var buildDir = "build-space";
  var mkdir = "mkdir -p build-space";
  var awsdir = options["aws-dir"];

  options.commit = options.commit || 'HEAD';

  if(fs.existsSync(outdir)) {
    if(fs.readdirSync(outdir).length !== 0) {
      console.error("Output directory exists and is non-empty, exiting to avoid clobbering data");
      return;
    }
  }
  else {
    fs.mkdirSync(outdir);
  }

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

  function measureCommit(commit) {
    childProcess.execSync(mkdir);

    checkoutPyret.cloneIfNeeded(base, workDir);

    const runString = (cmd) => String(childProcess.execSync(cmd, { cwd: workDir}));

    const commitBeforeCheckout = runString("git rev-parse HEAD");

    checkoutPyret.justCheckout(workDir, commit);

    const commitAfterCheckout = runString("git rev-parse HEAD");

    if(commitBeforeCheckout !== commitAfterCheckout) {
      console.log("Before this script ran, the repo was checked out to ", commitBeforeCheckout, " and is now on ", commitAfterCheckout, " so make clean is being run");
      childProcess.execSync("make clean", {cwd: workDir});
    }

    console.log("Checked out " + commit + " and made clean");


    const runTime = new Date().toISOString();
    const outFile = path.resolve(".", `${outdir}/${runTime}-${commit}.json`);
    let configOption = "";
    if(options.config) {
      const configFile = path.resolve(".", options.config);
      configOption = `--config ${configFile}`;
    }

    runString(`node pitometer/run-measurements.js ${configOption}`);
    runString(`cp pitometer/results.json ${outFile}`);
  }

  let commits = [];

  if(options["commits-file"]) {
    commits = String(fs.readFileSync(options["commits-file"])).split("\n").filter((s) => s !== "");
  }
  else {
    commits = [options.commit];
  }

  const allMeasurements = [];
  commits.forEach((c) => measureCommit(c));

  console.log("Done measuring commits, results stored in results/");

  const filesToCopy = fs.readdirSync(outdir);

  const copied = Promise.all(filesToCopy.map((f) => {
    return saveJSONFile(path.resolve(outdir, f), awsdir + path.basename(f));
  }));

  const allJSON = copied.then((_) => {
    return getAndMergeJSONs();
  });

  const allSaved = allJSON.then((ajson) => {
    const savedPath = path.resolve(outdir, "aggregated.json")
    fs.writeFileSync(savedPath, JSON.stringify(ajson));
    return saveJSONFile(savedPath, "aggregated.json");
  });

  allSaved.catch((err) => {
    console.error("Something went wrong: ", err, err.stack);
  });

  allSaved.then((_) => {
    console.log("Upload complete");
  });

})
