app.controller('SectionCtrl', function($scope,$rootScope) {
	$scope.SectionSelected = "experiment";
	
	$scope.ShowSection = function(whichSection){
		switch(whichSection){
			case "predosle":
					$rootScope.$broadcast('reloadPredosle');
				break;

		}

		$scope.SectionSelected = whichSection;
	}

	$scope.isSectionShown = function(input){
		return input == $scope.SectionSelected ? true : false;
	}
});

app.controller('PriebehCtrl',function($scope,$rootScope,MyGlobalVars,$http,socket){
	$scope.path_to_loading_gif = MyGlobalVars.path_to_loading_gif;
	$scope.show_loading = false;
	var that = this;
	
	//$on je na eventy v angulare
	$rootScope.$on('spustiExperiment', function(event, args) {
		$scope.show_loading = true;


		socket.emit('input parameters', args);
	})
	
	//toto je socket io zachytenie eventu, kde matlab server posiela data
	socket.on('results back',function(data){
		console.log(data);
		$scope.show_loading = false;

	})



})

app.controller('ExperimentCtrl',function($scope,$http,MyGlobalVars,$rootScope,myStringToArrayWithObjects){

	$scope.inputs = myStringToArrayWithObjects.convert(MyGlobalVars.inputs);

	$scope.odosli = function(){
		if($scope.v0 >= 0 && ($scope.alfa>=0 && $scope.alfa<=90)){
			$scope.ShowSection('priebeh');
			var obj = {};
			obj["logged_user"]=MyGlobalVars.logged_user;
			obj["foldername"]=MyGlobalVars.foldername;
			obj["mfilepar"]=MyGlobalVars.mfilepar;
			obj["mfilescript"]=MyGlobalVars.mfilescript;
			// obj["v0"]=$scope.v0;
			// obj["alfa"]=$scope.alfa;
			obj["inputs"] = []
			obj["inputs"].push({"v0":$scope.v0})
			obj["inputs"].push({"alfa":$scope.alfa})
			$rootScope.$broadcast('spustiExperiment', obj);
		}else{
			alert('uprav vstupne parametre');
		}
	}
})


app.controller('PredosleVysledkyCtrl',function($scope,$http,$rootScope,MyGlobalVars){
	var self = $scope;
	var that = this;
	
	this.loadResults = function(){
		var req = {
			method: 'GET',
			url: 'mongo_scripts/get_previous_results.php',
			headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded'
			},
		 	params: {ipdb:MyGlobalVars.ipdb,portdb:MyGlobalVars.portdb}
		}
		//getuj data z db
		// Simple GET request example:
		$http(req).then(function successCallback(response) {
			// this callback will be called asynchronously
			// when the response is available
			// console.log(response.data);
			self.data = [];
			self.data = response.data;
		}, function errorCallback(response) {
			self.data = [];
			// called asynchronously if an error occurs
			// or server returns response with an error status.
		});
	}

	$scope.refresni = function(){
		that.loadResults();
	}

	this.loadResults();
	$rootScope.$on('reloadPredosle', function(event, args) {
		that.loadResults();
	});

})