/**
 * Copyright IBM Corporation 2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var KILOBYTES = 1024;
var MEGABYTES = 1048576;
var GIGABYTES = 1073741824;

var homeController = function homeController($scope, $http, $cookies, websocketFactory) {
    $scope.displayedTab = 'autoScaling';
    $scope.memoryMax = 256 * 0.875 * MEGABYTES;
    $scope.memoryStep = 32 * MEGABYTES;
    $scope.memoryUnit = MEGABYTES;
    $scope.memoryUnitLabel = "MB";
    $scope.dashboardLink = '/swiftmetrics-dash';
    $scope.circuitState = "closed";
    $scope.websocketURL = "";
    $scope.instanceID = $cookies.get('JSESSIONID');
    
    $scope.getInitData = function getInitData() {
        $http.get('/initData')
        .then(function onSuccess(response) {
            $scope.setMemoryBounds(response.data.totalRAM);
            $scope.dashboardLink = response.data.monitoringURL;
            $scope.autoScalingLink = response.data.autoScalingURL;
            $scope.$broadcast("circuitData", response.data.circuitEnabled, response.data.circuitDelay);
              
            $scope.websocket = websocketFactory;
            $scope.initWebsocket(response.data.websocketURL);
        },
        function onFailure(response) {
            console.log('Failed to get initial data from server.');
        });
    };
    
    $scope.initWebsocket = function initWebsocket(wsEndpoint) {
        $scope.websocketURL = wsEndpoint;
        $scope.websocket.setEndpoint(wsEndpoint);
        $scope.websocket.onStateChange(function(state) {
            $scope.circuitState = state.data;
            $scope.websocket.send("stillalive");
        });
        $scope.websocket.onDisconnect(function(event, error) {
            $scope.initWebsocket($scope.websocketURL);
        });
        $scope.websocket.onError(function(event, error) {
            $scope.websocketErrorMessage = "ERROR: The websocket connection has seen an unknown error. Please reload the page.";
            console.log(event);
            console.log(error);
        });
    };
    
    $scope.setMemoryBounds = function setMemoryBounds(numBytes) {
        $scope.memoryMax = numBytes * 0.875;
        if (numBytes > GIGABYTES) {
            $scope.memoryUnit = GIGABYTES;
            $scope.memoryUnitLabel = "GB";
        } else if (numBytes > MEGABYTES) {
            $scope.memoryUnit = MEGABYTES;
            $scope.memoryUnitLabel = "MB";
        } else {
            $scope.memoryUnit = KILOBYTES;
            $scope.memoryUnitLabel = "KB";
        }
    };
    
    setInterval(function () {
        $http.get('/requestJSON')
        .then(function onSuccess(response) {}, function onFailure(response) {
            console.log('Failed to get response from server.');
        });
    }, 5000);
};
