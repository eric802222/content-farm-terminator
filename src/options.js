const validator = new ContentFarmFilter();

function quit() {
  if (history.length > 1) {
    history.go(-1);
  } else {
    chrome.tabs.getCurrent((tab) => {
      chrome.runtime.sendMessage({
        cmd: 'closeTab',
        args: {tabId: tab.id}
      });
    });
  }
}

function loadOptions() {
  return utils.getDefaultOptions().then((options) => {
    document.querySelector('#userBlacklist textarea').value = options.userBlacklist;
    document.querySelector('#userWhitelist textarea').value = options.userWhitelist;
    document.querySelector('#webBlacklists textarea').value = options.webBlacklists;
    document.querySelector('#transformRules textarea').value = options.transformRules;
    document.querySelector('#showLinkMarkers input').checked = options.showLinkMarkers;
    document.querySelector('#showContextMenuCommands input').checked = options.showContextMenuCommands;
    document.querySelector('#showUnblockButton input').checked = options.showUnblockButton;

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        cmd: 'getMergedBlacklist',
      }, resolve);
    }).then((blacklist) => {
      document.querySelector('#allBlacklist textarea').value = blacklist;
    });
  });
}

function saveOptions() {
  const userBlacklist = document.querySelector('#userBlacklist textarea').value;
  const userWhitelist = document.querySelector('#userWhitelist textarea').value;
  const webBlacklists = document.querySelector('#webBlacklists textarea').value;
  const transformRules = document.querySelector('#transformRules textarea').value;
  const showLinkMarkers = document.querySelector('#showLinkMarkers input').checked;
  const showContextMenuCommands = document.querySelector('#showContextMenuCommands input').checked;
  const showUnblockButton = document.querySelector('#showUnblockButton input').checked;

  return utils.setOptions({
    userBlacklist: validator.validateRulesText(userBlacklist),
    userWhitelist: validator.validateRulesText(userWhitelist),
    webBlacklists: webBlacklists,
    transformRules: validator.validateTransformRulesText(transformRules),
    showLinkMarkers: showLinkMarkers,
    showContextMenuCommands: showContextMenuCommands,
    showUnblockButton: showUnblockButton,
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  utils.loadLanguages(document);

  // hide some options if contextMenus is not available
  // (e.g. Firefox for Android)
  if (!chrome.contextMenus) {
    document.querySelector('#transformRules').style.display = 'none';
    document.querySelector('#showContextMenuCommands').style.display = 'none';
  }

  loadOptions();

  try {
    const url = new URL(location.href).searchParams.get('from');
    if (url) {
      const urlRegex = `/^${utils.escapeRegExp(url, true)}$/`;
      document.querySelector('#urlInfo').textContent = utils.lang('urlInfo', [url, urlRegex]);
    }
  } catch (ex) {
    console.error(ex);
  }

  document.querySelector('#resetButton').addEventListener('click', (event) => {
    event.preventDefault();
    if (!confirm(utils.lang("resetConfirm"))) {
      return;
    }
    return utils.clearOptions().then(() => {
      return loadOptions();
    });
  });

  document.querySelector('#submitButton').addEventListener('click', (event) => {
    event.preventDefault();
    return saveOptions().then(() => {
      return quit();
    });
  });
});
