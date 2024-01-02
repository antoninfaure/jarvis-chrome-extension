chrome.action.onClicked.addListener((tab) => {
    // open sidePanel 
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      if (tabs.length === 0) {
          console.error("No active tab found");
          return;
      }
      chrome.sidePanel.open({ windowId: tabs[0].windowId })
  });
  });