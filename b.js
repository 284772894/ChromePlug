/**
 * Created by Administrator on 2015/4/24.
 */
function restoreOptions() {
    var port = chrome.extension.connect({name: "findReloadTime"});
    port.onMessage.addListener(recvData);
    port.postMessage({msg:'getReloadTime'});
}


function recvData(data){
    var reloadTime = data.ms_between_load;
    for( i = 0; i < document.reload_options.reloadOption.length; i++ ) {
        if(document.reload_options.reloadOption[i].value == reloadTime) {
            document.reload_options.reloadOption[i].checked = true;
        } else {
            document.reload_options.reloadOption[i].checked = false;
        }
    }

}


function setReloader() {
    var option = 0;
    for( i = 0; i < document.reload_options.reloadOption.length; i++ ) {
        if( document.reload_options.reloadOption[i].checked == true ) {
            option = document.reload_options.reloadOption[i].value;
            break;
        }
    }

    var views = chrome.extension.getViews();
    for (var i in views) {
        if (views[i].doReloader) {
            views[i].doReloader(option);
        }
    }
    window.close();

}

window.addEventListener('load', restoreOptions, false);
document.getElementById('submit').addEventListener('click', setReloader);
