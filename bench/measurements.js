define(["./time-phases", "./count-lines"], function(tp, cl) {

  
  console.log("Measurers:", tp, cl);

  return {
    "time-phases": tp.run,
    "count-lines": cl.run
  };

});
