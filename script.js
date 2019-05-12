/// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto, option, input,geojsonLayer,  noUiSlider, GeoJson  */

var map = L.map('map', {
  doubleClickZoom: false,
  maxZoom: 20
}).setView([0.023629, 37.906771], 4);

//setView([-1.313829, 36.878771], 15);

populateDrowpDown()

// Add base layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
  maxZoom: 24
}).addTo(map);

// Initialize Carto
var client = new carto.Client({
  apiKey: 'default_public',
  username: 'yazidmekhtoub'
});

// *****************This is the sCHOOLS  PARCELS LAYER**********************

var source = new carto.source.SQL("SELECT * FROM schoolsparcels");


var style = new carto.style.CartoCSS(`
#layer [zoom>=13] {
  polygon-fill: #f46242;
  polygon-opacity: 1;
}
#layer [zoom>=13] ::outline {
  line-width: 10;
  line-color: #f46242;
  line-opacity: 0;
}
#layer  [zoom>=17] ::labels {
  text-name: [schoolname];
  text-face-name: 'DejaVu Sans Book';
  text-size: 10;
  text-fill: black;
  text-label-position-tolerance: 0;
  text-halo-radius: 0;
  text-halo-fill: black;
  text-dy: 0;
  text-allow-overlap: false;
  text-placement: point;
  text-placement-type: dummy;
}
`);

// *****************This is THE RIVER LAYER**********************

var Riversource = new carto.source.SQL("SELECT * FROM rivers");

var Riverstyle = new carto.style.CartoCSS(`
#layer [zoom>=13] {
  line-width: 7;
  line-color: #4cafc8;
  line-opacity: 1;
}

#layer [zoom>=17] {
  line-width: 10;
  line-color: #4cafc8;
  line-opacity: 1;
  }

`);

// *****************This is the RAIL ROAD LAYER**********************

var railsource = new carto.source.SQL("SELECT * FROM railroad");

var railstyle = new carto.style.CartoCSS(`
#layer [zoom>=13] {
  line-width: 8;
  line-color: black;
  line-opacity: 1;
  line-dasharray: 2, 4;
}
`);

// *****************This is the village boundries LAYER**********************

var villagesource = new carto.source.SQL("SELECT * FROM villageboundries");

var villagestyle = new carto.style.CartoCSS(`
#layer {
  polygon-fill: #000000;
  polygon-opacity: 0;
}
#layer::outline {
  line-width: 1;
  line-color: black;
  line-opacity: 0.6;
}
#layer [zoom>=16] ::labels {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-size: 15;
  text-fill: #000;
  text-label-position-tolerance: 0;
  text-halo-radius: 0;
  text-halo-fill: #000;
  text-dy: 0;
  text-allow-overlap: false;
  text-placement: point;
  text-placement-type: dummy;
  
}

`);


var geojson 

$.getJSON('https://cdn.glitch.com/cd1c0956-37f2-456f-838d-d2ba98ac7436%2Fkenya_admin.geojson?1557104152411', function (data) {
  geojson = L.geoJson(data, {
     
      // Add invert: true to invert the geometries in the GeoJSON file
      invert: true,
     
      style: {
        color: 'black',
        stroke: false,
        fillOpacity: 0.4,
        interactive: false,
      }
    }).addTo(map);
  });

// *****************Add the data to the map as a layers **********

var layer = new carto.layer.Layer(source, style, {
  featureClickColumns: ["schoolname","total_stud", "ownership", "sm_area", "feedingpro", "totalscore", "playground", "village", "neighborh", "type_schoo", 
                        "num_room_1", "stud_tea_r", "water", "soap", "medical_eq", "feminine_h", "_2015_tuiti", "travel_tim", "raildist", "riverdist" ] });

var Riverlayer = new carto.layer.Layer(Riversource, Riverstyle);
var raillayer = new carto.layer.Layer(railsource, railstyle);
var villagelayer = new carto.layer.Layer(villagesource, villagestyle);

client.addLayers([villagelayer, Riverlayer, raillayer, layer, ]);
client.getLeafletLayer().addTo(map);

//**************************** THIS THE DROP DOWN ON THE LEFT SIDE OF THE MAP************************

