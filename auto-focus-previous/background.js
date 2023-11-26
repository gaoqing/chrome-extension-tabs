const KEY = 'INGORE_URLS';
let IGNORE_URLS = [];

loadStorage().then(list => IGNORE_URLS = list);

chrome.storage.onChanged.addListener(() => loadStorage().then(list => IGNORE_URLS = list))

chrome.tabs.onUpdated.addListener(
    async (tabId, changeInfo, tab) => {
        if (tab.url === "chrome://newtab/" || IGNORE_URLS.find(skip => tab.url.indexOf(skip) > -1)) {
            return;
        }

        if (changeInfo.status === 'loading') {
            var currentWindowId = chrome.windows.WINDOW_ID_CURRENT;
            await focusPreviousSameUrlTab(currentWindowId, tab, tab.url);
        }
    })

function focusPreviousSameUrlTab(currentWindowId, currentTab, url) {
    return new Promise(async resolve => {
        var matchedTabs = await new Promise(resv => {
            chrome.tabs.query({windowId: currentWindowId}, tabs => {
                resv(tabs.filter(t => t.id !== currentTab.id).filter(t => t.url === url));
            });
        })

        if (matchedTabs.length > 0) {
            chrome.tabs.update(matchedTabs[0].id, {active: true}, () => {
                chrome.tabs.remove(currentTab.id);
                resolve();
            })
        }
    })
}

function loadStorage() {
    return new Promise(resolve => {
        chrome.storage.local.get(KEY, items => {
            var list = JSON.parse(items[`${KEY}`] || '[]');
            resolve(list);
        });
    })
}
