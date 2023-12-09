chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "ICIBA",
        title: "iciba",
        type: 'normal',
        contexts: ['selection']
    });
});


const lastQuery = {};

chrome.contextMenus.onClicked.addListener((item, tab) => {
    const word = item.selectionText.toLowerCase();
    fetch(`https://dict.iciba.com/dictionary/word/suggestion?word=${word}`,
        {method: 'GET', headers: {"User-Agent": "curl/8.1.2", Host: "dict.iciba.com"}})
        .then(m => m.json())
        .then(m => m.message.filter(x => x.key.toLowerCase() === word))
        .then(m => m[0].paraphrase)
        .then(m => {
            if (!m || m.trim().length === 0) {
                throw new Error("force into catch block to search in a new tab");
            }

            const notificationId = `${Date.now()}`;
            lastQuery.id = notificationId;
            lastQuery.word = word;
            lastQuery.tab = tab;
            chrome.notifications.create(notificationId, {
                message: `${m}`,
                type: "basic", iconUrl: '16px.png', title: word, eventTime: Date.now() + 30 * 1000
            })
        })
        .catch(e => {
            const url = new URL(`https://www.iciba.com/word`);
            url.searchParams.set('w', word);
            chrome.tabs.create({url: url.href, index: tab.index + 1});
        })
});

chrome.notifications.onClicked.addListener(
    (notificationId) => {
        const {id, tab, word} = lastQuery;
        if (id === `${notificationId}`) {
            const url = new URL(`https://www.iciba.com/word`);
            url.searchParams.set('w', word);
            chrome.tabs.create({url: url.href, index: tab.index + 1});
        }
    }
)

chrome.notifications.onClosed.addListener(
    notificationId => chrome.notifications.clear(notificationId)
)


const activeTabMemory = {};

chrome.tabs.onActivated.addListener(
    activeInfo => {
        const {tabId, windowId} = activeInfo;
        let tabActivationList = activeTabMemory[windowId];
        if (!tabActivationList) {
            activeTabMemory[windowId] = [];
            tabActivationList = activeTabMemory[windowId]
        }
        const findId = tabActivationList.findIndex(id => id === tabId);
        if (findId !== -1) {
            tabActivationList.splice(findId, 1);
        }

        tabActivationList.push(tabId);
    }
)

chrome.tabs.onRemoved.addListener(
    (tabId, {windowId, isWindowClosing}) => {
        if (isWindowClosing) {
            delete activeTabMemory[windowId];
        } else {
            const tabList = activeTabMemory[windowId];
            const currentTab = tabList[tabList.length - 1];
            if (tabId === currentTab) {
                tabList.pop();
                const nextFocusTabId = tabList.pop();
                chrome.tabs.update(nextFocusTabId, {active: true})
            } else {
                const closeId = tabList.findIndex(id => id === tabId);
                if (closeId !== -1) {
                    tabList.splice(closeId, 1);
                }
            }
        }
    }
)

/*
* do multiple plugin when want to only create top level to save navigating to child list
* You can create as many context menu items as you need,
* but if more than one from your extension is visible at once,
* Google Chrome automatically collapses them into a single parent menu.
* */