function populateDrowpDown(){
            return fetch(
                `https://yazidmekhtoub.carto.com/api/v2/sql?format=geojson&q=SELECT the_geom, name_facil FROM schoolsparcels ORDER BY name_facil ASC`
                ).then((resp) => resp.json())
                .then((response) => {
                    return response['features'].map(function(feature){
                        option = document.createElement("option")
                        option.setAttribute("value", feature.properties.name_facil)
                        option.textContent = feature.properties.name_facil
                        document.getElementById("js-select-drop2").appendChild(option);
                    });
                }).catch((error) => {
                    console.log(error)
                })
        }

 var sidebar = document.querySelector('.sidebar-feature-content');

 //**********  fly to the boundries of the selected feature from the side bar and populate the side bar with infos 
        document.getElementById('js-select-drop2').addEventListener("change", function (e) {
            input = e.currentTarget.selectedOptions[0].attributes[0].value;
            return  fetch(`https://yazidmekhtoub.carto.com/api/v2/sql?format=geojson&q=SELECT * FROM schoolsparcels where name_facil Ilike '${input}'`)
            .then((resp) => resp.json())
            .then((response) => {
                geojsonLayer = L.geoJson(response)
                map.flyToBounds(geojsonLayer.getBounds());
                var featureData = response.features[0].properties;
                console.log(featureData);
      
                //**************sideBar Info of feature selected from the dropdown*************************
              
                var content = '<br><div class="schoolBox">'  
                content += '<h1><b>' + featureData['schoolname'] + '</b></h1><hr>'
                content += '<h3><b>Total Score: </b>' + featureData['totalscore'] + ' %</h3><hr>'
                // content += '<br><img src="' + featureData['photos'] + '"' +'>'
                content += '<h3><b>Village: </b>' + featureData['village'] + '</h3>'
                content += '<h3><b>Neighborhood: </b>' + featureData['neighborh'] + '</h3>'
                content += '<h3><b>Ownership: </b>' + featureData['ownership'] + '</h3>'
                content += '<h3><b>Square Area (m<sup>2</sup>) : </b>' + featureData['sm_area'] + '</h3>'
                content += '<h3><b>School Type: </b>' + featureData['type_schoo'] + '</h3>'
                content += '<h3><b>Number of Rooms: </b>' + featureData['num_room_1'] + '</h3>'
                content += '<h3><b>Student Population: </b>' + featureData['total_stud'] + '</h3>'
                content += '<h3><b>Student:Teacher Ratio: </b>' + featureData['stud_tea_r'] + '</h3>'
                content += '<h3><b>Water: </b>' + featureData['water'] + '</h3>'
                content += '<h3><b>Soap: </b>' + featureData['soap'] + '</h3>'
                content += '<h3><b>Meal program: </b>' + featureData['feedingpro'] + '</h3>'
                content += '<h3><b>Medical Equipment: </b>' + featureData['medical_eq'] + '</h3>'
                content += '<h3><b>Feminine Hygiene Products: </b>' + featureData['feminine_h'] + '</h3>'
                content += '<h3><b>2015 Tuition (KSh): </b>' + featureData['_2015_tuiti'] + '</h3>'
                content += '<h3><b>PlayGround: </b>' + featureData['playground'] + '</h3>'
                content += '<h3><b>Distance to Railroad (m): </b>' + featureData['raildist'] + '</h3>'
                content += '<h3><b>Distance to River (m): </b>' + featureData['riverdist'] + '</h3>'
                content += '<br><img src="' + featureData['photos'] + '"' +'>'
                content += '</div>'
                sidebar.innerHTML = content;
              
                // ****************this opens the sidebar when selected from dropdown****************
                document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
                document.getElementById("mySidenav").style.maxWidth = "460px";
                document.getElementById("openbtn").style.display = "none";
                document.getElementById("openBoundingBox").style.display = "none";
            })
        });




