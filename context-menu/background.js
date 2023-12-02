
chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "ICIBA",
        title:  "iciba",
        type: 'normal',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
    const url = new URL(`https://www.iciba.com/word`);
    url.searchParams.set('w', item.selectionText);
    chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});

/*
* do multiple plugin when want to only create top level to save navigating to child list
* You can create as many context menu items as you need,
* but if more than one from your extension is visible at once,
* Google Chrome automatically collapses them into a single parent menu.
* */