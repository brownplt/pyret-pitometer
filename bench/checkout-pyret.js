define(["child_process", "fs"], function(child_process, fs) {

  function checkout(base, commit) {
    var dirName = "build-space/pyret-lang-" + commit
    child_process.execSync("git clone " + base + " " + dirName);
    child_process.execSync("git checkout " + commit, { cwd: dirName });
    child_process.execSync("npm install", { cwd: dirName });
  }

  function cloneIfNeeded(base, dirName) {
    if(!fs.existsSync(dirName)) {
      child_process.execSync("git clone " + base + " " + dirName);
    }
    else {
      child_process.execSync("git fetch --all", { cwd: dirName });
    }
  }

  function justCheckout(dirName, commit) {
    child_process.execSync("git checkout " + commit, { cwd: dirName });
    child_process.execSync("npm install ", {cwd: dirName});
  }

  return {
    checkout: checkout,
    justCheckout: justCheckout,
    cloneIfNeeded: cloneIfNeeded
  };
});

