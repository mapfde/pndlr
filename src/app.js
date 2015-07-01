var UI = require('ui');
var ajax = require('ajax');



// Create a Card with title and subtitle
var card = new UI.Card({
  title:'Pndlr',
  subtitle:'Fetching...',
  scrollable: true
});

// Display the Card
card.show();

var cityStart = 'bla';
var cityGoal = 'bla';
  

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
  var URL = 'http://mobile.bahn.de/bin/mobil/query.exe/dn?S='+ cityStart + '&Z=' +cityGoal + '&start=1';
console.log(URL);
//var URL = 'http://mobile.bahn.de/bin/mobil/query.exe/dox?S=mannheim&Z=stuttgart&start=1';


// Make the request
ajax(
  {
    url: URL},
  function(data) {
    // Success!
    console.log("Successfully fetched DB data!");

    // Extract data
    
    var result = "";
    var re = /class=.timetx..\sab\s..td.\s.td class=.time..\s(.*)\s.nbsp.(.*)\s..td.\s.td class=.duration lastrow. rowspan=.2..\s(.*)\s..td./g;
    var myArray;
    
    while ((myArray = re.exec(data)) !== null){
      
      var start = myArray[1];
      var info =  myArray[2];
      var duration = myArray[3];
      
      if (/\+\d*..span/i.test(info)) {
        var re2 = /(\+\d*)..span/i;
        var arr2 = re2.exec(info);
        info = arr2[1];
      }
      else {
        info = "W!";
      }
      result += start + " (" + duration +") " + " "  + info + "\n";
      //result += "--------\n";
    }

    // Show to user
    card.subtitle(cityStart.substring(0,3) + "->" + cityGoal.substring(0,3)); //+ " lat:" + lat + " long:" +long);     
    card.body(result);
  },
  function(error) {
    // Failure!
    console.log('Failed fetching DB data: ' + error);
    card.subtitle(cityStart + "->" + cityGoal);
    card.body("Error!");
  }
);
});



