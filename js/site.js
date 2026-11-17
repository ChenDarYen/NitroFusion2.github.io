(function() {
  "use strict";
  document.documentElement.classList.add("js");
  var copy = document.querySelector("#citation .copy");
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
        navigator.clipboard.writeText(pre.innerText).then(done, done);
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
  var run = document.querySelector(".demo__run");
  var stage = document.querySelector(".demo__stage");
  if (run && stage) {
    var loadDemo = function(focus) {
      if (stage.firstChild) return;
      var f = document.createElement("iframe");
      f.src = run.getAttribute("data-embed");
      f.title = "NitroFusion2 live demo: text-to-image and ControlNet";
      f.setAttribute("allow", "clipboard-write; fullscreen");
      stage.setAttribute("aria-busy", "true");
      var origin = /^https?:\/\/[^\/]+/.exec(f.src)[0];
      var fit = false, tries = 0;
      var hello = function() {
        if (fit || tries++ > 60 || !f.contentWindow) return;
        f.contentWindow.postMessage("[iFrameSizer]nf2demo:0:false:false:32:true:true:null:bodyOffset:null:null:0:false:child:scroll:false", origin);
        setTimeout(hello, 500);
      };
      window.addEventListener("message", function(e) {
        if (e.source !== f.contentWindow || e.origin !== origin || typeof e.data !== "string") return;
        var m = /^\[iFrameSizer\]nf2demo:(\d+(?:\.\d+)?):/.exec(e.data);
        var h = m ? Math.ceil(parseFloat(m[1])) : 0;
        if (h < 200) return;
        fit = true;
        f.setAttribute("scrolling", "no");
        f.style.height = h + "px";
        stage.classList.add("is-fit");
      });
      f.addEventListener("load", function() {
        stage.removeAttribute("aria-busy");
        fit = false; tries = 0;
        hello();
      });
      stage.appendChild(f);
      stage.hidden = false;
      run.hidden = true;
      if (focus) f.focus();
    };
    run.addEventListener("click", function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      loadDemo(true);
    });
    var jump = document.querySelector('.links a[href="#demo"]');
    if (jump) jump.addEventListener("click", function() { loadDemo(false); });
    if (location.hash === "#demo") loadDemo(false);
  }
})();