// ****************************** THIS ADDS Feature Content IN THE SIDEBAR WHEN FEATURE IS CLICKED *****************************************

     map.on("click", function(e) {
             var pixelPosition = e.layerPoint;
             var latLng = map.layerPointToLatLng(pixelPosition);
             console.log("LatLng = " + latLng);
          
             //**************sideBar Info of feature is clicked*********************
          
             var sidebar = document.querySelector('.sidebar-feature-content');
          
           layer.on('featureClicked', function (event) {
                var content = '<br><div class="schoolBox">'  
                content += '<h1><b>' + event.data['schoolname'] + '</b></h1><hr>'
                content += '<h3><b>Total Score: </b>' + event.data['totalscore'] + '</h3><hr>'
                // content += '<br><img src="' + event.data['photos'] + '"' +'>'
                content += '<h3><b>Village: </b>' + event.data['village'] + '</h3>'
                content += '<h3><b>Neighborhood: </b>' + event.data['neighborh'] + '</h3>'
                content += '<h3><b>Ownership: </b>' + event.data['ownership'] + '</h3>'
                content += '<h3><b>Square Area (m<sup>2</sup>) : </b>' + event.data['sm_area'] + '</h3>'
                content += '<h3><b>School Type: </b>' + event.data['type_schoo'] + '</h3>'
                content += '<h3><b>Number of Rooms: </b>' + event.data['num_room_1'] + '</h3>'
                content += '<h3><b>Student Population: </b>' + event.data['total_stud'] + '</h3>'
                content += '<h3><b>Student:Teacher Ratio: </b>' + event.data['stud_tea_r'] + '</h3>'
                content += '<h3><b>Water: </b>' + event.data['water'] + '</h3>'
                content += '<h3><b>Soap: </b>' + event.data['soap'] + '</h3>'
                content += '<h3><b>Meal program: </b>' + event.data['feedingpro'] + '</h3>'
                content += '<h3><b>Medical Equipment: </b>' + event.data['medical_eq'] + '</h3>'
                content += '<h3><b>Feminine Hygiene Products: </b>' + event.data['feminine_h'] + '</h3>'
                content += '<h3><b>2015 Tuition (KSh): </b>' + event.data['_2015_tuiti'] + '</h3>'
                content += '<h3><b>PlayGround: </b>' + event.data['playground'] + '</h3>'
                content += '<h3><b>Distance to Railroad (m): </b>' + event.data['raildist'] + '</h3>'
                content += '<h3><b>Distance to River (m): </b>' + event.data['riverdist'] + '</h3>'
                content += '</div>'
                sidebar.innerHTML = content;
                  // opening the sidebar 
                document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
                document.getElementById("mySidenav").style.maxWidth = "460px";
                document.getElementById("openbtn").style.display = "none";
                document.getElementById("openBoundingBox").style.display = "none";
                console.log("Zoom level: " + map.getZoom());
                map.setView([event.latLng.lat,event.latLng.lng], 18);
             });
     });
 
// ****************************** Ranking Slider*****************************

         var priceSlider = document.getElementById('price-slider');
              noUiSlider.create(priceSlider, {
              start: [35, 90],
              connect: true,

              range: {
                'min': 35,
                'max': 90
              },
              tooltips: [true, true]
          });

          priceSlider.noUiSlider.on('change', function () {
              var priceValues = priceSlider.noUiSlider.get();
           // this the SQL  to get the ranking value that exists as a column in Carto 
            // the IDs of the schools in the Cato data sets are similar to those in the school's array down below ( in Carto it is “id” in schools array is “ ID”)
            // I'm wondering if there is a way to update or get the scores upon the ranking submission 
            // the slider is actually polling values from Carto. I want to be able to pull the values from the recent ranking order. 
            // IF IT CAN be done please let me know if there any way to display the values of a users' ranking order in the map. 
            // or any other way I can link the recent ranking order to show in the map.
            // I hope this will make sense to you and let me know if I can clarify anything

              source.setQuery('SELECT * FROM schoolsparcels WHERE totalscore >= ' + priceValues[0] + ' AND totalscore  <= ' + priceValues[1]);
          });


// ********************************** This opens the sidebar ************************************

  
    var element = document.getElementById('openbtn');
      element.onclick = function () { 
        console.log('OPENED  by javascript'); 
        document.getElementById("mySidenav").style.width = "calc(100vw - 42px)";
        document.getElementById("mySidenav").style.maxWidth = "460px";
        document.getElementById("openbtn").style.display = "none";
        document.getElementById("openBoundingBox").style.display = "none";
        document.getElementById("price-slider").style.display = "bolck";
        map.setView([-1.311829, 36.883771], 15);
    };

    // this closes the sidebar
    var element = document.getElementById('closebtn');
    element.onclick = function () {
      console.log("this was closed");
      document.getElementById("mySidenav").style.width = "0";
      document.getElementById("openbtn").style.display = "block";
      document.getElementById("openBoundingBox").style.display = "block";
      map.setView([-1.311829, 36.878771], 15);
      sidebar.innerHTML = ' ';
    
    };


      

