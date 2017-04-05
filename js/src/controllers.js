//tento controller ma na starosti prepinanie viditelnych a neviditelnych divov
//nieco ako router
app.controller('SectionCtrl', function($scope,$rootScope) {
	//na zaciatku chcem aby bola viditelna sekcia "experiment"
	$scope.SectionSelected = "experiment";
	
	//ng-click="ShowSection('priebeh')" tato funkcia nastavi aktualne zobrazenu funkciu
	$scope.ShowSection = function(whichSection){
		//ak sa ma nahodou zobrazit sekcia "predosle" broadcastne sa event do celej apky a kontroller predoslich
		//ho zaeviduje a vykona danu akciu
		switch(whichSection){
			case "predosle":
					$rootScope.$broadcast('reloadPredosle');
				break;

		}

		$scope.SectionSelected = whichSection;
	}

	//overovaica funkcia pre dane sekcie, ng-show="isSectionShown('experiment')"  ak vrati true sekcia sa zobrazi, inak sa hidne
	$scope.isSectionShown = function(input){
		return input == $scope.SectionSelected ? true : false;
	}
});


//kontroler priebehu simulacie experimentu
app.controller('PriebehCtrl',function($scope,$rootScope,MyGlobalVars,$http,socket){
	
	//ked sa resolvnu MyGlovalVars
	MyGlobalVars.get_settings().then(function(data){
		//nadstav cestu pre gif
		$scope.path_to_loading_gif=data.path_to_loading_gif;
		//inicializuj socket factory
		socket.init(data.ipadrs,data.port);

		//toto je socket io zachytenie eventu, kde matlab server posiela data
		socket.on('results back',function(data){
			console.log(data);
			$scope.show_loading = false;

		})
	})

	//aby loading gif bol skovany
	$scope.show_loading = false;
	var that = this;
	//$on je na eventy v angulare, tento event pride z kontroleru experimentu, kde po zadani vstupnych hodnot sa spusti simulacia
	$rootScope.$on('spustiExperiment', function(event, args) {
		//zobraz loading gif
		$scope.show_loading = true;
		//odosli vstupne parametre na matlabovky server
		// socket.emit('input parameters', args);
	})
	
	



})


//kontroller pre sekciu kde je teoreticky popois experimentu a formular pre vstupne udaje
app.controller('ExperimentCtrl',function($scope,$http,MyGlobalVars,$rootScope,myStringToArrayWithObjects){

	//z MyGlobalVars zisti string ktory bol zadani pri vytvarani laboratoria v moodli, ktory zprasujes a podla neho vytvoris formular pre vstupy
	MyGlobalVars.get_settings().then(function(data){
		//data.inputs je ten string
		// funkcia myStringToArrayWithObjects ho prerobi na pole objekotv
		$scope.inputs = myStringToArrayWithObjects.convert(data.inputs);
	})

	//precitaj formular a prepni sa do kontroleru pre priebeh experimentu
	$scope.odosli = function(){
		console.log('odosli');
			$rootScope.$broadcast('spustiExperiment', {});



		// if($scope.v0 >= 0 && ($scope.alfa>=0 && $scope.alfa<=90)){
		// 	//tento scope vie zavolat funkciu aj kontroleru pre sekcie lebo v html strukture je vnoreny
		// 	$scope.ShowSection('priebeh');
		// 	var obj = {};
		// 	// obj["logged_user"]=MyGlobalVars.logged_user;
		// 	// obj["foldername"]=MyGlobalVars.foldername;
		// 	// obj["mfilepar"]=MyGlobalVars.mfilepar;
		// 	// obj["mfilescript"]=MyGlobalVars.mfilescript;
		// 	// obj["v0"]=$scope.v0;
		// 	// obj["alfa"]=$scope.alfa;
		// 	obj["inputs"] = []
		// 	obj["inputs"].push({"v0":$scope.v0})
		// 	obj["inputs"].push({"alfa":$scope.alfa})
		// 	$rootScope.$broadcast('spustiExperiment', obj);
		// }else{
		// 	alert('uprav vstupne parametre');
		// }
	}
})


//kontroler pre tabulku s predoslimi simulaciami
app.controller('PredosleVysledkyCtrl',function($scope,$http,$rootScope,MyGlobalVars){
	var self = $scope;
	var that = this;
	
	//nacitaj predosle simulacie z databazy
	this.loadResults = function(){
		//z MyGlobalVars zisti ipadresu a port databazy
		MyGlobalVars.get_settings().then(function(data){

			var req = {
				method: 'GET',
				url: 'mongo_scripts/get_previous_results.php',
				headers: {
			   		'Content-Type': 'application/x-www-form-urlencoded'
				},
			 	params: {ipdb:data.ipdb,portdb:data.portdb}
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
		
		})	
	}


	this.loadResults();
	// zachyti event z kontroleru sekcii a spravi dotaz na server nech vrati udaje z databazy
	$rootScope.$on('reloadPredosle', function(event, args) {
		that.loadResults();
	});

})