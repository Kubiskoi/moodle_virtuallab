// ziskaj nastavenia modulu, ktore sa nastavuju pri vytvarani a su ulozene v moodlovskej databaze
app.factory('MyGlobalVars', function($http,$q) {
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
            outputs: data.data.outputs
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
      var inputs = [];
      var remove_new_lines = data.replace(/(\r\n|\n|\r)/gm,"");
      //odstrani z pola "" ktore prida replace o riadok vysiie
      var lines = remove_new_lines.split(';').filter(function(n){ return n != "" });
      angular.forEach(lines,function(line){
        var obj = {};
        var params = line.split(',');
        obj["label"] = params[0];
        obj["name"] = params[1];
        obj["min"] = parseFloat(params[2]);
        obj["max"] = parseFloat(params[3]);
        if(params[4]){
          obj["init"] = parseFloat(params[4]);
        }
        inputs.push(obj);

      })

      return inputs;
    }
  }
});