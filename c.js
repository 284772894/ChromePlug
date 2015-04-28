/**
 * Created by Administrator on 2015/4/24.
 */
var tabs = new Array();
chrome.extension.onConnect.addListener(function(port) {
    if (port.name === 'findReloadTime') {
        port.onMessage.addListener(function(data) {
            if (data.msg === 'getReloadTime') {
                chrome.tabs.getSelected(null, function(tab) {
                    var tabIsReloaderActive = tabs[tab.id] || false;
                    if (tabIsReloaderActive) {
                        port.postMessage({ms_between_load:tabs[tab.id].ms_between_load});
                    }
                });
            }
        });
    }

});

function doReloader(time) {
    if (time > 0) {
        chrome.tabs.getSelected(null, function(tab) {

            if (tabs[tab.id] || false) {
                // if there is already a realoder setup for this tab, cancel it
                cancelReload(tab.id);
            }

            tabs[tab.id] = new Array();
            tabs[tab.id]['action_url'] = tab.url;
            tabs[tab.id]['ms_between_load'] = time;
            tabs[tab.id]['seconds_to_next_reload'] = time/1000;

            chrome.tabs.onUpdated.addListener(onUpdateListener);

            chrome.browserAction.setIcon({path:"icons/KnobLoopOn.png", tabId:tab.id});

            // reload the page
            // timers are set for the next reload (and a display timer) in the page load listener
            doReload(tab.id);
        });

    } else {
        chrome.tabs.getSelected(null, function(tab) {
            cancelReload(tab.id);
        });
    }
}

function onUpdateListener(tabId, changeInfo) {
    // Hide the badge text
    chrome.browserAction.setBadgeText({text:'', tabId:tabId});

    var tabIsReloaderActive = (tabs[tabId] || false) && (tabs[tabId].ms_between_load > 0 || false);
    if (tabIsReloaderActive) {
        // can only get the URL infomation when the page is loading, not when it is complete
        if (changeInfo['status'] === 'loading') {
            // we want to cancel the reloader if they navigate away
            var urlChanged=changeInfo['url'] || false;
            if (urlChanged) {
                // the URL has changed - presumably by navigation
                // cancel the reloads
                cancelReload(tabId);
            } else {
                // reset the icon (it is cleared when reloaded)
                chrome.browserAction.setIcon({path:"icons/KnobLoopOn.png", tabId:tabId}); // the icon is reset when the page is reloaded


                // Cancel the timer display while the tab is reloading
                cancelDisplayTimer(tabId);

                // Cancel the reload time (in case the user manually reloaded the page)
                if (tabs[tabId].reloadTimer || false) {
                    clearTimeout(tabs[tabId].reloadTimer);
                    tabs[tabId].reloadTimer = null;
                }
            }
        } else if (changeInfo['status'] === 'complete') {
            // page has just completed loading

            // reset the icon (it is cleared when reloaded)
            chrome.browserAction.setIcon({path:"icons/KnobLoopOn.png", tabId:tabId}); // the icon is reset when the page is reloaded

            // reset the timer for the countdown
            tabs[tabId].seconds_to_next_reload = tabs[tabId].ms_between_load/1000;

            // and set the correct countdown text
            setBadgeText(tabId);

            // set a timeout for the next reload
            setupReloadTimer(tabId);

            // make really sure this timeout is cancelled before we add a new one
            cancelDisplayTimer(tabId);

            // setup the reload countdown
            tabs[tabId].displayTimer = window.setInterval(function(tab_id) {
                tabs[tab_id].seconds_to_next_reload--;
                setBadgeText(tab_id);
            }, 1000, tabId);
        }
    }
}

function setupReloadTimer(tabId) {
    // be sure to remove any reload timer before we add a new one
    if (tabs[tabId].reloadTimer || false) {
        clearTimeout(tabs[tabId].reloadTimer);
        tabs[tabId].reloadTimer = null;
    }

    // set the reload to occur in ms_between_load milliseconds time
    tabs[tabId].reloadTimer = window.setTimeout(function(tab_id) {
        doReload(tab_id);
    }, tabs[tabId].ms_between_load, tabId);
}

function cancelDisplayTimer(tabId) {
    if (tabs[tabId].displayTimer || false) {
        clearTimeout(tabs[tabId].displayTimer);
        tabs[tabId].displayTimer = null;
    }
}

function setBadgeText(tab_id) {
    if (tabs[tab_id].seconds_to_next_reload < 0) {
        // something is wrong! Don't display any text
        chrome.browserAction.setBadgeText({text:String(), tabId:tab_id});
        // cancel the time which is calling this. It will get recreated if the page is auto-reloaded
        cancelDisplayTimer(tab_id);
    } else {
        var badgeText = String(tabs[tab_id].seconds_to_next_reload);

        var mins = Math.floor(tabs[tab_id].seconds_to_next_reload/60);
        var secs = tabs[tab_id].seconds_to_next_reload%60;
        if (secs < 10) {
            secs = '0' + String(secs);
        }
        badgeText= String(mins) + ':' + String(secs);

        chrome.browserAction.setBadgeText({text:badgeText, tabId:tab_id});
    }
}

function cancelReload(tab_id) {
    if (tabs[tab_id].reloadTimer || false) {
        clearTimeout(tabs[tab_id].reloadTimer);
        tabs[tab_id].reloadTimer = null;
    }
    if (tabs[tab_id].displayTimer || false) {
        clearTimeout(tabs[tab_id].displayTimer);
        tabs[tab_id].displayTimer = null;
    }
    tabs[tab_id].ms_between_load = 0;
    tabs[tab_id].seconds_to_next_reload = 0;
    chrome.browserAction.setIcon({path:"icons/KnobLoopOff.png", tabId:tab_id});
    chrome.browserAction.setBadgeText({text:String(), tabId:tab_id});

}
//自动刷新页面
function doReload(tab_id) {

    chrome.browserAction.setIcon({path:"icons/KnobLoopOn.png", tabId:tab_id});
    chrome.browserAction.setBadgeText({text:'', tabId:tab_id});

    // need to work out a way to make POST'ed pages reload
    chrome.tabs.update(tab_id, {url: tabs[tab_id].action_url});
    //chrome.tabs.executeScript(tab_id, {code: 'window.location.reload()'});
    //if (flag){
    //    showDiv(tabId);
    //}
}
//我自定义的函数，操作页面元素
function showDiv(tab_id){

        chrome.tabs.executeScript(null, {file: "d.js"},function(){
        });
    //document.getElementById("alert").style.display ="block";
}



