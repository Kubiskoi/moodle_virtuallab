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
	//aby loading gif bol skovany
	$scope.show_loading = false;

	//kluce na ktorych su data, podla tohto je aj head tabulky
	$scope.keys = [];

	//riadky tabulky
	$scope.data_to_display = [];

	//objekt ktory na klucoch spaja prijate data
	var cancated_obj = {};


	//itvervalovo prechadzam spojene prijate data a vyberam hodnoty co idu do tabulky podla indexu
	//index sa zavcsuje o tolko kolko bolo nasdstavene pri vytvarani virtual labu
	var my_interval;
	var index = 0;
	var skip_samples;

	//aby sa cast kodu vykonala len raz
	var int_start = false;
	
	//tabulka je skovana na zaciatku
	$scope.tableshow = false;
	
	//do tohto pola si budem ukladat dlzku pola ktore sa zvacsuje s prijatymi datami, cas, lebo cas je pri kazdom experimente
	//ak poslednych x hodnot cize dlzok bude rovnakych (pole sa uz nezvacsujes) tak viem ze  uz neprijmam nove data a viem pridat posledny hodnotu a ukoncit interval
	var help_arr = [];
	var that = this;

		//funkcia vrati true ak je pole plne rovnakych prvkov
		this.identical = function(array) {
	    	for(var i = 0; i < array.length - 1; i++) {
	    	    if(array[i] !== array[i+1]) {
	    	        return false;
	    	    }
	    	}
	    	return true;
		}

		//ak poslednych 30 je rovnakych vrat true
		this.check_help_arr = function(arr){
			var new_arr = arr.slice(arr.length-30,arr.length);
			if(new_arr.length == 30 && that.identical(new_arr)){
				return true;
			}
			return false;
		}
	
	
	//ked sa resolvnu MyGlovalVars
	MyGlobalVars.get_settings().then(function(data){
		var ipdb = data.ipdb;
		var portdb = data.portdb;
		var username = data.logged_user;
		var experiment_foldername = data.foldername;
		//nadstav preskakovanie vzorkovania
		skip_samples = data.skipsamples;
		//nadstav cestu pre gif
		$scope.path_to_loading_gif=data.path_to_loading_gif;
		//inicializuj socket factory
		socket.init(data.ipadrs,data.port);

		//toto je socket io zachytenie eventu, kde matlab server posiela data
		//zachytavam len vysledky urcene mne
		socket.on('results_for:'+data.logged_user,function(msg){
			//zobraz loading gif
			$scope.show_loading = false;

			//ak je status running a prve pole z dat uz ma nejake hodnoty tak pripoj hodnotky k polu
			if((msg.result.status == "running") && angular.isArray(msg.result.data[Object.keys(msg.result.data)[0]])){
				//zisti kluce, cize meno vracajucich sa vyslednych hodnot ako x,y,v atd..
				$scope.keys = Object.keys(msg.result.data);
				//pre kazdy kluc vytvor bojektu pole, ak uz ma pole tak k nemu pripoj novo prijate hodnoty
				angular.forEach($scope.keys,function(key){
					//ak na kulci key nie je pole sprav tam inak concatuj
					if(!cancated_obj[key]){
						cancated_obj[key] = [];
					}else{
						cancated_obj[key] = cancated_obj[key].concat(msg.result.data[key]);
					}
				})


				//aby sa spustil len raz interval
				// a tabulku tiez len raz zobrazime
				if(!int_start){
					$scope.tableshow = !$scope.tableshow;
					int_start = !int_start;

					//interval co prechadza pospajanymi polami hodnot
					my_interval = $interval(function(){
						//do help_arr ukladaj dlzku pola casu
						help_arr.push(cancated_obj["time"].length);
						//ak toto pole ma uz na poslednych x miestach rovnaku hodnotu, viem ze neprijmam uz nove hodnoty
						//a mozem pripojit poslednu hodnotu a ukoncit interval
						if(that.check_help_arr(help_arr)){
							var obj = {};
							angular.forEach($scope.keys,function(key){
								obj[key] = cancated_obj[key][cancated_obj[key].length-1];
							})
							//pushni posledny riadok tabulky
							$scope.data_to_display.push(obj);
							//ukonci interval
							$interval.cancel(my_interval);

							//savenmi do databazy
							var date = new Date();
							var obj_to_save = {"username":username,"experiment":experiment_foldername,"executed":date.toLocaleString('en-GB'),"keys":$scope.keys};
							angular.forEach($scope.keys,function(key){
								//dam ich do stringu lebo limit postu pre pocet inputov je na MAMP 1000 a neviem kolko ma FEI moodle
								//http://stackoverflow.com/questions/2341149/limit-of-post-arguments-in-html-or-php
								obj_to_save[key] = cancated_obj[key];
								// obj_to_save[key] = JSON.stringify(cancated_obj[key]);
							})
							var req = {
								method: 'POST',
								url: 'mongo_scripts/save_to_db.php',
								// headers: {
							 //   		'Content-Type': 'application/x-www-form-urlencoded'
								// },
							 	params: {ipdb:ipdb,portdb:portdb},
							 	data: obj_to_save
							 	// data: $httpParamSerializerJQLike(obj_to_save)
							}
							$http(req).then(function(data){
							},function(err){
								alert('Error on saving to database!');
							})


						}
						
							//ak sa index nachadza v prijatom poli case, cize mam co zobrazovat
							if(index < cancated_obj["time"].length){
								//do pomocneho objektu
								//podla klucov prirad hodnotu z pola prijatych a pospajanych dat
								var obj = {};
								angular.forEach($scope.keys,function(key){
									obj[key] = cancated_obj[key][index];
								})
								//pushni ako riadok do tabulky
								$scope.data_to_display.push(obj)
								//zvacsi index
								index=index+skip_samples;
							}
					},skip_samples*10);
				}
			}
		})
	})

	
	//$on je na eventy v angulare, tento event pride z kontroleru experimentu, kde po zadani vstupnych hodnot sa spusti simulacia
	$rootScope.$on('spustiExperiment', function(event, args) {
		//zobraz loading gif
		$scope.show_loading = true;
		//odosli vstupne parametre na matlabovky server
		socket.emit('input parameters', args);

		//nadstav na pociatocne hodnoty
		cancated_obj = {};
		$scope.keys = [];
		$scope.data_to_display = [];
		index = 0;
		int_start = false;
		$scope.tableshow = false;
		help_arr = [];
	})
	
	



})





