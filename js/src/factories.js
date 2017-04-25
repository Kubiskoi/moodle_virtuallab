// ziskaj nastavenia modulu, ktore sa nastavuju pri vytvarani a su ulozene v moodlovskej databaze
app.factory('MyGlobalVars', function($http,$q,outputStringConvert) {
  var that = this;
  // ak je skip 0 tak +1 ,ak je nadstavene na 0 tak by sa index vobec neposuval
  this.inc = function(x){
    if(x==0){
      return 1;
    }else{
      return x;
    }
  }
    var deferred = $q.defer();
    // $location nejde lebo nie je zapnuty HTML5 mode
    const id_of_virtuallab = parseInt(window.location.search.substring(4));

    var req = {
        method: 'GET',
        url: 'get_settings.php',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {id:id_of_virtuallab}
      }
  $http(req).then(function(data){
      deferred.resolve({
            // path_to_imgs : '/mod/virtuallab/img/experimenty/',
            path_to_loading_gif : '/mod/virtuallab/img/',
            logged_user: data.data.username,
            mfilepar: data.data.mfilepar,
            mfilescript: data.data.mfilescript,
            ipadrs: data.data.ipadrs,
            port: data.data.port,
            foldername: data.data.foldername,
            portdb: data.data.portdb,
            ipdb: data.data.ipdb,
            inputs: data.data.inputs,
            outputs: outputStringConvert.convert(data.data.outputs),
            // skipsamples:(parseInt(data.data.skipsamples)+1)
            skipsamples:that.inc(parseInt(data.data.skipsamples))
      })
  })

  return {
    get_settings: function(){
      return deferred.promise;

    }
  }

});

// http://briantford.com/blog/angular-socket-io
app.factory('socket', function ($rootScope) {
  this.socket;
  var that = this;

  return {
    init:function(ipadrs,port){
      that.socket = io(ipadrs +':'+ port);
    },
    on: function (eventName, callback) {
      that.socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(that.socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      that.socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(that.socket, args);
          }
        });
      })
    }
  };
});

//konvertuje string label,name,min,max,init(optional);
//na na pole objektov [{"label":label,"name":name,....}]
app.factory('myStringToArrayWithObjects',function(){
  return{

    convert:function(data){
      try{
      var BreakException = {};
      var inputs = [];
      var remove_new_lines = data.replace(/(\r\n|\n|\r)/gm,"");
      //odstrani z pola "" ktore prida replace o riadok vysiie
      var lines = remove_new_lines.split(';').filter(function(n){ return n != "" });
      angular.forEach(lines,function(line){
        var obj = {};
        var params = line.split(',');
        //iba ak vsetky existuju
        if( (typeof params[0] == 'string') && (typeof params[1] == 'string')  && (isNaN(params[2]) == false)  && (isNaN(params[3]) == false)){
          obj["label"] = params[0];
          obj["name"] = params[1];
          obj["min"] = parseFloat(params[2]);
          obj["max"] = parseFloat(params[3]);
          if(params[4]){
            obj["init"] = parseFloat(params[4]);
          }
        }else{
          throw BreakException;
        }

        inputs.push(obj);

      }) 

      return inputs;
      }catch(e){
          return 'wrong input structure';
        }

    }

    }
});


//konvertuje string x,y;
//na na pole objektov [{"x_axis":x,"y_axis":y}]
app.factory('outputStringConvert',function(){
  return{

    convert:function(data){
      var outputs = [];
      var remove_new_lines = data.replace(/(\r\n|\n|\r)/gm,"");
      var lines = remove_new_lines.split(';').filter(function(n){ return n != "" });
      angular.forEach(lines,function(line){
        var obj = {};
        var params = line.split(',');
        obj["x_axis"] = params[0];
        obj["y_axis"] = params[1];
        obj["name"] = params[0]+params[1]
        outputs.push(obj);
      });
      return outputs;
    }

    }
});


app.factory('myChart',function(){
  

  var Chart = function(output){
    this.name = output.name;
    this.x_axis = output.x_axis;
    this.y_axis = output.y_axis;
    this.data = [[]];
    this.datasetOverride = [{ fill: false }];
    this.options = {
      animation:{duration:0},
      scales:{
        yAxes:[{scaleLabel:{
          display : true,
          labelString: this.y_axis,
        }}],
        xAxes:[{scaleLabel:{
          display : true,
          labelString: this.x_axis,
        }}]
      },
    };
    this.labels = [];

    this.push_new_val = function(val,units){

      //xove hodnoty davam do labels co by malo byt polda dokumentacie ok, ak by som chcel definovat [{x:val,y:val}] bol by to prerurosvany graf
      //http://www.chartjs.org/docs/#line-chart-data-points 
      this.labels.push(val[this.x_axis]);
      this.data[0].push(val[this.y_axis]);
      this.options.scales.xAxes[0].scaleLabel.labelString = this.x_axis + ' ['+units[this.x_axis]+']';
      this.options.scales.yAxes[0].scaleLabel.labelString = this.y_axis + ' ['+units[this.y_axis]+']';
    }

    this.reset = function(){
      this.data = [[]];
      this.labels = [];
    }

  };



  return Chart;

});