// ************************************ The Enter BUTTON ******************************************

 var enterButton = document.querySelector('.enter-screen');

// Button eventlistener 
   enterButton.addEventListener('click', function (e) {
   console.log('Zoom Level: ' + map.getZoom());
   console.log('Button was clicked');
           map.flyTo([-1.311829, 36.878771], 15, {

               animate: true,
               duration: 3,
            });
   document.querySelector('.enter-text').style.display = "none";
   document.querySelector('.enter-screen').style.display = "none";
   map.removeLayer(geojson);
  
  });




// ********************************* COLLAPSIBLE DIV **************************************

let myLabels = document.querySelectorAll('.lbl-toggle');

    Array.from(myLabels).forEach(label => {
        label.addEventListener('keydown', e => {
           if (e.which === 32 || e.which === 13) {
              e.preventDefault();
              label.click();
           };
        });
    });





// ****************************************************************************************
// ******************* THIS IS THE JAVASCRIPT FOR FOR THE RANKING *************************
// **************************** FROM 511 T0 LINES 2453*************************************

const schools= [
  {
    "ID": "1",
    "SchoolName": "Arch of peace school",
    "Village": "vietnam",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "3",
    "SchoolName": "Basics Academy",
    "Village": "moto",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
   
  },
  {
    "ID": "4",
    "SchoolName": "Bethreham learning centre",
    "Village": "railway",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "5",
    "SchoolName": "Better Life community school",
    "Village": "rorie",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "6",
    "SchoolName": "Brains foundation center",
    "Village": "vietnam",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "7",
    "SchoolName": "Bridge academy",
    "Village": "vietnam",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "8",
    "SchoolName": "Bridge international school",
    "Village": "rorie",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
 
  },
  {
    "ID": "9",
    "SchoolName": "Brige intentional acedemy primary school",
    "Village": "lungaCe ",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "61-90min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "10",
    "SchoolName": "Bridge accademy",
    "Village": "sinaiB",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "11",
    "SchoolName": "Bridge international school",
    "Village": "riara",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
  
  },
  {
    "ID": "12",
    "SchoolName": "Bright angels primary school",
    "Village": "riara",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "13",
    "SchoolName": "Bright Brain Community",
    "Village": "moto",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "14",
    "SchoolName": "Bright Shepherd Education Center",
    "Village": "moto",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "15",
    "SchoolName": "Bright star academy",
    "Village": "railway",
    "TotalstudNum": "more300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
  
  },
  {
    "ID": "16",
    "SchoolName": "Brilliant sharpening community school",
    "Village": "lungaCe ",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "17",
    "SchoolName": "Britons community school",
    "Village": "riara",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "18",
    "SchoolName": "Busara education centre",
    "Village": "riara",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "19",
    "SchoolName": "By faith Junior Academy",
    "Village": "moto",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "20",
    "SchoolName": "Carson academy",
    "Village": "vietnam",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "21",
    "SchoolName": "Central Goal Educational Centre",
    "Village": "sisal",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "23",
    "SchoolName": "Corpus Christ Special School",
    "Village": "sisal",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
   
  },
  {
    "ID": "24",
    "SchoolName": "Damasca",
    "Village": "riara",
    "TotalstudNum": "100-199stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "27",
    "SchoolName": "Destiny primary school",
    "Village": "riara",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "29",
    "SchoolName": "Fadhili",
    "Village": "riara",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "30",
    "SchoolName": "FRIENDS ",
    "Village": "donholm",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
   
  },
  {
    "ID": "31",
    "SchoolName": "Gatoto primary school",
    "Village": "gatope",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "32",
    "SchoolName": "General Progressive School",
    "Village": "moto",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "33",
    "SchoolName": "Glacotoi learning centre",
    "Village": "rorie",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "36",
    "SchoolName": "Goshen golden school",
    "Village": "zone48",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
   
  },
  {
    "ID": "37",
    "SchoolName": "Grame joy pre primary",
    "Village": "wape",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
  
  },
  {
    "ID": "38",
    "SchoolName": "Green shade education center",
    "Village": "railway",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "40",
    "SchoolName": "Happy promotion",
    "Village": "milimani",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "44",
    "SchoolName": "Hope Gateway School",
    "Village": "sinaiA",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "45",
    "SchoolName": "Hope  junior center\r\n",
    "Village": "wape",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "46",
    "SchoolName": "Hossana",
    "Village": "zone48",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "47",
    "SchoolName": "House of God prayers education centre",
    "Village": "railway",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "49",
    "SchoolName": "Johphen primary",
    "Village": "zone48",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "52",
    "SchoolName": "Kings Education Centre",
    "Village": "sinaiA",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "53",
    "SchoolName": "Kwa njega primary school",
    "Village": "milimani",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "54",
    "SchoolName": "Limmosy",
    "Village": "mombasa",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "55",
    "SchoolName": "Little Angels Community School",
    "Village": "sisal",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "56",
    "SchoolName": "Little Bells Community Education Centre",
    "Village": "kingstone",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "57",
    "SchoolName": "Lumber primary school",
    "Village": "kosovo",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "58",
    "SchoolName": "Maendeleo learning centre",
    "Village": "rorie",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "61",
    "SchoolName": "Mara Children Centre",
    "Village": "donholm",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "63",
    "SchoolName": "Mukuru menno",
    "Village": "rorie",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "64",
    "SchoolName": "Muruku talent education centre ",
    "Village": "railway",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "66",
    "SchoolName": "Mwanzo academy",
    "Village": "wape",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "70",
    "SchoolName": "Nissi community school",
    "Village": "vietnam",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "71",
    "SchoolName": "Our Lady of Nazareth",
    "Village": "sisal",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "72",
    "SchoolName": "Oxford academy",
    "Village": "zone48",
    "TotalstudNum": "more300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "73",
    "SchoolName": "Pcea elite care centre lungs lunga",
    "Village": "milimani",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "75",
    "SchoolName": "Penyvore",
    "Village": "moto",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "76",
    "SchoolName": "Precious junior",
    "Village": "kingstone",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "77",
    "SchoolName": "Pro labore dei school",
    "Village": "lungaCe ",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "78",
    "SchoolName": "Rapture community school",
    "Village": "vietnam",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "79",
    "SchoolName": "Refaco Garden learning Centre",
    "Village": "sinaiB",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "80",
    "SchoolName": "Rejoice education centre",
    "Village": "feedChild ",
    "TotalstudNum": "200-300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "81",
    "SchoolName": "Reuben Baptist primary school",
    "Village": "rorie",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "84",
    "SchoolName": "Rofez Community School",
    "Village": "sisal",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "87",
    "SchoolName": "Shalom achievers educational centre",
    "Village": "rorie",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "88",
    "SchoolName": "Shalom Community Centre School",
    "Village": "sisal",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "92",
    "SchoolName": "Sky hike",
    "Village": "vietnam",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro":"NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "93",
    "SchoolName": "St austine",
    "Village": "riara",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "94",
    "SchoolName": "St Elizabeth xaviour school",
    "Village": "wape",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "98",
    "SchoolName": "St florence Reuben centre",
    "Village": "rorie",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "99",
    "SchoolName": "St james academy",
    "Village": "wape",
    "TotalstudNum": "more300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "102",
    "SchoolName": "St Teresa academy",
    "Village": "wape",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "103",
    "SchoolName": "Star of hope",
    "Village": "lungaCe ",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "105",
    "SchoolName": "Stevens intrergreted school",
    "Village": "gateway",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "106",
    "SchoolName": "Tammy agape learning centre",
    "Village": "gateway",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "107",
    "SchoolName": "Taqwa bright academy",
    "Village": "zone48",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "109",
    "SchoolName": "Centre of wisdom",
    "Village": "milimani",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "110",
    "SchoolName": "The king david",
    "Village": "riara",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
   
  },
  {
    "ID": "114",
    "SchoolName": "UtuWema Community Resources Center",
    "Village": "moto",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "115",
    "SchoolName": "Utu wema community school",
    "Village": "sinaiA",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "116",
    "SchoolName": "Victory (Education center)",
    "Village": "riara",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "118",
    "SchoolName": "Winners education centre",
    "Village": "rorie",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1002",
    "SchoolName": "Imara Daima Adventist",
    "Village": "moto",
    "TotalstudNum": "more300stud",
    "roomNum": "more30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "more90min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "1003",
    "SchoolName": "Lunga lunga SDA Educational Centre",
    "Village": "kingstone",
    "TotalstudNum": "more300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1004",
    "SchoolName": "Neema vineyard complex",
    "Village": "zone48",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1005",
    "SchoolName": "Ruben junior primary",
    "Village": "donholm",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1006",
    "SchoolName": "Sent John community",
    "Village": "gateway",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "noneAvailable",
   
  },
  {
    "ID": "1008",
    "SchoolName": "Used community centre",
    "Village": "kosovo",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1010",
    "SchoolName": "Highscore",
    "Village": "mombasa",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min ",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "1011",
    "SchoolName": "Emanuel",
    "Village": "riara",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1012",
    "SchoolName": "Neema community rehabition programme shg",
    "Village": "lungaCe ",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1013",
    "SchoolName": "Helicopter Education Centre",
    "Village": "kosovo",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1014",
    "SchoolName": "St aloys school",
    "Village": "gateway",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1015",
    "SchoolName": "Gt",
    "Village": "rorie",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1016",
    "SchoolName": "Piaget preparatory school",
    "Village": "vietnam",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "nullAavailable",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "1017",
    "SchoolName": "Harvad juniour school",
    "Village": "zone48",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1018",
    "SchoolName": "Embakasi academy",
    "Village": "vietnam",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "1-10students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1019",
    "SchoolName": "Greenhill academy",
    "Village": "moto",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1020",
    "SchoolName": "The Farrel Jovial Education Centre",
    "Village": "sinaiB",
    "TotalstudNum": "less100stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1021",
    "SchoolName": "Brains Wealth School",
    "Village": "lungaCe ",
    "TotalstudNum": "less100stud",
    "roomNum": "less10room",
    "StudentTeacherR": "less10perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "61-90min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1022",
    "SchoolName": "Benpol intergreted education centre",
    "Village": "railway",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "21-40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "onlySoap",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "1023",
    "SchoolName": "Brain House Community School",
    "Village": "gateway",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1024",
    "SchoolName": "Ruben vision community learning centre",
    "Village": "rorie",
    "TotalstudNum": "100-199stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "1StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "1025",
    "SchoolName": "Bright Shepherd Education Centre",
    "Village": "zone48",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1026",
    "SchoolName": "Should of Genius",
    "Village": "donholm",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "11-20students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "hygiOnly",
    
  },
  {
    "ID": "1027",
    "SchoolName": "Bridge international",
    "Village": "milimani",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
   
  },
  {
    "ID": "1028",
    "SchoolName": "Chachas Education center",
    "Village": "wape",
    "TotalstudNum": "100-199stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "0-100KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1029",
    "SchoolName": "Kwa Njenga Baptist",
    "Village": "milimani",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min ",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "onlyWater",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1030",
    "SchoolName": "By faith learning centre",
    "Village": "kosovo",
    "TotalstudNum": "200-300stud",
    "roomNum": "10-19room",
    "StudentTeacherR": "10-19perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  {
    "ID": "1031",
    "SchoolName": "Kids care",
    "Village": "vietnam",
    "TotalstudNum": "200-300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "501-1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "NonAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "noneAvailable",
    
  },
  {
    "ID": "1032",
    "SchoolName": "Church on the rock learning center",
    "Village": "rorie",
    "TotalstudNum": "more300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "30-40perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "AllAvailable",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1033",
    "SchoolName": "Merry Cliff Junior School",
    "Village": "moto",
    "TotalstudNum": "more300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "4StuPerDesk",
    "PercTuitIncrease": "11-20Percent",
    "FeesCost": "101-500KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "fedOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1034",
    "SchoolName": "Bridge international academy",
    "Village": "uchumi",
    "TotalstudNum": "more300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "31-40students",
    "StuDeskRio": "3StuPerDesk",
    "PercTuitIncrease": "0-10Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "30-60min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "bothAvailable",
    
  },
  {
    "ID": "1035",
    "SchoolName": "Twinstar Learner's Center",
    "Village": "moto",
    "TotalstudNum": "more300stud",
    "roomNum": "20-30room",
    "StudentTeacherR": "20-29perTeacher",
    "StudPerClass": "21-30students",
    "StuDeskRio": "2StuPerDesk",
    "PercTuitIncrease": "more40Percent",
    "FeesCost": "more1000KSh",
    "TravelTime": "less30min",
    "FedPlayGro": "playGroOnly",
    "WaterSoap": "WaSoAavailable",
    "MedHygiProEqui": "medicOnly",
    
  },
  ];

