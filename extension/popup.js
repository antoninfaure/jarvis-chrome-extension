document.addEventListener('DOMContentLoaded', function () {
    var openSidePanelButton = document.getElementById('openSidePanel');

    if (openSidePanelButton) {
        openSidePanelButton.addEventListener('click', function () {
            
            chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
                console.log("tabs:", tabs);
                if (tabs.length === 0) {
                    console.error("No active tab found");
                    return;
                }
                chrome.sidePanel.open({ windowId: tabs[0].windowId })
            });
        });
    }


});
