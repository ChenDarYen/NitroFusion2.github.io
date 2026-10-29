(function() {
  "use strict";
  document.documentElement.classList.add("js");
  var copy = document.querySelector(".cite .copy");
  var pre = document.querySelector(".cite pre");
  if (copy && pre) {
    copy.addEventListener("click", (function() {
      var done = function() {
        copy.textContent = "Copied";
        setTimeout((function() {
          copy.textContent = "Copy";
        }), 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(done, done);
      } else {
        var r = document.createRange();
        r.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        try {
          document.execCommand("copy");
        } catch (e) {}
        done();
      }
    }));
  }
  var sc = document.querySelector(".arch__scroller");
  var vl = document.querySelector(".arch__veil--l");
  var vr = document.querySelector(".arch__veil--r");
  if (sc && vl && vr) {
    var update = function() {
      var max = sc.scrollWidth - sc.clientWidth;
      if (max <= 0) {
        vl.style.opacity = 0;
        vr.style.opacity = 0;
        return;
      }
      var left = sc.scrollLeft;
      vl.style.opacity = Math.min(1, left / 48);
      vr.style.opacity = Math.min(1, (max - left) / 48);
    };
    sc.addEventListener("scroll", update, {
      passive: true
    });
    window.addEventListener("resize", update);
    update();
  }
})();