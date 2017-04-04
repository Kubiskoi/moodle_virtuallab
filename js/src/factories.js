app.factory('MyGlobalVars', function() {
  return {
      // path_to_imgs : '/mod/virtuallab/img/experimenty/',
      path_to_loading_gif : '/mod/virtuallab/img/',
      logged_user: document.getElementById('jh-logged-user').innerHTML,
      mfilepar: document.getElementById('jh-mfilepar').innerHTML,
      mfilescript: document.getElementById('jh-mfilescript').innerHTML,
      ipadrs: document.getElementById('jh-ipadrs').innerHTML,
      port: document.getElementById('jh-port').innerHTML,
      foldername: document.getElementById('jh-foldername').innerHTML,
      portdb: document.getElementById('jh-portdb').innerHTML,
      ipdb: document.getElementById('jh-ipdb').innerHTML,
      inputs: document.getElementById('jh-inputs').innerHTML,
      outputs: document.getElementById('jh-outputs').innerHTML
  };
});

// http://briantford.com/blog/angular-socket-io
app.factory('socket', function ($rootScope,MyGlobalVars) {
  var socket = io(MyGlobalVars.ipadrs +':'+MyGlobalVars.port);
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
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