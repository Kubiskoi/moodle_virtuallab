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
		var obj = {};
		obj["inputs"] = [];

		var input_out_of_range = false;

		//precitaj inputy formu
		angular.forEach(form.$$element[0].children[0].children,function(child){
			if(child.children[1]){
				//z pola inputov vyber aktualny child
				var actual = $scope.inputs.filter(function(obj){
					return obj.name == child.children[1].name;
				})
				//vezmi value z formularu
				var val = child.children[1].value;
				//over min a max
				if((val >= actual[0].min) && (val <= actual[0].max)){
					//ak ok sprav objekt
					var inp = {};
					inp[child.children[1].name] = val;
					obj["inputs"].push(inp);
				}else{
					//inak prirad true pre pomocnu premennu
					input_out_of_range = true;
				}
			}
		})


		//ak input_out_of_range bol z defaultneho false zmeneny na true, vypis hlasku a ukonci funkciu
		//cize ani neodosle data na server
		if(input_out_of_range){
			alert('Input out of range!');
			return;
		}

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
app.controller('PriebehCtrl',function($scope,$rootScope,MyGlobalVars,$http,socket,$interval,$timeout){

	$scope.t = [];
	$scope.x = [];
	$scope.y = [];
	$scope.v = [];

	//v ako view
	$scope.vt = [];
	$scope.vx = [];
	$scope.vy = [];
	$scope.vv = [];

	var my_interval;
	var int_start = false;
	var index = 0;
	var skip_samples;
	$scope.tableshow = false;
	//do tohto pola si budem ukladat dlzku pola ktore sa zvacsuje s prijatymi datami
	//ak poslednych x hodnot cize dlzok bude rovnakych tak viem ze  uz neprijmam nove data a viem pridat posledny hodnotu a ukoncit interval
	var help_arr = [];
	var that = this;


		this.identical = function(array) {
	    	for(var i = 0; i < array.length - 1; i++) {
	    	    if(array[i] !== array[i+1]) {
	    	        return false;
	    	    }
	    	}
	    	return true;
		}

		//ak poslednych 15 je rovnakych
		this.check_help_arr = function(arr){
			var new_arr = arr.slice(arr.length-15,arr.length);
			if(new_arr.length == 15 && that.identical(new_arr)){
				return true;
			}
			return false;
		}
	
	
	//ked sa resolvnu MyGlovalVars
	MyGlobalVars.get_settings().then(function(data){
		//nadstav preskakovanie vzorkovania
		skip_samples = data.skipsamples;
		//nadstav cestu pre gif
		$scope.path_to_loading_gif=data.path_to_loading_gif;
		//inicializuj socket factory
		socket.init(data.ipadrs,data.port);

		//toto je socket io zachytenie eventu, kde matlab server posiela data
		//zachytavam len vysledky urcene mne
		socket.on('results_for:'+data.logged_user,function(msg){
			// console.log(msg);
			$scope.show_loading = false;

			//ak je status running a time uz ma nejake hodnoty tak pripoj hodnotky k polu
			if((msg.result.status == "running") && angular.isArray(msg.result.data.time)){
				$scope.t = $scope.t.concat(msg.result.data.time);
				$scope.x = $scope.x.concat(msg.result.data.x);
				$scope.y = $scope.y.concat(msg.result.data.y);
				$scope.v = $scope.v.concat(msg.result.data.vy);

				//aby sa spustil len raz interval
				// a tabulku tiez len raz zobrazime
				if(!int_start){
					$scope.tableshow = !$scope.tableshow;
					int_start = !int_start;

					my_interval = $interval(function(){
						help_arr.push($scope.t.length);
						if(that.check_help_arr(help_arr)){
								$scope.vt.push($scope.t[$scope.t.length - 1]);
								$scope.vx.push($scope.x[$scope.x.length - 1]);
								$scope.vy.push($scope.y[$scope.y.length - 1]);
								$scope.vv.push($scope.v[$scope.v.length - 1]);

								$interval.cancel(my_interval); 

						}
						//tu si pocitam index
						// zobrazujem polia vt,vx,vy a vv a pushujem do nich hodnoty z originalnych poli
						//v 100 ms rozostupoch aby to vyzeralo plynulo, keby zobrazujem rovno prijate data
						//tak to strasne rychlo naskace a vyzera to zle
						// if(index < $scope.t.length){
							
							//pushni iba ak su nejaka data uz prijate
							if(index < $scope.t.length){
								$scope.vt.push($scope.t[index]);
								$scope.vx.push($scope.x[index]);
								$scope.vy.push($scope.y[index]);
								$scope.vv.push($scope.v[index]);
								index=index+skip_samples;
							}
						// }else{
							//ak uz index je viac ako dlzka tak este pridaj poslednu
						// 	$scope.vt.push($scope.t[$scope.t.length - 1]);
						// 	$scope.vx.push($scope.x[$scope.x.length - 1]);
						// 	$scope.vy.push($scope.y[$scope.y.length - 1]);
						// 	$scope.vv.push($scope.v[$scope.v.length - 1]);
						// 	$interval.cancel(my_interval); 
						// }
					},skip_samples*10);
				}
			}
			//ked skonci vypocet timeout a zobrazovanie este bezi lebo vypocty su trochu rychlejsie, pockam 5 sekund a ukoncim my_interval
			// if(msg.result.status == "stopped"){
			// 	$timeout(function(){
			// 		$interval.cancel(my_interval); 
			// 	},5000);
			// }
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