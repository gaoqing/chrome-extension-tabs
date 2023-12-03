const folderName = "NEW_TEMP_BM";

chrome.action.onClicked.addListener(function(tab) {
    findOrCreateFolder(function(folderId) {
        createBookmark(tab, folderId);
    });
});

function createBookmark(tab, folderId) {
    chrome.bookmarks.create({
        'parentId': folderId,
        'title': tab.title,
        'url': tab.url
    });
}

function findOrCreateFolder(callback) {
    chrome.bookmarks.search({ title: folderName }, function(results) {
        if (results.length) {
            // Folder exists, use the first matching folder
            callback(results[0].id);
        } else {
            // Folder doesn't exist, create it
            chrome.bookmarks.create({ title: folderName }, function(newFolder) {
                callback(newFolder.id);
            });
        }
    });
}


///// add a google search item to context menu,
////  one plugin allow one top level item,  do here just for saving myself a new extension
////  take as easter egg here?

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "googleTranslate",
        title:  "google translate",
        type: 'normal',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
    const url = new URL(`https://translate.google.com/?hl=en&sl=en&tl=zh-CN&op=translate`);
    url.searchParams.set('text', item.selectionText);
    chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});
