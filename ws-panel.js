var Martindale = Martindale || {};
Martindale.WebStats = Martindale.WebStats || {};

Martindale.WebStats.DevTools = (
function () {

    // chrome://extensions/
    // https://developer.chrome.com/extensions/cookies

    let CLASS_NAME = "ws-panel.js";
    console.log(CLASS_NAME, "version", "1.2.2");

    let BASE64CODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let ENCODING_BASE64 = "base64";
    let ENCODING_URL = "url";

    let statsCookieElements = {};
    statsCookieElements.EVENT_ID = 0;
    statsCookieElements.IMPRESSION_ID = 1;
    statsCookieElements.CLICK_TYPE = 2;
    statsCookieElements.PARENT_SEARCH_ID = 3;
    statsCookieElements.PREVIOUS_EVENT_ID = 4;
    statsCookieElements.PREVIOUS_EVENT_TYPE = 5;
    statsCookieElements.EMAIL_CLICK_TYPE = 6;

    let hourCookie;

    let yearCookie;

    let statsCookie;
    // let statsCookie = {};
    // statsCookie.eventId;
    // statsCookie.impressionId;
    // statsCookie.clickType;
    // statsCookie.parentSearchId;
    // statsCookie.previousEventId;
    // statsCookie.previous_EventType;
    // statsCookie.emailClickType;

    // /**
    //  * https://developer.mozilla.org/en-US/docs/Web/API/Console/log
    //  * Don't use console.log(obj), use console.log(JSON.parse(JSON.stringify(obj))).
    //  */
    // function log(obj) {
    //     var args = []
    //     arguments.forEach(function (a) {
    //         args.push(JSON.parse(JSON.stringify(a)));
    //     });
    //     window.console.log.apply(window.console, args);
    // }

   /**
     * returns the name of the current method
     *
     * @return void
     *
     */
    function getMethodName() {
        var name;
        try {
            name = getMethodName.caller.name;
        } catch (e) {
            name = e.message;
        } finally {
            return name;
        }
    }

   /**
     * logs the given value as an error to webstats panel
     *
     * @return void
     *
     */
    function logError(value) {
        var METHOD_NAME = ".logError";
        console.debug(CLASS_NAME, METHOD_NAME, "started", value);

        var container = document.getElementById("panel.webstats.log");
        console.debug(CLASS_NAME, METHOD_NAME, "document", document);
        console.debug(CLASS_NAME, METHOD_NAME, "container", container);

        var elem = document.createElement("p");
        elem.classList.add("error");
        elem.innerText = value;
        console.debug(CLASS_NAME, METHOD_NAME, "elem", elem);
        container.appendChild(elem);
        logHr();
    }

    /**
     * logs a horizontal line to webstats panel
     *
     * @return void
     *
     */
    function logHr() {
        var container = document.getElementById("panel.webstats.log");
        var elem = document.createElement("hr");
        container.appendChild(elem);
    }

    /**
     * logs the string value to the webstats panel using the given element type
     *
     * @param string type   html element to append
     * @param string value  value to appends
     * @return void
     *
     */
    function logString(type, value) {
        var METHOD_NAME = ".logString";
        console.debug(CLASS_NAME, METHOD_NAME, "started", type, value);
        var container = document.getElementById("panel.webstats.log");
        if (!container) {
            alert("invalid container found in method: 'logString()' called with " + ":" + type + ":" + value);
            console.warn(CLASS_NAME, METHOD_NAME, "document", document);
            console.warn(CLASS_NAME, METHOD_NAME, type, value);
        } else {
            var elem = document.createElement(type);
            elem.innerText = value;
            container.appendChild(elem);
        }
    }

    /**
     * Base64 Decoding for browsers which do not suport window atob || btoa
     * https://yckart.github.io/jquery.base64.js/
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
     *
     * Decodes string from Base64, as defined by RFC 4648 [//tools.ietf.org/html/rfc4648]
     * (instance method extending String object). As per RFC 4648, newlines are not supported
     *
     * @param string value  the string to be decoded from base-64
     * @param boolean utf8Decode  indicates whether value is Unicode and must be UTF8 decoded after Base64 decoding
     * @return string a Base64 decoded string
     */
    function base64Decode (value, utf8Decode) {

        var METHOD_NAME = ".base64Decode";
        console.debug(CLASS_NAME, METHOD_NAME, "started", value, utf8Decode);

        try {

            if (typeof value === 'undefined') return "";

            // window.atob not supported in older versions of IE
            if (window.atob) return window.atob(value);

            // set default value for utf8Decode
            utf8Decode = (typeof utf8Decode === 'undefined') ? false : utf8Decode;

            var o1, o2, o3, h1, h2, h3, h4, bits, d = [], plain, coded;

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
            console.error(CLASS_NAME, METHOD_NAME, e);
        } finally {
            console.debug(CLASS_NAME, METHOD_NAME, "finished");
        }
    } // -- base64Decode

    /**
     * parses cookie from given Chrome cookie object
     * if the cookie has changed this will update the instance and log its value to the webstats panel
     *
     * @param Chrome Cookie Object
     * @return void
     *
     */
    function setHourCookie(obj) {

        var METHOD_NAME = ".setHourCookie";
        console.debug(CLASS_NAME, METHOD_NAME, "started", obj);

        if (!obj.name === 'hour') return;

        parsedValue = base64Decode(obj.value);

        if (typeof hourCookie === 'undefined' || hasHourCookieChanged(parsedValue)) {
            // update instance
            hourCookie = parsedValue;
            // log cookie
            logString("b", obj.name + " cookie");
            logString("p", parsedValue);
            logHr();
            console.log(CLASS_NAME, METHOD_NAME, "updated cookie", obj.name, parsedValue);
        }
    }

    /**
     * parses cookie from given Chrome cookie object
     * if the cookie has changed this will update the instance and log its value to the webstats panel
     *
     * @param Chrome Cookie Object
     * @return void
     *
     */
    function setYearCookie(obj) {

        var METHOD_NAME = ".setYearCookie";
        console.debug(CLASS_NAME, METHOD_NAME, "started", obj);

        if (!obj.name === 'year') return;

        parsedValue = base64Decode(obj.value);

        if (typeof yearCookie === 'undefined' || hasYearCookieChanged(parsedValue)) {
            // update instance
            yearCookie = parsedValue;
            // log cookie
            logString("b", obj.name + " cookie");
            logString("p", parsedValue);
            logHr();
            console.log(CLASS_NAME, METHOD_NAME, "updated cookie", obj.name, parsedValue);
        }
    }

    /**
     * parses cookie from given Chrome cookie object
     * if the cookie has changed this will update the instance and log its value to the webstats panel
     *
     * @param Chrome Cookie Object
     * @return void
     *
     */
    function setStatsCookie(obj) {

        var METHOD_NAME = ".setStatsCookie";
        console.debug(CLASS_NAME, METHOD_NAME, "started", obj);

        statsModel = toStatsCookie(obj.value);

        if (typeof statsCookie === 'undefined' || hasStatsCookieChanged(statsModel)) {

            statsCookie = statsModel;

            logString("b", obj.name + " cookie");

            // log each property in Chrome cookie object
            // Object.getOwnPropertyNames(obj).forEach(function(paramName) {
            //     logString('p',  paramName + ": " + obj[paramName]);
            // });

            // log each property in stateCookie object
            // Object.getOwnPropertyNames(statsModel).forEach(function(paramName) {
            //     logString('p',  paramName + ": " + statsModel[paramName]);
            // });

            var table = document.createElement('table');

            Object.getOwnPropertyNames(statsModel).forEach(function(paramName) {
                var tr = table.insertRow();
                var td0 = tr.insertCell();
                var td1 = tr.insertCell();
                td0.innerText = paramName;
                td1.innerText = statsModel[paramName];
            });

            var container = document.getElementById("panel.webstats.log");
            container.appendChild(table);

            logHr();
        }
    }

    /**
     * returns true if the given stats cookie model is different from the statsCookie instance variable
     *
     * @param Object statsModel
     * @return boolean
     *
     */
    function hasStatsCookieChanged(statsModel) {
        var METHOD_NAME = ".hasStatsCookieChanged";
        console.debug(CLASS_NAME, METHOD_NAME, "setStatsCookie", "started", statsModel);
        // var x = JSON.parse(JSON.stringify(statsCookie));
        // var y = JSON.parse(JSON.stringify(statsModel));
        // console.info(CLASS_NAME, METHOD_NAME, "isEqual" ,"before statsCookie = statsModel", x, y);
        if (isEqual(statsCookie, statsModel)) {
            console.debug(CLASS_NAME, METHOD_NAME, "setStatsCookie", "FALSE");
            return false;
        } else {
            console.debug(CLASS_NAME, METHOD_NAME, "setStatsCookie", "TRUE");
            return true;
        }
    }

    /**
     * returns true if given cookie value is different from instance variable
     *
     * @param string cookieValue
     * @return boolean
     *
     */
    function hasHourCookieChanged(cookieValue) {
        var METHOD_NAME = ".hasHourCookieChanged";
        console.debug(CLASS_NAME, METHOD_NAME, "setHourCookie", "started", hourCookie, cookieValue, !(hourCookie === cookieValue));
        return !(hourCookie === cookieValue);
    }

    /**
     * returns true if given cookie value is different from instance variable
     *
     * @param string cookieValue
     * @return boolean
     *
     */
    function hasYearCookieChanged(cookieValue) {
        var METHOD_NAME = ".hasYearCookieChanged";
        console.debug(CLASS_NAME, METHOD_NAME, "setYearCookie", "started", yearCookie, cookieValue, !(yearCookie === cookieValue));
        return !(yearCookie === cookieValue);
    }

    /**
     * returns true if the two given objects are "equal"
     *
     * @param Object x
     * @param Object y
     * @return boolean
     *
     */
    function isEqual(x, y) {

        var METHOD_NAME = ".isEqual";
        console.debug(CLASS_NAME, METHOD_NAME, "started", x, y);

        var propsX = Object.getOwnPropertyNames(x);
        var propsY = Object.getOwnPropertyNames(y);

        // return false if different number of properties
        if (propsX.length != propsY.length) {
            console.info(CLASS_NAME, METHOD_NAME, "not equal", x, y);
            return false;
        }

        for (var i = 0; i < propsX.length; i++) {
            var propName = propsX[i];
            // return false if a property if not equal
            if (x[propName] !== y[propName]) {
                console.info(CLASS_NAME, METHOD_NAME, "not equal", x, y);
                return false;
            }
        }

        console.info(CLASS_NAME, METHOD_NAME, "equal", x, y);
        return true;
    }

    /**
     * converts the given "woosh url" to a table
     * where each parameter and attribute is on a separate row
     *
     * this can be used to render the woosh url on the webstats panel
     *
     * @param string url
     * @return void
     *
     */
    function logWooshUrlToTable(url) {

        var METHOD_NAME = ".logWooshUrlToTable";
        console.debug(CLASS_NAME, METHOD_NAME, "started", "url", url);

        try {

            var params = {};
            var atts = {};

            url = decodeURIComponent(url);

            // replace "?" with "&" to split url string on one character (&)
            url = url.replace("?", "&");
            url = url.replace(/=>/g, ">>");

            // temporarily swap valid ampersands
            var AMPERSAND = "||";
            url = url.replace(" & ", AMPERSAND);

            parameters = url.split("&");
            console.log(CLASS_NAME, METHOD_NAME, "parameters", parameters);

            // remove http://stats.lawyers.com/woosh/ from parameters
            var baseUrl = parameters.shift();
            logString('p', baseUrl);

            var ptable = document.createElement('table');

            // parameters.sort();

            parameters.forEach(function(param) {

                var p = param.split("=");

                if (p[0] === 'atts') {

                    // the following code handles attributes delimited with ``
                    var ptr = ptable.insertRow();
                    var ptd0 = ptr.insertCell();
                    var ptd1 = ptr.insertCell();
                    ptd0.innerText = "&" + p[0];
                    ptd1.innerText = "";

                    var attributes = p[1].split("``");
                    attributes.sort();

                    attributes.forEach(function(attribute) {
                        var a = attribute.split(">>");
                        if (a[0] && a[1]) {
                            var ptr = ptable.insertRow();
                            var ptd0 = ptr.insertCell();
                            var ptd1 = ptr.insertCell();
                            a[1] = a[1].replace(AMPERSAND, " & ");
                            atts[a[0]] = a[1];
                            ptd0.innerText = "``" + a[0];
                            ptd1.innerText = a[1];
                        }
                    });

                    params[p[0]] = atts;

                } else {
                    // the following code handles request parameters delimited with &
                    params[p[0]] = p[1];
                    var ptr = ptable.insertRow();
                    var ptd0 = ptr.insertCell();
                    ptd0.innerText = "&" + p[0];
                    var ptd1 = ptr.insertCell();
                    p[1] = p[1].replace(AMPERSAND, " & ");
                    ptd1.innerText = p[1];
                }
            });

            console.log(CLASS_NAME, METHOD_NAME, "params", params);
            console.log(CLASS_NAME, METHOD_NAME, "ptable", ptable);

            var container = document.getElementById("panel.webstats.log");
            container.appendChild(ptable);

        } catch (e) {
            console.error(CLASS_NAME, METHOD_NAME, e);
        } finally {
            console.debug(CLASS_NAME, METHOD_NAME, "finished");
        }
    }

    /**
     * converts the given "woosh url" to a string with new line characters
     * where each parameter and attribute is on a separate line
     *
     * this can be used to render the woosh url on the webstats panel
     *
     * @param string url
     * @return void
     *
     */
    function logWooshUrlToString(url) {

        var METHOD_NAME = ".logWooshUrlToString";
        console.debug(CLASS_NAME, METHOD_NAME, "started", url);

        url = decodeURIComponent(url);
        url = url.replace(/(``|&|\?)/g, "\n$1");
        url = url.replace(/(&atts=)/g, "$1\n``");

        console.log(CLASS_NAME, METHOD_NAME, "url", url);
        logString("p",  url);
    }

    /**
     * returns an object representation of the given "stats" cookie string
     *
     * @param string cookieValue a comma separated string
     * @return Object
     *
     */
    function toStatsCookie(cookieValue) {

        // parsedValue = obj.value.replace(/(,)/g, "\n$1");
        // logString("p", obj.name + ": \n" + parsedValue);
        // console.log(CLASS_NAME, METHOD_NAME, "found cookie ... obj", obj.name, parsedValue);

        var METHOD_NAME = ".toStatsCookie";
        console.debug(CLASS_NAME, METHOD_NAME, "started", cookieValue);

        var statsArray = cookieValue.split(",");
        var statsModel = {};

        statsModel.eventId = statsArray[statsCookieElements.EVENT_ID];
        statsModel.impressionId = statsArray[statsCookieElements.IMPRESSION_ID];
        statsModel.clickType = statsArray[statsCookieElements.CLICK_TYPE];
        statsModel.parentSearchId = statsArray[statsCookieElements.PARENT_SEARCH_ID];
        statsModel.previousEventId = statsArray[statsCookieElements.PREVIOUS_EVENT_ID];
        statsModel.previousEventType = statsArray[statsCookieElements.PREVIOUS_EVENT_TYPE];

        return statsModel;
    }

    /**
     * uses chrome.cookies.getAll to acquire a list of matching cookies
     * then calls parseCookies() for cookie in matching list
     *
     * @return void
     */
    function processWebStatsCookies() {

        var METHOD_NAME = ".processWebStatsCookies";
        console.log(CLASS_NAME, METHOD_NAME);

        // Turn this logging off when not needed
        // logString("p", "processWebStatsCookies");

        details = {};
        details.domain = ".lawyers.com";

        list = [];
        details.name = "stats";

        // find stats cookie
        chrome.cookies.getAll(
            details, function(list) {
                list.forEach(function(obj) {
                    parseCookies(obj);
                });
        });

        list = [];
        details.name = "year";
        chrome.cookies.getAll(
            details, function(list) {
                list.forEach(function(obj) {
                    parseCookies(obj);
                });
        });

        list = [];
        details.name = "hour";
        chrome.cookies.getAll(
            details, function(list) {
                list.forEach(function(obj) {
                    parseCookies(obj);
                });
        });
    }

    /**
     * parses webstats cookies
     *
     * @param Chrome Cookie object
     * @return void
     *
     * chrome.cookies.onChanged.addListener(function callback) with function(object changeInfo)
     * see https://developer.chrome.com/extensions/cookies
     *
     *          cause: "explicit"
     *          cookie:
     *                   domain: "www.lawyers.com"
     *                   expirationDate: 1570995341.32979
     *                   hostOnly: true
     *                   httpOnly: false
     *                   name: "XSRF-TOKEN"
     *                   path: "/"
     *                   sameSite: "unspecified"
     *                   secure: false
     *                   session: false
     *                   storeId: "0"
     *                   value: "Bd6m4SKNEbp8MoqUNvLBz7YwJ7zSHwiPDuE0Cnye"
     *          removed: false
     */
    function parseCookies (obj) {

        var METHOD_NAME = ".parseCookies";
        console.debug(CLASS_NAME, METHOD_NAME, "started", obj);

        // Turn this logging off when not needed
        // logString("p", "parseCookies");

        // handles amp and legacy use cases by mapping obj.cookie to obj
        if (!obj) logError("parseCookies() ... invalid cookie object");

        if (obj.cookie) obj = obj.cookie;

        var parsedValue;

        try {

            switch(obj.name) {
                case 'hour':
                    setHourCookie(obj);
                    break;
                case 'stats':
                    setStatsCookie(obj)
                    break;
                case 'year':
                    setYearCookie(obj);
                    break;
                default:
                    // on lawyers.com there is a large number cookies
                    // from google and FB which are updated in realtime and therefore fire this event
                    // parsedValue = decodeURIComponent(obj.value);
                    // logString("p", obj.name + ": \n" + parsedValue);
                    // return;
            }

        } catch (e) {
            console.error(CLASS_NAME, METHOD_NAME, e, obj);
            logError(e.message);
        } finally {
            console.debug(CLASS_NAME, METHOD_NAME, "finished");
        }

    };

    /**
     * A function that receives the response body when the request completes.
     * see https://developer.chrome.com/extensions/devtools_network
     *
     * @param String content Content of the response body (potentially encoded).
     * @param String encoding Empty if content is not encoded, encoding name otherwise. Currently, only base64 is supported.
     * @return void
     *
     **/
    function JsonContentHandler(content, encoding) {

        var METHOD_NAME = ".JsonContentHandler";
        console.debug(CLASS_NAME, METHOD_NAME, "started", content, encoding);

        if (!content) {
            console.warn(CLASS_NAME, METHOD_NAME, "invalid content", content);
            logError(
                "No response from woosh call. \n" +
                "Check for interrupted requests from amp-analytics. \n" +
                "On prod ... check statsdebug cookie exists. \n" +
                "On staging or local ... allow webstats requests to use self-signed certificates. \n"
            );
            return;
        }

        try {

            var jsonObj = JSON.parse(content);

            if (jsonObj == null || !jsonObj.wooshCalls) {
                logError("woosh call not found for this request");
            } else {
                var wooshCalls = jsonObj.wooshCalls;
                for (var i = 0; i < wooshCalls.length; i++) {
                    var url = wooshCalls[i].url;
                    logString("p", url);
                    logWooshUrlToTable(url);
                }
            }

        } catch (e) {
            console.error(CLASS_NAME, METHOD_NAME, e, content, encoding);
            logString("p", content);
        } finally {}
    }

    /**
     * handles http requests, if request is a "webstats" request then this will log request to devtools panel
     *
     * @param Har Entry object
     * @return void
     *
     * see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools.network/onRequestFinished
     * see http://www.softwareishard.com/blog/har-12-spec/#entries
     *
     * Object
     *      cache: {}
     *      connection: "4476905"
     *      pageref: "page_1"
     *      request: {method: "GET", url: "https://www.lawyers.com/new-providence/new-jersey/cooper-smith-llc-1110526-f/", httpVersion: "http/2.0", headers: Array(15), queryString: Array(0), …}
     *      response: {status: 200, statusText: "", httpVersion: "http/2.0", headers: Array(31), cookies: Array(0), …}
     *      serverIPAddress: "104.17.213.52"
     *      startedDateTime: "2019-10-13T17:54:49.803Z"
     *      time: 2039.4779999741313
     *      timings: {blocked: 10.15099998164177, dns: 922.829, ssl: 33.48000000000002, connect: 974.563, send: 0.48699999999996635, …}
     *      _initiator: {type: "other"}
     *      _priority: "VeryHigh"
     *      _resourceType: "document"
     */
    function requestOnFinishedHandler(harEntry) {

        var METHOD_NAME = ".requestOnFinishedHandler";
        console.debug(CLASS_NAME, METHOD_NAME, "started", "harEntry", harEntry);

        try {

            var request = harEntry.request;

            // skip calls which are not webstats requests
            if (request.url.toLowerCase().indexOf("/woosh/") === -1) {
                return;
            } else {
                console.log(CLASS_NAME, METHOD_NAME, "harEntry", harEntry, "request", request);
            }

            var ampWebstatsCall = (request.url.toLowerCase().indexOf("/webstats/") !== -1);

            // display request
            logString("b", "Woosh Request");

            var reguestText = harEntry.serverIPAddress + ":" + request.method + ":" + decodeURIComponent(request.url);
            logString("p", "reguestText: " + reguestText);

            // display response
            if (ampWebstatsCall) {
                logString('b', 'Response from Amp Webstats');
            } else {
                logString('b', 'Response from Legacy Webstats');
            }

            var response = harEntry.response;
            // + " size :" + response.content.size
            // + " compression:" + response.content.compression
            // + " mimeType:" + response.content.mimeType;
            // + ":" + response.content.text
            // + ":" + response.content.encoding;
            logString("p", "HTTP Status: " + response.status);
            logString("p", "Mime Type: " + response.content.mimeType);

            if (ampWebstatsCall) {
                // handle amp requests separately
                // amp requests to /webstats will return a json object
                harEntry.getContent(JsonContentHandler);
            } else {
                logWooshUrlToTable(request.url);
            }

            processWebStatsCookies(request);
            logHr()

        } catch (e) {
            console.error(CLASS_NAME, METHOD_NAME, e);
        } finally {
            console.debug(CLASS_NAME, METHOD_NAME, "finished");
        }
    }

    /**
     * https://developer.chrome.com/extensions/devtools_network
     * https://developer.chrome.com/extensions/samples#search:devtools.network
     */
    chrome.devtools.network.onRequestFinished.addListener(requestOnFinishedHandler);

    /**
     * Note, on lawyers.com there is a large number cookies
     * from Google and FB which are updated in realtime and will therefore fire this handler
     * see https://chromium.googlesource.com/chromium/src/+/master/chrome/common/extensions/docs/examples/api/cookies/background.js
     * see https://developer.chrome.com/extensions/cookies
     */
    chrome.cookies.onChanged.addListener(parseCookies);

    // function addMarker () {
    //     alert("addMarker called");
    // }

    // document.getElementById("addMarker1").addEventListener("click", addMarker);

})(); //-- Martindale.WebStats.DevTools