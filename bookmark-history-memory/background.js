let memoryMap = new Map();

const patternsToSkip = ['google.com/search?q=', 'google.com.hk/search?q=', 'baidu.com/s?',
    'youdao.com/result?word=', 'iciba.com/word?w=', 'youtube.com/results?search_query=',
    'zhihu.com/search?', 'google.com/sorry/index', 'linkedin.com/search',
    'dict.cn/search?q=']

// setting below true will delete those bookmarks matched those patten, set false otherwise
// useful when using an automate bookmark-er
const isToDeleteSkipPatternBookmarks = true;

// {key1: [array of title_url], key2: [array of title_url]}
const joinedKeyToUrlsCacheMap = new Map();

let debounceSearchTaskTimer;
const debounceSearchIntervalMs = 300;
let lastReloadTimeMs = 0;
const reloadMinimumMs = 10 * 60 * 1000;


chrome.runtime.onInstalled.addListener(() => getOrLoadBookmarks(true));

async function getOrLoadBookmarks(forceReload) {
    try {
        if (memoryMap && memoryMap.size > 0 && !forceReload) {
            return Promise.resolve(memoryMap);
        }

        console.log(new Date() + ": going to reload bookmarks");
        const startTime = Date.now();
        memoryMap.clear();
        joinedKeyToUrlsCacheMap.clear();

        return new Promise(resolve => {
            const cache = new Map();
            chrome.bookmarks.getTree(bookmarkItems => {
                addBookmarksToMemory(bookmarkItems, cache);
                console.log(`${new Date()}: load bookmarks size= ${cache.size}, elapsed time: ${Date.now() - startTime}`)
                lastReloadTimeMs = Date.now();
                memoryMap = cache;
                resolve(cache);
            })
        })
    } catch (e) {
        console.error(new Date() + ": Error loading bookmarks", e);
        return Promise.resolve(new Map());
    }
}

function addBookmarksToMemory(bookmarks, cache) {
    bookmarks.forEach(bookmark => {
        if (bookmark.url) {
            const key = (bookmark.title + "_" + bookmark.url).toLowerCase();

            if (patternsToSkip.find(p => key.includes(p.toLowerCase()))) {
                if (isToDeleteSkipPatternBookmarks) deleteBookmark(bookmark.id);
                return;
            }

            cache.set(key, bookmark);
        }
        if (bookmark.children) {
            // that is folder
            addBookmarksToMemory(bookmark.children, cache);
        }
    });
}


function findKeywordUrlsCache(inputSplits, cache) {
    const joinKey = inputSplits.join("_");
    if (joinedKeyToUrlsCacheMap.has(joinKey)) {
        return {list: joinedKeyToUrlsCacheMap.get(joinKey), joinKey: joinKey, isExactMatched: true};
    }

    for (let len = joinKey.length - 1; len >= 3; len--) {
        const key = joinKey.substring(0, len);
        if (joinedKeyToUrlsCacheMap.has(key)) {
            return {list: joinedKeyToUrlsCacheMap.get(key), joinKey: key};
        }
    }

    return {list: Array.from(cache.keys())};
}

function filterUrlsByWord(urlList, word) {
    return urlList.filter(u => u.includes(word))
}

function getBookmarksByInput(text, cache) {
    const splits = text.split(" ").map(t => t.trim());

    let {list, joinKey, isExactMatched} = findKeywordUrlsCache(splits, cache);

    if (!isExactMatched) {
        for (let i = splits.length - 1; i >= 0; i--) {
            if (joinKey && joinKey.includes(splits[i])) {
                continue;
            }
            list = filterUrlsByWord(list, splits[i]);
        }
        if (list.length > 0) {
            joinedKeyToUrlsCacheMap.set(splits.join("_"), list);
        }
    }

    const matchedBookmarks = [];
    list.map(k => cache.get(k)).forEach(bm => matchedBookmarks.push(bm))

    return matchedBookmarks;
}

chrome.omnibox.onInputChanged.addListener(
    (text, suggestFn) => {
        const ifForceReload = (Date.now() - lastReloadTimeMs > reloadMinimumMs);
        const cachePromise = getOrLoadBookmarks(ifForceReload);

        if (!text || text.length <= 2) {
            return suggestFn([]);
        } else {
            if (debounceSearchTaskTimer) {
                clearTimeout(debounceSearchTaskTimer)
            }

            debounceSearchTaskTimer = setTimeout(async () => {
                const cache = await cachePromise;
                const bms = getBookmarksByInput(text.toLowerCase(), cache);

                const suggestList = bms.map(({url, title}) => {
                    const description = `${encodeXml(title)}  _  <url>${encodeXml(url)}</url>`;
                    return {content: url, description, deletable: true};
                })

                return suggestFn(suggestList);
            }, debounceSearchIntervalMs);
        }
    }
)

chrome.omnibox.onInputEntered.addListener(
    function (urlText, opens) {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            const {id} = tabs[0];
            chrome.tabs.update(id, {url: urlText}, () => joinedKeyToUrlsCacheMap.clear());

        })
    }
);


function deleteBookmark(bookmarkId) {
    chrome.bookmarks.remove(bookmarkId);
}


function encodeXml(str) {
    return str.replace(/[<>&'"]/g, function (char) {
        switch (char) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case '\'':
                return '&apos;';
            case '"':
                return '&quot;';
        }
    });
}