//kontroler pre tabulku s predoslimi simulaciami
app.controller('PredosleVysledkyCtrl',function($scope,$http,$rootScope,MyGlobalVars){
	var self = $scope;
	var that = this;
	var ipdb;
	var portdb;
	
	//nacitaj predosle simulacie z databazy
	this.loadResults = function(){
		
		//z MyGlobalVars zisti ipadresu a port databazy
		MyGlobalVars.get_settings().then(function(data){
			ipdb = data.ipdb;
			portdb = data.portdb;

			var req = {
				method: 'GET',
				url: 'mongo_scripts/get_previous_results.php',
				headers: {
			   		'Content-Type': 'application/x-www-form-urlencoded'
				},
			 	params: {ipdb:ipdb,portdb:portdb,username:data.logged_user,expname:data.foldername}
			}
			//getuj data z db
			// Simple GET request example:
			$http(req).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available
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


	$scope.del_data = function(_id,name,date){
		if(confirm("Vymazať simulaciu: "+name+", "+date+" ?")){
			var req = {
				method: 'GET',
				url: 'mongo_scripts/del_sim.php',
				headers: {
			   		'Content-Type': 'application/x-www-form-urlencoded'
				},
			 	params: {ipdb:ipdb,portdb:portdb,id:_id}
			}
			$http(req).then(function(data){
				that.loadResults();
			},function(err){});

		}
	}

	$scope.save_data = function(id){
		var result = $scope.data.filter(function( obj ) {
		  return obj._id == id;
		});
		var res = result[0];
		var name = res.experiment+" "+res.executed;
		var data_to_csv = [res.keys];
		//vsetky polia su rovnako dlhe
		for(var i = 0;i < res[res.keys[0]].length;i++){
			var tmp = [];
			for(var j = 0;j < res.keys.length;j++){
				tmp.push(res[res.keys[j]][i]);
			}
			data_to_csv.push(tmp);
		}
		that.exportToCsv(name,data_to_csv);
	}

	//http://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
	this.exportToCsv = function(filename, rows) {
	        var processRow = function (row) {
	            var finalVal = '';
	            for (var j = 0; j < row.length; j++) {
	                var innerValue = row[j] === null ? '' : row[j].toString();
	                if (row[j] instanceof Date) {
	                    innerValue = row[j].toLocaleString();
	                };
	                var result = innerValue.replace(/"/g, '""');
	                if (result.search(/("|,|\n)/g) >= 0)
	                    result = '"' + result + '"';
	                if (j > 0)
	                    finalVal += ',';
	                finalVal += result;
	            }
	            return finalVal + '\n';
	        };

	        var csvFile = '';
	        for (var i = 0; i < rows.length; i++) {
	            csvFile += processRow(rows[i]);
	        }

	        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
	        if (navigator.msSaveBlob) { // IE 10+
	            navigator.msSaveBlob(blob, filename);
	        } else {
	            var link = document.createElement("a");
	            if (link.download !== undefined) { // feature detection
	                // Browsers that support HTML5 download attribute
	                var url = URL.createObjectURL(blob);
	                link.setAttribute("href", url);
	                link.setAttribute("download", filename);
	                link.style.visibility = 'hidden';
	                document.body.appendChild(link);
	                link.click();
	                document.body.removeChild(link);
	            }
	        }
	    }

})