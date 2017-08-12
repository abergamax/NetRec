var app = angular.module('loggerApp', []);
app.controller('appCtrl', function($scope, $http) {
  $scope.logs = [];
  $scope.isRecording = false;
  $scope.tabId = -1;

  $scope.recordActionStatus = false;
  $scope.stopRecordActionStatus = false;

  $scope.record = function() {
    if($scope.isRecording) {
      return;
    }

    if($scope.tabId === -1) {
      console.error('Oops tabId is -1!');
      return;
    }
    $scope.recordActionStatus = true;
    console.error('sending command' + $scope.tabId);
    chrome.runtime.sendMessage({tabId: $scope.tabId, message: "register"}, function(response) {
      $scope.$apply(function(){
        $scope.isRecording = true;
        $scope.recordActionStatus = false;
      });
    });
  };

  $scope.stopRecording = function() {
    if(!$scope.isRecording) {
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
    if(!$scope.isRecording) {
      return;
    }

    chrome.runtime.sendMessage({tabId: $scope.tabId, message: "fetchLogs"}, function(response) {
      $scope.$apply(function(){
          $scope.logs = response.data;
      });
    });
  };

  chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
        $scope.$apply(function(){
            $scope.logs.push(msg);
        });
  });
});

  //TODO this won't work, cause race condition need promise
  $scope.fetchRecordingStatus();
  //$scope.fetchLogs();
});