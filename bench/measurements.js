define(["./bench-programs", "./time-phases", "./count-lines", "./count-ar-vars"], function(bp, tp, cl, cav) {

  return {
    "bench-programs": bp.run,
    "time-phases": tp.run,
    "count-lines": cl.run,
    "count-ar-vars": cav.run
  };

});

