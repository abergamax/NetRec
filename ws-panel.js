console.log("panel.js");

/**
 * A function that receives the response body when the request completes.
 * @param String content Content of the response body (potentially encoded).
 * @param String encoding Empty if content is not encoded, encoding name otherwise. Currently, only base64 is supported.
 * @see https://developer.chrome.com/extensions/devtools_network
 **/
function handleJsonContent(content, encoding) {
    var element = document.getElementById("panel.webstats.log");

    // var contentElem = document.createElement('p');
    // contentElem.innerText = "content: " + content + "  encoding:" + encoding;
    // element.insertAdjacentElement('beforeend', contentElem);

    var jsonObj = JSON.parse(content);
    var wooshCalls = jsonObj.wooshCalls;

    for (var i = 0; i < wooshCalls.length; i++) {
        var elem = document.createElement('p');
        var url = wooshCalls[i].url;

        url = url.replace(/(``|&|\?)/g, "\n$1");
        elem.innerText = url;
        element.insertAdjacentElement('beforeend', elem);
    }

    var breakElem = document.createElement('hr');
    element.insertAdjacentElement('beforeend', breakElem);    
}

function handleWooshContent(request) {

    var element = document.getElementById("panel.webstats.log");
    var elem = document.createElement('p');
    var url = request.url;

    url = decodeURI(url);
    url = url.replace(/(``|&|\?)/g, "\n$1");
    elem.innerText = url;
    element.insertAdjacentElement('beforeend', elem);

    var breakElem = document.createElement('hr');
    element.insertAdjacentElement('beforeend', breakElem);    
}

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools.network/onRequestFinished
// http://www.softwareishard.com/blog/har-12-spec/#entries
function handleRequestFinished(harEntry) {

    var element = document.getElementById("panel.webstats.log");

    var request = harEntry.request;

    if (request.url.toLowerCase().indexOf("/woosh/") === -1) {
        return;
    }

    var reqElem = document.createElement('p');
    reqElem.innerText = harEntry.serverIPAddress + ":" + request.method + ":" + request.url // + ":" + request.queryString;
    element.insertAdjacentElement('beforeend', reqElem);
    // chrome.devtools.network.getHAR();

    var response = harEntry.response;
    var respElem = document.createElement('p');
    respElem.innerText = 
             " status: " + response.status 
        // + " size :" + response.content.size
        // + " compression:" + response.content.compression
           + " mimeType:" + response.content.mimeType;
        // + ":" + response.content.text
        // + ":" + response.content.encoding;
    element.insertAdjacentElement('beforeend', respElem);    

    if (request.url.toLowerCase().indexOf("/webstats/") !== -1) {
        harEntry.getContent(handleJsonContent);
    } else {
        handleWooshContent(request);
    }

    var breakElem = document.createElement('hr');
    element.insertAdjacentElement('beforeend', breakElem);

    var reqElem = document.createElement('p');
    reqElem.innerText = "finished"
    element.insertAdjacentElement('beforeend', reqElem);
}

// https://developer.chrome.com/extensions/devtools_network
// https://developer.chrome.com/extensions/samples#search:devtools.network
// https://www.raymondcamden.com/2012/07/15/How-to-add-a-panel-to-Chrome-Dev-Tools
chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);