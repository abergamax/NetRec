var app = angular.module('loggerApp', [])
.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|data):/);
        // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
    }
]);

app.controller('appCtrl', function($scope, $http) {

  $scope.logs = [];
  $scope.isRecording = false;
  $scope.tabId = -1;
  $scope.recordActionStatus = false;
  $scope.stopRecordActionStatus = false;
  $scope.csvContent = "data:text/csv;charset=utf-8,Method,URL,Type,RequestHeaders,Status,ResponseHeaders,FromCache?" + encodeURIComponent("\n");

  $scope.record = function() {

    if ($scope.isRecording) {
      return;
    }

    if ($scope.tabId === -1) {
      console.error('Oops tabId is -1!');
      return;
    }

    $scope.recordActionStatus = true;

    chrome.runtime.sendMessage({tabId: $scope.tabId, message: "register"}, function(response) {

      $scope.$apply(function(){
        $scope.isRecording = true;
        $scope.recordActionStatus = false;
      });

    }); //-- chrome.runtime.sendMessage()

  }; //-- $scope.record = function()

  $scope.stopRecording = function() {

    if (!$scope.isRecording) {
      console.error("Skipping command...");
      return;
    }

    $scope.stopRecordActionStatus = true;

    chrome.runtime.sendMessage({tabId: $scope.tabId, message: "unregister"}, function(response) {
      $scope.$apply(function(){
        $scope.isRecording = false;
        $scope.stopRecordActionStatus = false;
      });
    });

  };

  $scope.fetchRecordingStatus = function() {

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Cache tabId, not likely to change
      $scope.tabId = tabs[0].id;
      chrome.runtime.sendMessage({tabId: $scope.tabId, message: "fetchRecordingStatus"}, function(response) {
        $scope.$apply(function(){
          $scope.isRecording = response.isRecording;
          $scope.fetchLogs();
        });
      });
    });

  };

  $scope.findName = function(url) {
    var lI = url.lastIndexOf("/");
    return url.substring(lI, url.length);
  };

  $scope.fetchLogs = function() {

    if (!$scope.isRecording) {
      return;
    }

    chrome.runtime.sendMessage({tabId: $scope.tabId, message: "fetchLogs"}, function(response) {

      $scope.$apply(function(){
          $scope.logs = response.data;
          generateDataRecord();
      });

    });

  };

  chrome.runtime.onConnect.addListener(function(port) {

    port.onMessage.addListener(function(msg) {
          $scope.$apply(function(){
              $scope.logs.push(msg);
              generateDataRecord();
          });
    });

  });

function generateDataRecord(){
  $scope.logs.forEach(function(dataItem, index){
    dataString = [dataItem.method,"\"" + dataItem.url+ "\"",dataItem.type,convertHeadersToString(dataItem.requestHeaders),dataItem.statusCode,convertHeadersToString(dataItem.responseHeaders),dataItem.fromCache].join(",");
    $scope.csvContent += index <  $scope.logs.length ? dataString + encodeURIComponent("\n") : dataString;
  });
}

function convertHeadersToString(headers) {
  if (headers === undefined || headers === null) {
    return '';
  }

  var headerString = '';
  headers.forEach(function(header, index) {
    headerString += index <  headers.length - 1 ? (header.name + ':' +escapeCSV(header.value))  + encodeURIComponent("\n") : (header.name + ':' +escapeCSV(header.value));
  });
  return "\"" + headerString + "\"";
}

function escapeCSV(str){
  if (str === null ) return str;
  var result = "";
  var i = 0;
  for (i = 0; i < str.length ; i++) {
    if (str.charAt(i) === "\"") {
      result += "\"\"";
    } else {
      result += str.charAt(i);
    }
  }
  return result;
}
 

  //TODO this won't work, cause race condition need promise
  $scope.fetchRecordingStatus();
  //$scope.fetchLogs();
});