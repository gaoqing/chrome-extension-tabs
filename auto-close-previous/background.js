
chrome.tabs.onUpdated.addListener(
    async (tabId, changeInfo, tab) => {
        if (tab.url === "chrome://newtab/") {
            return;
        }

        if (changeInfo.status === 'loading') {
            const currentWindowId = chrome.windows.WINDOW_ID_CURRENT;
            await closePreviousSameUrlTab(currentWindowId, tab, tab.url);
        }
    });

function closePreviousSameUrlTab(currentWindowId, currentTab, url) {
    return new Promise(async resolve => {

        const checkInactive = async () => {
            const allMatches = await new Promise(resolve => {
                chrome.tabs.query({ windowId : currentWindowId }, tabs => {
                    resolve(tabs.filter(t => t.url === url));
                });
            })
            const inactive = allMatches.filter(t => !t.active).filter(t => t.id !== currentTab.id);
            return {inactive, allMatches};
        };

        const inactive = (await checkInactive()).inactive;

        if (inactive.length > 0) {
            // cater for case when want to duplicate existing tab and then drag it to a new window, to defer a late double check
            setTimeout(async () => {
                const { inactive, allMatches } = await checkInactive();
                if (inactive.length > 0) {
                    const idsToClose = inactive.map(t => t.id);
                    if(allMatches.length > inactive.length) {
                        chrome.tabs.remove(idsToClose);
                    } else {
                        idsToClose.pop(); // pop then at least keep one
                        chrome.tabs.remove(idsToClose);
                    }
                }
            }, 15 * 1000);
        }
    });
}