var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');

// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'PNDLR is determinig GPS',
  font:'GOTHIC_18_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

var cityStart = 'bla';
var cityGoal = 'bla';
var coll = [];  

// Where are we?
var geolocation = (function() {
  //'use strict';

  //var geoposition;
  var options = {
    maximumAge: 1000,
    timeout: 15000,
    enableHighAccuracy: false
  };

  function _onSuccess (callback, position) {
    console.log('DEVICE POSITION');
    console.log('LAT: ' + position.coords.latitude + ' - LON: ' +  position.coords.longitude);
 
    var lat = position.coords.latitude;
    //var long = pos.coords.longitude;

    if (Math.abs(lat - 48.7) < Math.abs(lat - 49.4)) {
      cityStart = 'Stuttgart';
      cityGoal = 'Mannheim';
    }
    else {
      cityStart = 'Mannheim';
      cityGoal = 'Stuttgart';
    }
    callback();
  }

   function _onError (callback, error) {
     console.log(error);
     cityStart = 'Stuttgart';
     cityGoal = 'Mannheim';
     callback();
   }

   function _getLocation (callback) {
     navigator.geolocation.getCurrentPosition(
       _onSuccess.bind(this, callback),
       _onError.bind(this, callback), 
       options
     );
   }

  return {
    location: _getLocation
   };

}());

geolocation.location(function () {
  console.log('finished, loading app.');
  
  // Text element to inform user
  var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'PNDLR checking DB for '+ cityStart + ' -> ' + cityGoal,
  font:'GOTHIC_18_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

// Add to splashWindow and show
  splashWindow.add(text);
  //splashWindow.show();
  
  var URL = 'http://mobile.bahn.de/bin/mobil/query.exe/dox?S='+ cityStart + '&Z=' +cityGoal + '&start=1';
//console.log(URL);
  //var URL = 'http://mobile.bahn.de/bin/mobil/query.exe/dox?S=mannheim&Z=stuttgart&start=1';


// Make the request
ajax(
  {
    url: URL},
  function(data) {
    // Success!
    console.log("Successfully fetched DB data!");

    // Extract data
    var menuitems = [];
    //var coll = [];
    var re = /td class=\"overview timelink\"><a href=\"(.*?)\"><span class=\"bold">(.*?)<\/span>.*?td class=\"overview tprt\"(.*?)<\/td>.*?td class=.overview..*?<br \/>(.*?)<\/td>.*?overview iphonepfeil\">(.*?)<br \/>/g;
    
    var myArray;
    
    while ((myArray = re.exec(data)) !== null){
      var detailUrl = myArray[1];  
      var start = myArray[2];
      var info =  myArray[3];
      var duration = myArray[4];
      var traintype = myArray[5];

      coll.push(detailUrl);
      
      if (/faellt.aus/i.test(info)) {
        info = "cancelled";
      }
      else if (/achtung/i.test(info)) {
        info = "warning";
      }
      else if (/<span class=\"okmsg\">(.+?)<\/span>/i.test(info)) {
        var arr2 = /<span class=\"okmsg\">(.+?)<\/span>/i.exec(info);
        info = arr2[1];
      }
      else if (/<span class=\"red\">(.+?)<\/span>/i.test(info)) {
        var arr2 = /<span class=\"red\">(.+?)<\/span>/i.exec(info);
        info = arr2[1];
      }
      else if (/&nbsp;<br \/>&nbsp;/i.test(info)) {
        info = "no info";
      }
      else {
        info = "E!";
      }
      menuitems.push({title:start + " " + info,
                      subtitle: traintype + " (" + duration +") ",
                      detail: detailUrl
                     });
      
    }

    // Construct Menu to show to user
    var resultsMenu = new UI.Menu({
      sections: [{
      title: 'Current Connections',
      items: menuitems
      }]
    });

    // Show the Menu, hide the splash
    resultsMenu.show();
    splashWindow.hide();
    
    // Add an action for SELECT
    resultsMenu.on('select', function(e) {
      console.log('Item number ' + e.itemIndex + ' was pressed!');
      
      var newUrl = coll[e.itemIndex].replace(/&amp;/g, '&');

      
      //// NEW REQUEST START
      
      ajax(
        {
        url: newUrl},
        function(data) {
          // Success!
          console.log("Successfully fetched detailed DB data!\n" + newUrl);

          // Extract data
          
          var myArray;
          var warnInfo = "";
          var info;
          
          var re = /<div class=\"red bold haupt\" >([\s\S]*?)<\/div>/i;
          
          if (re.test(data)){
            myArray = re.exec(data);
            warnInfo = myArray[1];  
          }
          

          var re2 = /<span class=\"querysummary2\" id=\"dtlOpen_2\">([\s\S]*?<\/span>)/i;
             
          if (re2.test(data)){
            myArray = re2.exec(data);
            info = myArray[1];  
          }
          
          if (/faellt.aus/i.test(info)) {
            info = "cancelled";
          }
          else if (/<span class=\"okmsg\">(.+?)<\/span>/i.test(info)) {
            myArray = /<span class=\"okmsg\">(.+?)<\/span>/i.exec(info);
            info = myArray[1];
          }
          else if (/<span class=\"red\">(.+?)<\/span>/i.test(info)) {
            myArray = /<span class=\"red\">(.+?)<\/span>/i.exec(info);
            info = myArray[1];
          }
          else {
            info = "no info";
          }

          
          
          var newcard = new UI.Card({
          title: info,
          body: warnInfo,
          scrollable: true  
          });
        
          newcard.show();
        },
        function(error) {
        // Failure!
        console.log('Failed fetching DB data: ' + error);
        var infoWindow = new UI.Window();    
        // Text element to inform user
        var text = new UI.Text({
          position: new Vector2(0, 0),
          size: new Vector2(144, 168),
          text:'Error fetching detail URL' + error,
          font:'GOTHIC_18_BOLD',
          color:'black',
          textOverflow:'wrap',
          textAlign:'center',
          backgroundColor:'white'
        });

        // Add to splashWindow and show
        infoWindow.add(text);
        infoWindow.show();
        }
    );     //end ajax call
      
        
      
      
    }); //End action SELECT
    
  },
  function(error) {
    // Failure!
    console.log('Failed fetching DB data: ' + error);
    //card.subtitle(cityStart + "->" + cityGoal);
    //card.body("Error!");
  }
);
});



