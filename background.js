
var requestMap = new Map();
var registerMap = new Map();

chrome.webRequest.onCompleted.addListener(function(request){
    recordLog(request);
},{
    urls: ["https://*/*"]
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.message == "fetchLogs")
      sendResponse({data: requestMap.get(request.tabId)});

    if (request.message == "register")
      registerTab(request.tabId);

    if (request.message == "unregister")
      unRegisterTab(request.tabId);

    if (request.message == "fetchRecordingStatus")
      sendResponse({isRecording: isRegistered(request.tabId)});
    
  });

function registerTab(tabId){
    if(registerMap.get(tabId) !== undefined) {
        return;
    } 
    registerMap.set(tabId, {});
    sendResponse({ack: 'Done!'});
}

function unRegisterTab(tabId){
    if(registerMap.get(tabId) === undefined) {
        return;
    } 
    registerMap.delete(tabId);
    sendResponse({ack: 'Done!'});
}

function isRegistered(tabId) {
    return registerMap.get(tabId) !== undefined
}

function recordLog(request) {

    if(!isRegistered(request.tabId)) {
        console.log('tab not registered skipping log');
        requestMap.delete(request.tabId);
        return;
    }

    if (requestMap.get(request.tabId) == undefined || requestMap.get(request.tabId) == null) {
        requestMap.set(request.tabId, new Array());
    }

    var requestArray =  requestMap.get(request.tabId);
    requestArray.push(request);

    var port = chrome.runtime.connect({name:"test"});
    port.postMessage(request);

}

