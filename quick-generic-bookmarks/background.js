const folderName = "NEW_TEMP_BM";

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

chrome.action.onClicked.addListener(function(tab) {
    findOrCreateFolder(function(folderId) {
        createBookmark(tab, folderId);
    });
});
