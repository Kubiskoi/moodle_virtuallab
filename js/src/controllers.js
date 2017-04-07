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


//kontroller pre sekciu kde je teoreticky popois experimentu a formular pre vstupne udaje
app.controller('ExperimentCtrl',function($scope,$http,MyGlobalVars,$rootScope,myStringToArrayWithObjects){
	//ci ma byt vidiet submit button formularu
	$scope.submitbu_show = true;
	//hlaska o zlych vstupoch skovana
	$scope.wrong_input_format_notice_show = false;

	//z MyGlobalVars zisti string ktory bol zadani pri vytvarani laboratoria v moodli, ktory zprasujes a podla neho vytvoris formular pre vstupy
	MyGlobalVars.get_settings().then(function(data){
		//data.inputs je ten string
		// funkcia myStringToArrayWithObjects ho prerobi na pole objekotv ale vrati 'wrong input structure'
		//ak boli chybne zadane inputy
		var formated = myStringToArrayWithObjects.convert(data.inputs);
		if(formated == 'wrong input structure'){
			$scope.inputs = [];
			//skovaj submitbutton
			$scope.submitbu_show = false;
			//zobraz hlasku
			$scope.wrong_input_format_notice_show = true;

		//inak zobraz sa spravi formular na zaklade vreatene pola s objektami
		}else{
			$scope.inputs = formated;
		}

	})

	//precitaj formular a prepni sa do kontroleru pre priebeh experimentu
	//ako vstu submitu je samotny formular
	$scope.submit_input_form = function(form){
		var obj = {}
		obj["inputs"] = []

		//precitaj inputy formu
		angular.forEach(form.$$element[0].children,function(child){
			if(child.name){
				var inp = {};
				inp[child.name] = child.value;
				obj["inputs"].push(inp)
			}
		})
		MyGlobalVars.get_settings().then(function(data){
			//tu este prida do objektu potrebne parametre, prejde do kontroleru priebehu a cez socket posle serveru udaje na spustenie simulacie
			obj["logged_user"] = data.logged_user;
			obj["foldername"] = data.foldername;
			obj["mfilepar"] = data.mfilepar;
			obj["mfilescript"] = data.mfilescript;


			$scope.ShowSection('priebeh');
			$rootScope.$broadcast('spustiExperiment', obj);

		})
	}
})


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
		socket.emit('input parameters', args);
	})
	
	



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