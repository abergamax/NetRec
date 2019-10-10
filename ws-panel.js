// chrome://extensions/
// console.log("panel.js");

var BASE64CODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
 * Base64 Decoding for browser who do not suport window atob || btoa
 * //yckart.github.io/jquery.base64.js/
 * //developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
 *
 * Decode string from Base64, as defined by RFC 4648 [//tools.ietf.org/html/rfc4648]
 * (instance method extending String object). As per RFC 4648, newlines are not catered for.
 *
 * @param {String} The string to be decoded from base-64
 * @param {Boolean} [utf8Decode=false] indicates whether value is Unicode and must be UTF8 decoded after Base64 decoding
 * @returns {String} Base64 decoded string
 */
function base64Decode (value, utf8Decode) {
    var METHOD_NAME = "base64Decode";
    try {
        if (typeof value === 'undefined') return "";
        if (window.atob) return window.atob(value);
        // window.atob not supported in older versions of IE
        utf8Decode = (typeof utf8Decode === 'undefined') ? false : utf8Decode;
        var o1, o2, o3, h1, h2, h3, h4, bits, d = [],
            plain, coded;
        coded = utf8Decode ? Utf8.decode(value) : value;
        for (var c = 0; c < coded.length; c += 4) { // unpack four hexets into three octets
            h1 = BASE64CODE.indexOf(coded.charAt(c));
            h2 = BASE64CODE.indexOf(coded.charAt(c + 1));
            h3 = BASE64CODE.indexOf(coded.charAt(c + 2));
            h4 = BASE64CODE.indexOf(coded.charAt(c + 3));
            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
            o1 = bits >>> 16 & 0xff;
            o2 = bits >>> 8 & 0xff;
            o3 = bits & 0xff;
            d[c / 4] = String.fromCharCode(o1, o2, o3);
            // check for padding
            if (h4 === 0x40) d[c / 4] = String.fromCharCode(o1, o2);
            if (h3 === 0x40) d[c / 4] = String.fromCharCode(o1);
        }
        plain = d.join('');
        return utf8Decode ? Utf8.decode(plain) : plain;
    } catch (e) {
        console.error("base64Decode", "exception", e);
    }
} // -- base64Decode

var ENCODING_BASE64 = "base64";
var ENCODING_URL = "url";

function addElement(container, type, value) {
    console.log("addElement", value, type);
    var elem = document.createElement(type);
    if (value) elem.innerText = value;
    container.insertAdjacentElement('beforeend', elem);
}

function handleCookies (request, container) {

    try {

        console.log("handleCookies", "request", request, "request.cookies", request.cookies);
        addElement(container, "p", "cookies");

        for (var key in request.cookies) {

            if (request.cookies[key].name === 'stats') {
                var value = "stats: " + request.cookies[key].value;
                console.log("handleCookies", "stats", value);
                addElement(container, 'p', value);
            }

            if (request.cookies[key].name === 'year') {
                var value = "year: " + base64Decode(request.cookies[key].value);
                console.log("handleCookies", "year", value);
                addElement(container, 'p', value);
            }

            if (request.cookies[key].name === 'hour') {
                var value = "hour: " + base64Decode(request.cookies[key].value);
                console.log("handleCookies", "hour", value);
                addElement(container, 'p', value);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * A function that receives the response body when the request completes.
 * @param String content Content of the response body (potentially encoded).
 * @param String encoding Empty if content is not encoded, encoding name otherwise. Currently, only base64 is supported.
 * @see https://developer.chrome.com/extensions/devtools_network
 **/
function handleJsonContent(content, encoding) {

    var container = document.getElementById("panel.webstats.log");

    var jsonObj = JSON.parse(content);

    if (jsonObj == null || !jsonObj.wooshCalls) {
        addElement(container, "p",  "woosh call not found for this request");
    } else {
        var wooshCalls = jsonObj.wooshCalls;
        for (var i = 0; i < wooshCalls.length; i++) {
            var url = wooshCalls[i].url;
            url = url.replace(/(``|&|\?)/g, "\n$1");
            url = url.replace(/(&atts=)/g, "$1\n``");
            addElement(container, "p",  url);
        }
    }

    addElement(container, "hr");
}

function handleWooshContent(request) {

    var container = document.getElementById("panel.webstats.log");
    var url = request.url;

    url = decodeURIComponent(url);
    url = url.replace(/(``|&|\?)/g, "\n$1");
    url = url.replace(/(&atts=)/g, "$1\n``");
    addElement(container, "p",  url);

    addElement(container, "hr");
}

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools.network/onRequestFinished
// http://www.softwareishard.com/blog/har-12-spec/#entries
function handleRequestFinished(harEntry) {

    var request = harEntry.request;
    var response = harEntry.response; 

    // skip calls which are not for webstats
    if (request.url.toLowerCase().indexOf("/woosh/") === -1) {
        return;
    }

    var container = document.getElementById("panel.webstats.log");

    // display request
    var innerText = harEntry.serverIPAddress + ":" + request.method + ":" + decodeURIComponent(request.url);
    addElement(container, 'p', innerText);

    // display response
    innerText = " status: " + response.status 
        // + " size :" + response.content.size
        // + " compression:" + response.content.compression
           + " mimeType:" + response.content.mimeType;
        // + ":" + response.content.text
        // + ":" + response.content.encoding;
    addElement(container, 'p', innerText);

    if (request.url.toLowerCase().indexOf("/webstats/") !== -1) {
        harEntry.getContent(handleJsonContent);
    } else {
        handleWooshContent(request);
    }

    handleCookies(request, container);

    addElement(container, 'hr');
}

// https://developer.chrome.com/extensions/devtools_network
// https://developer.chrome.com/extensions/samples#search:devtools.network
// https://www.raymondcamden.com/2012/07/15/How-to-add-a-panel-to-Chrome-Dev-Tools
chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);