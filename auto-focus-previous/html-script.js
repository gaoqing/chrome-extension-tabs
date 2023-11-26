const userInput = document.getElementById("new-skip-input");
const content = document.getElementById("skip-list")
const KEY = 'IGNORE_URLS';

document.addEventListener("DOMContentLoaded", (event) => {
    chrome.storage.local.get(KEY, items => {
        const list = items[`${KEY}`];
        list && (content.innerText = list);
    });
});

userInput.addEventListener("keydown", async event => {
    if(event.key === 'Enter' && userInput.value){
        const newList = await addToStorage(userInput.value);
        content.innerText = JSON.stringify(newList);
        userInput.value = '';
    }
})

function addToStorage(newItem){
    return new Promise(resolve => {
        chrome.storage.local.get(KEY, items => {
            const list = JSON.parse(items[`${KEY}`] || '[]');
            const newList = [...list, newItem];
            chrome.storage.local.set({[`${KEY}`] : JSON.stringify(newList)}).then(()=> resolve(newList));
        });
    })
}