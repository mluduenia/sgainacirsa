var myLatlng = new google.maps.LatLng(-31,-64);

var gmap = new google.maps.Map(document.getElementById('gmap'), {
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: true,
  streetViewControl: false,
  mapTypeId: google.maps.MapTypeId.HYBRID

});

var view = new ol.View({ 
  maxZoom: 21
});
view.on('change:center', function() {
  var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
  gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
});

view.on('change:resolution', function() {
  gmap.setZoom(view.getZoom());
});

var format = 'image/png';
var bounds = [-65.2292861938477, -33.3717765808105,
              -63.8249664306641, -30.8809452056885];

var pDateSelected = document.getElementById('frmMapa:idCalendarSelection_input').value;


var untiled = new ol.layer.Image({
    source: new ol.source.ImageWMS({
      ratio: 1,
      url: wmsLocation,
      params: {'FORMAT': format, viewparams:'p_ventana:24;p_fecha:' + pDateSelected ,
               'VERSION': '1.1.1',  
            LAYERS: 'wspCirsa:sgaViewDWData24hpmpColor',
            STYLES: '',
      }
    })
  });
  
  var untiledDrenaje = new ol.layer.Image({
		maxResolution: 136000,
	        source: new ol.source.ImageWMS({
	          ratio: 1,
	          url: wmsLocation,
	          params: {'FORMAT': format,viewparams:'p_fecha:' + pDateSelected,
	                   'VERSION': '1.1.1',  
	                LAYERS: 'wspCirsa:sgaViewDrenajeSeveridadLocal',
	                STYLES: '',
	          }
	        })
	      });
	      
      
	
var olMapDiv = document.getElementById('olmap');

 

var controls = ol.control.defaults({rotate: false}); 
var map = new ol.Map({
	controls:controls,
  layers: [untiled,untiledDrenaje],
  interactions: ol.interaction.defaults({
    altShiftDragRotate: false,
    dragPan: false,
    rotate: false
 }).extend([new ol.interaction.DragPan({kinetic: null})]),
  target: olMapDiv,
  view: view
});


// al cambiar la resolución actualizar el div de resolución
map.getView().on('change:resolution', function(evt) {
        var resolution = evt.target.get('resolution');
        var units = map.getView().getProjection().getUnits();
        var dpi = 25.4 / 0.28;
        var mpu = ol.proj.Units.METERS_PER_UNIT[units];
        var scale = resolution * mpu * 39.37 * dpi;
        if (scale >= 9500 && scale <= 950000) {
          scale = Math.round(scale / 1000) + "K";
        } else if (scale >= 950000) {
          scale = Math.round(scale / 1000000) + "M";
        } else {
          scale = Math.round(scale);
        }
        document.getElementById('scale').innerHTML = "Escala = 1 : " + scale;
      });


 // centro en lago carlos paz
map.getView().setCenter(ol.proj.transform([-64.46640,-31.38107], 'EPSG:4326', 'EPSG:3857'));
map.getView().setZoom(10);

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);