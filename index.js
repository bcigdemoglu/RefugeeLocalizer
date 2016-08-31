var accountSid = 'ACee3f3cbc245a0e9c520cdab9ef265676'; // Your Account SID from www.twilio.com/console
var authToken = '5915e4ccc30cfb6dca5ffd49ced9fde1';   // Your Auth Token from www.twilio.com/console
var twilio = require('twilio');
var express = require('express');
var http = require('http');
var GoogleMapsAPI = require('googlemaps');
var publicConfig = { key: 'AIzaSyAmzgHXb1rBBlYsPrNI_YtisuhmolG1rqc' };
var dms2dec = require('dms2dec');
var gmAPI = new GoogleMapsAPI(publicConfig);
var $ = new require('underscore');
// google.options({ auth: 'AIzaSyAmzgHXb1rBBlYsPrNI_YtisuhmolG1rqc' });
var app = express();
var client = new twilio.RestClient(accountSid, authToken);

var countryCode = {
  "TR": {
    "K": "N",
    "G": "S",
    "D": "E",
    "B": "W"
  }
}
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});  

app.get('/getGoogleAddress', function(request, response) {
  var lat, lng;
  var resmessage = '';
  try {
    
    var latlng = ''
    var pos = decodeURI(request.query.Body);
    var from = request.query.FromCountry;
    var posRegex = /([0-9]+\.?[0-9]*).*?([0-9]+\.?[0-9]*).*?([0-9]+\.?[0-9]*).*?([NS]).*?([0-9]+\.?[0-9]*).*?([0-9]+\.?[0-9]*).*?([0-9]+\.?[0-9]*).*?([EW])/;
    var dms = pos.match(posRegex);
    if (!dms && $.has(countryCode, from)) {
      var directions = request.query.Body.match(/[A-Z]/g);
      pos = pos.replace(/([0-9]+\.?[0-9]*.*?[0-9]+\.?[0-9]*.*?[0-9]+\.?[0-9]*.*?).*?([A-Z]).*?([0-9]+\.?[0-9]*.*?[0-9]+\.?[0-9]*.*?[0-9]+\.?[0-9]*.*?).*?([A-Z])/, 
        "$1 "+countryCode[from][directions[0]]+" $3 "+countryCode[from][directions[1]]);
      console.log(pos);
    }
    dms = pos.match(posRegex);
    // [latDec, lngDec] = dms2dec(Array lat, String latRef, Array lng, String lonRef);
    console.log(pos);
    console.log(from);
    console.log(dms);
    var coords = dms2dec([parseFloat(dms[1]), parseFloat(dms[2]), parseFloat(dms[3])],
                         dms[4],
                         [parseFloat(dms[5]), parseFloat(dms[6]), parseFloat(dms[7])],
                         dms[8]);
    latlng = coords[0] + "," + coords[1];
    console.log(latlng);
  } catch (e) {
    console.log(e);
    resmessage = ("Error occured:\n"
      + "1. Go to Settings app "
      + "and turn the Location Services ON.\n"
      + "Settings -> Location Services -> ON.\n" 
      + "2. Expand the Location Services "
      + "and turn the app Compass ON.\n"
      + "3. Go back to your home screen.\n"
      + "4. Open the Compass app.\n"
      + "5. GPS coordinates are at the bottom:\n"
      + "(e.g. 38°53'51\" N 77°6'23\" W)\n"
      + "Press and hold on the GPS coordinates\n"
      + "6. 'Copy' the coordinates\n"
      + "7. Send it to " + request.query.To + " again.\n"
      + "NOTE: Use N, S, W, E for directions.");
  }
  gmAPI.reverseGeocode({"latlng": latlng}, function(err, result) {
    if (result && result.results[0]) {
      resmessage = (result.results[0].formatted_address
        + "\nCreated by Bugrahan Cigdemoglu 2016.");
    }
    console.log(resmessage);
    client.messages.create({
      body: resmessage,
      to: request.query.From, // Text this number
      from: request.query.To // From a valid Twilio number
      }, function(err, message) {
        if (err) {
          console.log(err);
          response.send("message could not be sent");
        } else {
          console.log(message);
          response.send("message sent successfully");
        }
    });
  });
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