function getValue(){
   var WTotalstudNum = document.getElementById('weig1').value;
   var WroomNum=document.getElementById('weig2').value;
   var WStudentTeacherR = document.getElementById('weig3').value;
   var WStudPerClass = document.getElementById('weig4').value;
   var WStuDeskRio = document.getElementById('weig5').value;
   var WPercTuitIncrease = document.getElementById('weig6').value;
   var WFeesCost = document.getElementById('weig7').value;
   var WTravelTime = document.getElementById('weig8').value;
   var WFedPlayGro = document.getElementById('weig9').value;
   var WWaterSoap = document.getElementById('weig10').value;
   var WMedHygiProEqui = document.getElementById('weig11').value;
  
   
                   for(var i = 0; i < schools.length; i++) {
                         var RTotalstudNum= document.getElementById(schools[i].TotalstudNum).value;
                         var STotalstudNum = WTotalstudNum * (1-(RTotalstudNum-1)*0.25);

                         var RroomNum= document.getElementById(schools[i].roomNum).value;
                         var SroomNum = WroomNum * (1-(RroomNum-1)*0.25);

                         var RStudentTeacherR= document.getElementById(schools[i].StudentTeacherR).value;
                         var SStudentTeacherR = WStudentTeacherR * (1-(RStudentTeacherR-1)*0.25);

                         var RStudPerClass= document.getElementById(schools[i].StudPerClass).value;
                         var SStudPerClass = WStudPerClass * (1-(RStudPerClass-1)*0.25);

                         var RStuDeskRio= document.getElementById(schools[i].StuDeskRio).value;
                         var SStuDeskRio = WStuDeskRio * (1-(RStuDeskRio-1)*0.25);

                         var RPercTuitIncrease= document.getElementById(schools[i].PercTuitIncrease).value;
                         var SPercTuitIncrease = WPercTuitIncrease * (1-(RPercTuitIncrease-1)*0.25);

                         var RFeesCost= document.getElementById(schools[i].FeesCost).value;
                         var SFeesCost = WFeesCost * (1-(RFeesCost-1)*0.25);

                         var RFedPlayGro= document.getElementById(schools[i].FedPlayGro).value;
                         var SFedPlayGro = WFedPlayGro * (1-(RFedPlayGro-1)*0.25);

                         var RWaterSoap= document.getElementById(schools[i].WaterSoap).value;
                         var SWaterSoap = WWaterSoap * (1-(RWaterSoap-1)*0.25);

                         var RMedHygiProEqui= document.getElementById(schools[i].MedHygiProEqui).value;
                         var SMedHygiProEqui = WMedHygiProEqui * (1-(RMedHygiProEqui-1)*0.25);

                         schools[i].totalscore= STotalstudNum + SroomNum + SStudentTeacherR +SStudPerClass +  SStuDeskRio + 
                                                SPercTuitIncrease + SFeesCost + SFedPlayGro + SWaterSoap + SMedHygiProEqui 
                    }
  
              //sort the object based on the hightest object 
               schools.sort(compare);
 
 
                       var outputString = "";
                       for (var i=0; i < schools.length; i++) {
                           outputString +=  schools[i].ID +" The score of  <b>" +schools[i].SchoolName + "</b>  is  " + schools[i].totalscore   + "<BR><BR>\n";
                       }
                           console.log( outputString)

                           document.getElementById("results").innerHTML = outputString; 
 
  }
 
  function compare(a,b) {
        if (b.totalscore < a.totalscore)
          return -1;
        if (b.totalscore > a.totalscore)
          return 1;
        return 0;
  }








