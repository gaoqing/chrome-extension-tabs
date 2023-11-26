const userInput = document.getElementById("new-skip-input");
const content = document.getElementById("skip-list")
const KEY = 'INGORE_URLS';

document.addEventListener("DOMContentLoaded", (event) => {
    const data = chrome.storage.local.get(KEY, items => {
        var list = items[`${KEY}`];
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
            var list = JSON.parse(items[`${KEY}`] || '[]');
            var newList = [...list, newItem];
            chrome.storage.local.set({[`${KEY}`] : JSON.stringify(newList)}).then(()=> resolve(newList));
        });
    })
}