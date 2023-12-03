const STORAGE_KEY = 'IGNORE_URLS';
let IGNORE_URLS = [];

loadStorage(STORAGE_KEY).then(list => IGNORE_URLS = list);

chrome.storage.onChanged.addListener(() => loadStorage(STORAGE_KEY).then(list => IGNORE_URLS = list))

chrome.tabs.onUpdated.addListener(
    async (tabId, changeInfo, tab) => {
        if (tab.url === "chrome://newtab/" || IGNORE_URLS.find(skip => tab.url.indexOf(skip) > -1)) {
            return;
        }

        if (changeInfo.status === 'loading') {
            const currentWindowId = chrome.windows.WINDOW_ID_CURRENT;
            await focusPreviousSameUrlTab(currentWindowId, tab, tab.url);
        }
    })

function focusPreviousSameUrlTab(currentWindowId, currentTab, url) {
    return new Promise(async resolve => {
        const matchedTabs = await new Promise(resv => {
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

function loadStorage(storageKey) {
    return new Promise(resolve => {
        chrome.storage.local.get(storageKey, items => {
            const list = JSON.parse(items[storageKey] || '[]');
            resolve(list);
        });
    })
}
