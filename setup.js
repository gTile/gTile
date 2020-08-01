const installedApp = {};

const registerExtension = function(i, e, d) {
  installedApp.init = i;
  installedApp.enable = e;
  installedApp.disable = d;
};

function init() {
  if (installedApp.init) {
    installedApp.init();
  }
}
function enable() {
  if (installedApp.enable) {
    installedApp.enable();
  }
}

function disable() {
  if (installedApp.disable) {
    installedApp.disable();
  }
}
