// util function, generate either the url for the debug or for the pen view
const url_g = (user, penId, debug = false) => (debug) ? `https://s.codepen.io/${user}/debug/${penId}` : `https://codepen.io/${user}/pen/${penId}`;

// Regular expresion that gets the user the current view and the pen id
const re = /https?:\/\/(s\.)?codepen\.io\/([^\/]+)\/(pen|debug)\/([^\/\?]+).*/;

// it's just a placeholder to a function, it will be used to be able of remove the listener
let func = () => {};

browser.browserAction.disable(); // starts with the button disable

// high order function. returns the function that will change the tab or create a new one
function toggleView([user, debug, penId], currentTabIndex) { // destructuring of the array to get the variable names easier
    let url = url_g(user, penId, !(debug === "debug"));
    return async function() {
        let tabs = await browser.tabs.query({currentWindow: true, url: url + "*"}); // query returns a promise
        if (tabs.length > 0) { // if the tab exists change it to active. If there are more than one, uses the first
            browser.tabs.update(tabs[0].id, {active:true});
        } else { // if the tab doens't exist, create a new one
            console.log("index");
            let index = currentTabIndex;
            index += (debug === "debug") ? 0 : 1;
            console.log(index);
            browser.tabs.create({url,index});
        }
    }
}

browser.tabs.onUpdated.addListener( // listen when a tab updates
    (tabId, changeInfo, tabInfo) =>  handleChange(tabInfo)
)

browser.tabs.onActivated.addListener( // listen when the tab active changes
    activeInfo => { // active info gives only the id of a tab, and the id of its window
        browser.tabs.
            get(activeInfo.tabId). // get returns a promise
            then( tabInfo => handleChange(tabInfo) );
    }
)

function handleChange(tabInfo) {
    if( tabInfo.status === "complete" ) { // when the table is ready
        let newUrl = tabInfo.url.replace(re, '$2,$3,$4'); // gets the user the current view and the pen id with the regular expresion
        if(newUrl !== tabInfo.url ) { // if the url changes is because is a codepen website
            browser.browserAction.onClicked.removeListener(func);
            func = toggleView(newUrl.split(','), tabInfo.index);
            browser.browserAction.onClicked.addListener(func);
            browser.browserAction.enable();
        } else { // if url stays the same the website is not of a pen (at least not in debug nor pen mode)
            browser.browserAction.disable();
        }
    } else {
        browser.browserAction.disable();
    }
}
