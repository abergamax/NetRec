var requestMap = new Map();
var headersMap = new Map();
var registerMap = new Map();

/**
 * chrome.webRequest    use chrome.webRequest API to
 *                      observe and analyze traffic
 *                      intercept, block, or modify requests in-flight
 *
 * onCompleted: Fires when a request has been processed successfully.
 * @see https://developer.chrome.com/extensions/webRequest
 */
chrome.webRequest.onCompleted.addListener(
    function(request) { recordLog(request); }, // callback
    { urls: ["https://*/*"]}, // filter
    ["responseHeaders"] // extra info (optional)
);

/**
 * chrome.webRequest    use chrome.webRequest API to
 *                      observe and analyze traffic
 *                      intercept, block, or modify requests in-flight
 *
 * onErrorOccurred: Fires when a request could not be processed successfully.
 * @see https://developer.chrome.com/extensions/webRequest
 */
chrome.webRequest.onErrorOccurred.addListener(
    function(request) { recordLog(request); }, // callback
    { urls: ["https://*/*"]} // filter
);

/**
 * chrome.webRequest    use chrome.webRequest API to
 *                      observe and analyze traffic
 *                      intercept, block, or modify requests in-flight
 *
 * onBeforeSendHeaders: Fired before sending an HTTP request, once the request headers are available.
 *                      This may occur after a TCP connection is made to the server,
 *                      but before any HTTP data is sent.
 * @see https://developer.chrome.com/extensions/webRequest
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(request) { recordHeaders(request); }, // callback
    { urls: ["https://*/*"] }, // filter
    ["requestHeaders"] // extra info (optional)
);

/**
 *
 * chrome.runtime.onMessage.addListener(function callback)
 *
 * chrome.runtime:      Use the chrome.runtime API to
 *                      retrieve the background page
 *                      return details about the manifest
 *                      listen for and respond to events in the app or extension lifecycle
 *                      convert relative URL paths to fully-qualified URLs
 *
 * onMessage: Fired when a message is sent from
 *            extension process (by runtime.sendMessage)
 *            content script (by tabs.sendMessage)
 *
 * @see https://developer.chrome.com/apps/runtime#event-onMessage
 * @see https://developer.chrome.com/extensions/runtime
 * @see https://developer.chrome.com/extensions/messaging
 */
chrome.runtime.onMessage.addListener(

    // addListener() expects a callback parameter as a function which looks like this ... 
    // function(any message, MessageSender sender, function sendResponse)

    function(request, sender, sendResponse) {

        var METHOD = "chrome.runtime.onMessage.addListener()";
        var logMsg = sender.tab ? "from content script: " + sender.tab.url : "from extension ";
        console.log("netrec", METHOD, logMsg);

        // request.message is set by $scope methods in popup.js

        if (request.message == "fetchLogs") {
            // from popup.js $scope.fetchLogs()
            sendResponse({data: requestMap.get(request.tabId)});
        }

        if (request.message == "register") {
            // from popup.js $scope.record()
            registerTab(request.tabId);
            sendResponse({ack: 'Done!'});
        }

        if (request.message == "unregister") {
            // from popup.js $scope.stopRecording()
            unRegisterTab(request.tabId);
            sendResponse({ack: 'Done!'});
        }

        if (request.message == "fetchRecordingStatus") {
            // from popup.js $scope.fetchRecordingStatus()
            sendResponse({isRecording: isRegistered(request.tabId)});
        }

    }

  );

function registerTab(tabId){
    if (registerMap.get(tabId) !== undefined) {
        return;
    }
    registerMap.set(tabId, {});
}

function unRegisterTab(tabId){
    if (registerMap.get(tabId) === undefined) {
        return;
    }
    registerMap.delete(tabId);
}

function isRegistered(tabId) {
    return registerMap.get(tabId) !== undefined
}

function recordLog(request) {

    var METHOD = "recordLog()";

    if (!isRegistered(request.tabId)) {
        var logMsg = "tab not registered, skipping log";
        console.log("netrec", METHOD, logMsg);
        requestMap.delete(request.tabId);
        return;
    } else {
        console.log("netrec", METHOD, "request.getContent", request);
    }

    // if needed, initialize new requst array
    if (requestMap.get(request.tabId) == undefined || requestMap.get(request.tabId) == null) {
        // requests are stored in requestMap
        // with request.tabId as key and new array as value
        requestMap.set(request.tabId, new Array());
    }

    // find requestArray by tabId
    var requestArray =  requestMap.get(request.tabId);

    // add this request to the request array for current tabId
    requestArray.push(request);

    // handle headers
    if (headersMap.get(request.requestId) === undefined || headersMap.get(request.requestId) === null ) {
        var logMsg = "Request headers are absent for this request " + request.requestId;
        console.error("netrec", METHOD, logMsg);
    } // todo ... should this be tied with } else { ... }
    request.requestHeaders = headersMap.get(request.requestId);
    headersMap.delete(request.requestId);

    // see https://developer.chrome.com/apps/runtime#method-connect
    // Attempts to connect to connect listeners within an extension/app (such as the background page), or other extensions/apps
    var port = chrome.runtime.connect({name:"test"});
    port.postMessage(request);

}

function recordHeaders(request) {

    var METHOD = "recordHeaders()";

    if (!isRegistered(request.tabId)) {
        var logMsg = 'tab is not registered, skipping log and removing any headers for this request';
        console.log("netrec", METHOD, logMsg);
        headersMap.delete(request.requestId);
        return;
    }

    if (headersMap.get(request.requestId) != undefined && headersMap.get(request.requestId) == null) {
        var logMsg = "headers already set for request.requestId: " + request.requestId;
        console.error("netrec", METHOD, logMsg);
    }

    // add request headers for this request into headersMap
    headersMap.set(request.requestId, request.requestHeaders);
    var logMsg = "added headers for request.requestId: " + request.requestId;
    console.log("netrec", METHOD, logMsg);

}