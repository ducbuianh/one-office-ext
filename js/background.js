// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
  });
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.url.includes("approval-overtime-overtime/add")) {
    chrome.tabs.sendMessage(tab.id, {"message": "create_overtime"});
  }
  if (changeInfo.status == 'complete' && tab.url.includes("user/attendance")) {
    chrome.tabs.sendMessage(tab.id, {"message": "timesheet_load"});
  }
});

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.message === 'create_absence') {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "create_absence"});
      });
    }
  }
);
