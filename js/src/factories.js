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
            path_to_loading_gif : '/mod/virtuallab/pix/',
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

app.filter('smallnum',function(){
  return function(num){
    return parseFloat(num).toPrecision(3);
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

app.factory('myCanvas',function(){
  
  

  var Canvas = function(experiment){
    this.experiment = experiment;
    this.cnv = document.getElementById('jh-anim');
    this.ctx = this.cnv.getContext("2d");
    //pretocenie canvasu aby [0,0] bol v lavo dole, defaultne je v lavo hore
    this.ctx.transform(1, 0, 0, -1, 0, this.cnv.height);

    //  ===========================================
    //  animacia sikmy vrh
    //  ===========================================
    this.sikmy_vrh_draws = {};
    this.sikmy_vrh_draws.draw_ball = function(x,y){
      that.ctx.beginPath();
      that.ctx.arc(that.begin_offset_sikmy_vrh+x, that.begin_offset_sikmy_vrh+y, 5, 0, 2 * Math.PI);
      that.ctx.fill();
      that.ctx.closePath();

    }
     this.sikmy_vrh_draws.draw_x_axis = function(){
      that.ctx.beginPath();
      that.ctx.moveTo(that.begin_offset_sikmy_vrh, that.begin_offset_sikmy_vrh);
      that.ctx.lineTo(that.cnv.width - 25, that.begin_offset_sikmy_vrh);
      that.ctx.stroke();
      that.ctx.closePath();
    }
    this.sikmy_vrh_draws.draw_y_axis = function(){
      that.ctx.beginPath();
      that.ctx.moveTo(that.begin_offset_sikmy_vrh, that.begin_offset_sikmy_vrh);
      that.ctx.lineTo(that.begin_offset_sikmy_vrh,that.cnv.height-25);
      that.ctx.stroke();
      that.ctx.closePath();
    }
     this.sikmy_vrh_draws.draw_x_pointer = function(x){
      that.ctx.beginPath();
      that.ctx.moveTo(x+that.begin_offset_sikmy_vrh, that.begin_offset_sikmy_vrh+5);
      that.ctx.lineTo(x+that.begin_offset_sikmy_vrh, that.begin_offset_sikmy_vrh-5);
      that.ctx.stroke();
      that.ctx.closePath();

      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
      that.ctx.beginPath();
      that.ctx.font = "15px Arial";
      that.ctx.fillText(x, x+ (that.begin_offset_sikmy_vrh/2 + 5), that.cnv.height - that.begin_offset_sikmy_vrh + 20);
      that.ctx.closePath();
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);

    }
     this.sikmy_vrh_draws.draw_y_pointer = function(y){
      that.ctx.beginPath();
      that.ctx.moveTo(that.begin_offset_sikmy_vrh-5, that.begin_offset_sikmy_vrh+y);
      that.ctx.lineTo(that.begin_offset_sikmy_vrh+5, that.begin_offset_sikmy_vrh+y);
      that.ctx.stroke();
      that.ctx.closePath();

      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
      that.ctx.beginPath();
      that.ctx.font = "15px Arial";
      that.ctx.fillText(y, 15, that.cnv.height - y - that.begin_offset_sikmy_vrh +5);
      that.ctx.closePath();
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);

    }
    this.sikmy_vrh_draws.draw_legend = function(){
          that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
          that.ctx.beginPath();
          that.ctx.font = "15px Arial";
          that.ctx.fillText("y [m]", 20, 40);
          that.ctx.fillText("x [m]", 540, 360);
          that.ctx.closePath();
          that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);

    }
    //  ===========================================
    //  ===========================================
    
    //  ===========================================
    //  animacia volny pad
    //  ===========================================
    this.volny_pad_draws = {};
     this.volny_pad_draws.draw_x_axis = function(){
      that.ctx.beginPath();
      that.ctx.moveTo(that.begin_offset_volny_pad, that.begin_offset_volny_pad);
      that.ctx.lineTo(that.cnv.width - 25, that.begin_offset_volny_pad);
      that.ctx.stroke();
      that.ctx.closePath();
    }
    this.volny_pad_draws.draw_y_axis = function(){
      that.ctx.beginPath();
      that.ctx.moveTo(that.begin_offset_volny_pad, that.begin_offset_volny_pad);
      that.ctx.lineTo(that.begin_offset_volny_pad,that.cnv.height-25);
      that.ctx.stroke();
      that.ctx.closePath();
    }
    this.volny_pad_draws.draw_legend = function(){
          that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
          that.ctx.beginPath();
          that.ctx.font = "15px Arial";
          that.ctx.fillText("y [m]", 20, 40);
          that.ctx.closePath();
          that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);

    }

    this.volny_pad_draws.draw_ball = function(h){
      that.ctx.beginPath();
      //canvas ma na vysku 400 pixelov a my pustame z malych vysok preto mozem dat *2
      that.ctx.arc(that.begin_offset_volny_pad*2, that.begin_offset_volny_pad+h*2, 5, 0, 2 * Math.PI);
      that.ctx.fill();
      that.ctx.closePath();

    }
     this.volny_pad_draws.draw_y_pointer = function(h){
      that.ctx.beginPath();
      that.ctx.moveTo(that.begin_offset_volny_pad-5, that.begin_offset_volny_pad+h*2);
      that.ctx.lineTo(that.begin_offset_volny_pad+5, that.begin_offset_volny_pad+h*2);
      that.ctx.stroke();
      that.ctx.closePath();

      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
      that.ctx.beginPath();
      that.ctx.font = "15px Arial";
      //canvas ma na vysku 400 pixelov a my pustame z malych vysok preto mozem dat *2
      that.ctx.fillText(h, 15, that.cnv.height - 2*h - that.begin_offset_volny_pad +5);
      that.ctx.closePath();
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);

    }
    //  ===========================================
    //  ===========================================

    //  ===========================================
    //  animacia dve nadrze
    //  ===========================================
    this.dve_nadrze_draws = {};
    this.dve_nadrze_draws.draw_bowl= function(x){
      that.ctx.beginPath();
      that.ctx.fillStyle="#63bbff";
      that.ctx.fillRect(x-98,11,x+297,30);
      
      that.ctx.moveTo(x-99,380);
      that.ctx.lineTo(x-99,10);
      that.ctx.lineTo(x+300,10);
      that.ctx.lineTo(x+300,90);
      //lave cerpadlo
      that.ctx.moveTo(x-89,370);
      that.ctx.lineTo(x-89,300);
      that.ctx.lineTo(x-59,300);
      that.ctx.lineTo(x-59,260);
      that.ctx.lineTo(x-89,260);
      that.ctx.lineTo(x-89,30);


      that.ctx.stroke();
      




      that.ctx.closePath();

    }
    this.dve_nadrze_draws.draw_zero_level = function(x){
      that.ctx.beginPath();
      that.ctx.setLineDash([10,5]);
      that.ctx.moveTo(x-10,105);
      that.ctx.lineTo(x+275,105);

      that.ctx.stroke();

      that.ctx.closePath();
      that.ctx.setLineDash([]);
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
      that.ctx.beginPath();
      that.ctx.font = "15px Arial";
      that.ctx.fillStyle="black";
      that.ctx.fillText('0 [m] level', x-80,that.cnv.height - 100);
      that.ctx.closePath();
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
    }
    this.dve_nadrze_draws.draw_nadrze = function(x){
      that.ctx.beginPath();
      that.ctx.moveTo(x,100);
      that.ctx.lineTo(x,350);
      that.ctx.stroke();
      that.ctx.moveTo(x+75,105);
      that.ctx.lineTo(x+75,350);
      that.ctx.stroke();
      that.ctx.moveTo(x,100);
      that.ctx.lineTo(x+75,100);
      that.ctx.stroke();

      that.ctx.moveTo(x+200,105);
      that.ctx.lineTo(x+200,350);
      that.ctx.stroke();
      that.ctx.moveTo(x+75+200,110);
      that.ctx.lineTo(x+75+200,350);
      that.ctx.moveTo(x+75+200,105);
      that.ctx.lineTo(x+75+200,100);

      //vylev
      that.ctx.moveTo(x+75+200,110);
      that.ctx.lineTo(x+75+220,110);
      that.ctx.lineTo(x+75+220,90);

      that.ctx.moveTo(x+75+200,105);
      that.ctx.lineTo(x+75+215,105);
      that.ctx.lineTo(x+75+215,90);




      that.ctx.stroke();
      that.ctx.moveTo(x+200,100);
      that.ctx.lineTo(x+75+200,100);
      that.ctx.stroke();

      that.ctx.closePath();
    }
        this.dve_nadrze_draws.draw_hladiny = function(x,h1,h2){
      that.ctx.beginPath();
      that.ctx.fillStyle="#63bbff";
      that.ctx.fillRect(x+1,105,73,h1*1000);
      that.ctx.fillRect(x+1+200,105,73,h2*1000);
      that.ctx.stroke();

      that.ctx.closePath();
    }
        this.dve_nadrze_draws.draw_pipe = function(x,h1,h2){
          that.ctx.beginPath();
          that.ctx.moveTo(x+75,100);
          that.ctx.lineTo(x+75+200,100);
          that.ctx.stroke();

        
          that.ctx.moveTo(x+75,105);
          that.ctx.lineTo(x+200,105);
          that.ctx.stroke();
          
            //stredny valve
          that.ctx.moveTo(x+100+33,104);
          that.ctx.lineTo(x+100+33,120);
          that.ctx.stroke();
          that.ctx.fillStyle="black";
          that.ctx.fillRect(x+100+25,120,20,10);
          that.ctx.stroke();

            //pravy valve
          that.ctx.moveTo(x+75+200,110);
          that.ctx.lineTo(x+75+210,120);
          that.ctx.fillStyle="black";
          that.ctx.fillRect(x+75+210,120,20,10);
          
         
          

         

          //voda v potrubi
          that.ctx.fillStyle="#63bbff";
          // var myh1 = h1*1000;
          // if(myh1>= 28)myh1 = 28;
          that.ctx.fillRect(x+1,101,273,4);
          
          // var myh2 = h2*1000;
          // if(myh2>= 28)myh2 = 28;
          // that.ctx.fillRect(x+1+75+55,101,70,myh2);

          // that.ctx.fillRect(x+1+200,101,73,h2*1000);
          that.ctx.stroke();
          
      
        
        that.ctx.closePath();
    }

    this.dve_nadrze_draws.draw_vals = function(x,h1,h2){
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);
      that.ctx.beginPath();
      that.ctx.font = "15px Arial";
      that.ctx.fillStyle="black";
      that.ctx.fillText(h1+'[m]', x+5,that.cnv.height - h1*1000 - 110);
      that.ctx.fillText(h2+'[m]', x+5 + 200 ,that.cnv.height - h2*1000 - 110);
      that.ctx.closePath();
      that.ctx.transform(1, 0, 0, -1, 0, that.cnv.height);

    }
    this.dve_nadrze_draws.draw_inp = function(){
      that.ctx.beginPath();


    

        that.ctx.moveTo(0,380);
        that.ctx.lineTo(135,380);
        that.ctx.moveTo(10,370);
        that.ctx.lineTo(125,370);
        that.ctx.moveTo(125,370);
        that.ctx.lineTo(125,360);
        that.ctx.moveTo(135,380);
        that.ctx.lineTo(135,360);
        that.ctx.stroke();

      that.ctx.closePath();

    }

    this.dve_nadrze_draws.draw_cloese_valves = function(x){
      that.ctx.beginPath();

      //pravy
      that.ctx.moveTo(x+75+200,100);
      that.ctx.lineTo(x+75+200,120);
      that.ctx.stroke();


      //stredny
      that.ctx.moveTo(x+100+33,100);
      that.ctx.lineTo(x+100+33,120);
      that.ctx.stroke();

      that.ctx.closePath();

    }

    this.dve_nadrze_draws.draw_inp_water = function(x){
      that.ctx.beginPath();


          that.ctx.fillStyle="#63bbff";
          that.ctx.fillRect(0,370,135,10);
          that.ctx.fillRect(125,360,10,10);
          that.ctx.fillRect(x-99,20,10,350);
          that.ctx.fillRect(x-99,260,40,40);
          that.ctx.strokeStyle = '#63bbff';

          that.ctx.lineWidth=5;
          that.ctx.moveTo(x+75+199,107);
          that.ctx.lineTo(x+75+219,107);
          that.ctx.moveTo(x+75+218,107);
          that.ctx.lineTo(x+75+218,15);
          that.ctx.stroke();
          that.ctx.lineWidth=1;


          that.ctx.moveTo(125, 360);
          that.ctx.lineTo(120, 350);
          that.ctx.lineTo(127, 355);
          that.ctx.lineTo(130, 350);
          that.ctx.lineTo(135, 355);
          that.ctx.lineTo(140, 350);
          that.ctx.lineTo(135, 360);
          that.ctx.fill();
          that.ctx.stroke();




      that.ctx.closePath();
      that.ctx.strokeStyle = 'black';


    }

    this.dve_nadrze_draws.draw_motor = function(r){
      that.ctx.save();
      that.ctx.translate(20, 280); 
      that.ctx.rotate(-r*Math.PI/180);
      that.ctx.beginPath();
        that.ctx.arc(0, 0, 5, 0, 2 * Math.PI, false);
        that.ctx.fillStyle="black";

        that.ctx.fill();
        that.ctx.fillStyle="#63bbff";

       
        that.ctx.moveTo(0,0);
        that.ctx.lineTo(-19,0);

        that.ctx.moveTo(0,0);
        that.ctx.lineTo(19,0);

        that.ctx.moveTo(0,0);
        that.ctx.lineTo(0,19);

        that.ctx.moveTo(0,0);
        that.ctx.lineTo(0,-19);


        that.ctx.stroke();

      that.ctx.closePath();
      that.ctx.restore();

    }
    //  ===========================================
    //  ===========================================

    var that = this;

    switch(experiment){
      case "sikmy_vrh":
            this.begin_offset_sikmy_vrh = 60;
            init_sikmy_vrh();
          break;
      case "volny_pad":
          this.begin_offset_volny_pad = 60;
          init_volny_pad();
          break;
      case "dve_nadrze":
          this.draw_nadrze_x_dif = 100;
          init_dve_nadrze();
          break;
      default:
          this.cnv.style.display = 'none';
    }


    

   
    function init_sikmy_vrh(){
      that.sikmy_vrh_draws.draw_x_axis();
      that.sikmy_vrh_draws.draw_y_axis();
      that.sikmy_vrh_draws.draw_ball(0,0);
      that.sikmy_vrh_draws.draw_legend();
    }

    function init_volny_pad(){
      that.volny_pad_draws.draw_x_axis();
      that.volny_pad_draws.draw_y_axis();
      that.volny_pad_draws.draw_legend();
    }

    function init_dve_nadrze(){
      that.dve_nadrze_draws.draw_zero_level(that.draw_nadrze_x_dif);
      that.dve_nadrze_draws.draw_nadrze(that.draw_nadrze_x_dif);
      that.dve_nadrze_draws.draw_pipe(that.draw_nadrze_x_dif,0,0);
      that.dve_nadrze_draws.draw_inp();
      that.dve_nadrze_draws.draw_bowl(that.draw_nadrze_x_dif);
      that.dve_nadrze_draws.draw_cloese_valves(that.draw_nadrze_x_dif);
      that.dve_nadrze_draws.draw_motor();
      that.nadrz_counter = 0;

    }

    this.push_new_val = function(val,units){
      switch(this.experiment){
        case "sikmy_vrh":
              that.ctx.clearRect(0, 0, that.cnv.width, that.cnv.height);
              that.sikmy_vrh_draws.draw_x_axis();
              that.sikmy_vrh_draws.draw_y_axis();
              that.sikmy_vrh_draws.draw_ball(val.x,val.y);
              that.sikmy_vrh_draws.draw_x_pointer(val.x);
              that.sikmy_vrh_draws.draw_y_pointer(val.y);
              that.sikmy_vrh_draws.draw_legend();
          break;
        case "volny_pad":
              that.ctx.clearRect(0, 0, that.cnv.width, that.cnv.height);
              that.volny_pad_draws.draw_x_axis();
              that.volny_pad_draws.draw_y_axis();
              that.volny_pad_draws.draw_legend();
              that.volny_pad_draws.draw_ball(val.h);
              that.volny_pad_draws.draw_y_pointer(val.h);

          break;
        case "dve_nadrze":
              var x_dif = that.draw_nadrze_x_dif;
              that.ctx.clearRect(0, 0, that.cnv.width, that.cnv.height);
              that.dve_nadrze_draws.draw_hladiny(x_dif,val.x1,val.x2);
              that.dve_nadrze_draws.draw_vals(x_dif,val.x1,val.x2);
              that.dve_nadrze_draws.draw_pipe(x_dif,val.x1,val.x2);

              if(val.w != val.x2){
                that.dve_nadrze_draws.draw_inp_water(x_dif);
                that.nadrz_counter=that.nadrz_counter+10;
              }
              else that.dve_nadrze_draws.draw_cloese_valves(x_dif);
              that.dve_nadrze_draws.draw_inp();
              that.dve_nadrze_draws.draw_nadrze(x_dif);
              that.dve_nadrze_draws.draw_zero_level(x_dif);
              that.dve_nadrze_draws.draw_bowl(x_dif);
              that.dve_nadrze_draws.draw_motor(that.nadrz_counter);
              

          break;
      }

    }

    // this.reset = function(){
      
    // }

  };



  return Canvas;

});






