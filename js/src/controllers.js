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
			obj["ipadrs"] = data.ipadrs;
			obj["port"] = data.port;
			obj["from"] = 'virtuallab'

			$scope.ShowSection('priebeh');
			$rootScope.$broadcast('spustiExperiment', obj);

		})
	}
})


//kontroler priebehu simulacie experimentu
app.controller('PriebehCtrl',function($scope,$rootScope,MyGlobalVars,$http,socket,$interval,$timeout,myChart,myCanvas){

	//canvas pre animacie
	var my_canvas;	
	
	//pole grafov
	$scope.charts = [];

	//aby loading gif bol skovany
	$scope.show_loading = false;

	//kluce na ktorych su data, podla tohto je aj head tabulky
	$scope.keys = [];
	$scope.units = {};

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
	// var help_arr = [];
	var that = this;
	var jump_ms;


	
	
	//ked sa resolvnu MyGlovalVars
	MyGlobalVars.get_settings().then(function(data){
		//z kazdeho outputu vytvor graf
		angular.forEach(data.outputs,function(output){
			$scope.charts.push(new myChart(output));
		})

		my_canvas = new myCanvas(data.foldername);


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

		//ak nefunguje vypoctovy zerver
		socket.on('connect_error',function(err){
			alert("Vypočtový server nedostupný.");
		})

		//toto je socket io zachytenie eventu, kde matlab server posiela data
		//zachytavam len vysledky urcene mne
		// var t1 = + new Date;
		// var t2 = 0;
		socket.on('results_for:'+data.logged_user+'virtuallab',function(msg){
			// t2 = + new Date;
			// console.log("time: ",t2-t1);
			// console.log(msg);
			// if(t2-t1> 1500){
			// 	console.log(msg);
			// }
			// t1 = t2;


			//ak je status running a prve pole z dat uz ma nejake hodnoty tak pripoj hodnotky k polu
			if((msg.result.status == "running") && angular.isArray(msg.result.data[Object.keys(msg.result.data)[0]])){
				// console.log('som v running');

				//zisti kluce, cize meno vracajucich sa vyslednych hodnot ako x,y,v atd..
				$scope.keys = Object.keys(msg.result.data);
				$scope.units = msg.result.units;
				//pre kazdy kluc vytvor bojektu pole, ak uz ma pole tak k nemu pripoj novo prijate hodnoty
				angular.forEach($scope.keys,function(key){
					//ak na kulci key nie je pole sprav tam inak concatuj
					if(!cancated_obj[key]){
						cancated_obj[key] = [];
					}else{
						cancated_obj[key] = cancated_obj[key].concat(msg.result.data[key]);
					}
				})


				//aby sa spustil len raz interval //zacni ked uz su nakumulovane data
				// if(!int_start){
				if((int_start == false) && cancated_obj[$scope.keys[0]].length > 10){
					// a tabulku tiez len raz zobrazime
					$scope.tableshow = true;
					//aby sa spustil len raz interval
					int_start = true;
					//skovaj loading gif
					$scope.show_loading = false;

					if(cancated_obj['time']){
						jump_ms =  Math.round((cancated_obj['time'][1] - cancated_obj['time'][0])*skip_samples*1000);
						// console.log(jump_ms);
					}else{
						jump_ms = 200;
					}



					//interval co prechadza pospajanymi polami hodnot
					my_interval = $interval(function(){
			
						
							//ak sa index nachadza v prijatom poli cize mam co zobrazovat
							if(index < cancated_obj[$scope.keys[0]].length){
								//do pomocneho objektu
								//podla klucov prirad hodnotu z pola prijatych a pospajanych dat
								var obj = {};
								angular.forEach($scope.keys,function(key){
									obj[key] = cancated_obj[key][index];
								})
								//pushni ako riadok do tabulky
								$scope.data_to_display.push(obj)

								//daj hodnotu aj grafom
								angular.forEach($scope.charts,function(chart){
									chart.push_new_val(obj,$scope.units);
								});

								my_canvas.push_new_val(obj,$scope.units);

								//zvacsi index
								index=index+skip_samples;
							}else{
								// console.log('sek');
							}

					//tu konci interval
					},jump_ms);
			



				}
			}else if(msg.result.status == "stopped"){
				// console.log('som v stopped');
				//vsetky data su prijate mozem ulozit do databazy
					var date = + new Date;
					var obj_to_save = {"username":username,"experiment":experiment_foldername,"executed":date,"keys":$scope.keys,"units":$scope.units};
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

					//v intervale kontroluj ci uz su zobrazene prijate data, ak su vsetky zobraz este poslednu
					var tmp_int = $interval(function(){
						var pocet = cancated_obj[$scope.keys[0]].length/skip_samples;
						if(pocet <= $scope.data_to_display.length){
							// console.log(pocet);
							// console.log($scope.data_to_display.length);


								if( index != cancated_obj[$scope.keys[0]].length){
									var obj = {};
									angular.forEach($scope.keys,function(key){
										obj[key] = cancated_obj[key][cancated_obj[key].length-1];
									})
									//pushni posledny riadok tabulky
									$scope.data_to_display.push(obj);
	
									//daj hodnotu aj grafom
									angular.forEach($scope.charts,function(chart){
										chart.push_new_val(obj,$scope.units);
									});
	
									my_canvas.push_new_val(obj,$scope.units);
								}

							$interval.cancel(my_interval);
							$interval.cancel(tmp_int);
						}
					},100);
			}
		})
	})

	
	//$on je na eventy v angulare, tento event pride z kontroleru experimentu, kde po zadani vstupnych hodnot sa spusti simulacia
	$rootScope.$on('spustiExperiment', function(event, args) {
		//zobraz loading gif
		$scope.show_loading = true;
		//odosli vstupne parametre na matlabovsky server
		socket.emit('input parameters', args);

		//nadstav na pociatocne hodnoty
		cancated_obj = {};
		$scope.keys = [];
		$scope.units = {};
		$scope.data_to_display = [];
		index = 0;
		int_start = false;
		$scope.tableshow = false;
		// help_arr = [];

		//resetuj grafy
		angular.forEach($scope.charts,function(chart){
			chart.reset();
		});
		// my_canvas.reset();
	})


	//$on je na eventy v angulare, tento event pride z kontroleru predoslich
	$rootScope.$on('zobrazUlozenyExperiment', function(event, args) {
		//resetuj grafy
		angular.forEach($scope.charts,function(chart){
			chart.reset();
		});
		// my_canvas.reset();


		MyGlobalVars.get_settings().then(function(data){


			var skip_samples2 = data.skipsamples;
			$scope.tableshow = true;
			$scope.keys = args.keys;
			$scope.units = args.units;
			index = 0;
			$scope.data_to_display = [];


			//defaulta hodnota nech je to spon trochu spomalene
			var timejump = 10*skip_samples2;

			//ak je pole cas, co by malo byt vzdy
			if(args.time){
				//casova dlzka simulacie
				var finish_time = args.time[args.time.length-1];
				//kolko hodnot budem vykreslovat
				var how_many = args.time.length/skip_samples2;
				timejump = Math.round(finish_time/how_many*1000);
			}
			var my_interval2 = $interval(function(){

				//ak je index v poli, tu mam vsetky data cize sa nestane ze by index prekrocil dzku pola, to sa tava iba ked realtimeovo prijmam data cize index
				// moze byt mimo uz prijateho pola ale to neznamena konec simulacie lebo dalsie data mozu byt na ceste
				if(index < args[$scope.keys[0]].length){
					//do pomocneho objektu
					//podla klucov prirad hodnotu z pola prijatych a pospajanych dat
					var obj = {};
					angular.forEach($scope.keys,function(key){
						obj[key] = args[key][index];
					})
					//pushni ako riadok do tabulky
					$scope.data_to_display.push(obj);

					//daj hodnotu aj grafom
					angular.forEach($scope.charts,function(chart){
						chart.push_new_val(obj,$scope.units);
					});
					my_canvas.push_new_val(obj,$scope.units);

					index=index+skip_samples2;

				
				//ak nie je pridaj posledny prvok
				}else{
					// if( (args[$scope.keys[0]].length%skip_samples2)!=0){
						// console.log(index);
						// console.log(args[$scope.keys[0]].length);
						if(index != args[$scope.keys[0]].length){
						var obj = {};
						angular.forEach($scope.keys,function(key){
							obj[key] = args[key][args[key].length-1];
						})
						//pushni posledny riadok tabulky
						$scope.data_to_display.push(obj);
	
						//daj hodnotu aj grafom
						angular.forEach($scope.charts,function(chart){
							chart.push_new_val(obj,$scope.units);
						});
						my_canvas.push_new_val(obj,$scope.units);
					}

					//ukonci interval
					$interval.cancel(my_interval2);

				}
				
			},timejump);


		})

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
				// console.log(response.data);
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

	$scope.save_data = function(id,datum){
		//scope.data uchovava vsetky simulacie
		//vyber podla idcka
		var result = $scope.data.filter(function( obj ) {
		  return obj._id == id;
		});
		//filter vracia pole prvkov ktore matchnu kriteria podla idcka cize len jeden
		//preto na nultej pozicii
		var res = result[0];
		//meno podla mena experimentu
		//a casu nasimulovania
		var name = res.experiment+" "+datum;

		//prvy riadok csv su mena stlpcov
		var data_to_csv = [];
		var name_tmp = [];
		angular.forEach(res.keys,function(key){
			name_tmp.push(key+' ['+res.units[key]+']')
		});

		data_to_csv.push(name_tmp);

		// var data_to_csv = [res.keys];
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

	//tato funkcia sa vola po stlaceni tlactika zobraz
	$scope.show_data = function(id){
		//scope.data uchovava vsetky simulacie
		//vyber podla idcka
		var result = $scope.data.filter(function( obj ) {
		  return obj._id == id;
		});
		//filter vracia pole prvkov ktore matchnu kriteria podla idcka cize len jeden
		//preto na nultej pozicii
		var res = result[0];
		$scope.ShowSection('priebeh');
		$rootScope.$broadcast('zobrazUlozenyExperiment', res);
	}

})