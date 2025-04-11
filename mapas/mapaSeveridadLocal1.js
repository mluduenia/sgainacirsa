var myLatlng = new google.maps.LatLng(-31,-64);


var gmap1Map = new google.maps.Map(document.getElementById('gmap1'), {
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false,
  mapTypeId: google.maps.MapTypeId.HYBRID//,maxZoom: 12

});

var view1 = new ol.View({
  maxZoom: 21
});
view1.on('change:center', function() {
  var center = ol.proj.transform(view1.getCenter(), 'EPSG:3857', 'EPSG:4326');
  gmap1Map.setCenter(new google.maps.LatLng(center[1], center[0]));
});
view1.on('change:resolution', function() {
  gmap1Map.setZoom(view1.getZoom());
});

var format = 'image/png';
var bounds = [-65.2292861938477, -33.3717765808105,
              -63.8249664306641, -30.8809452056885];

var pDateSelected = document.getElementById('frmMapa:idCalendarSelection_input').value;

var untiled1 = new ol.layer.Image({
	
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: wmsLocation,
          params: {'FORMAT': format, viewparams:'p_intervalo:1;p_fecha:' + pDateSelected ,
                   'VERSION': '1.1.1',  
                LAYERS: 'wspCirsa:sgaViewSeveridadLocal',
                STYLES: '',
          }
        })
      });


var untiledDrenaje1 = new ol.layer.Image({
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
      


var olMapDiv1 = document.getElementById('olmap1');

 
//controls: ol.control.defaults({attribution: false}).extend([mousePositionControl]),
var controls1 = ol.control.defaults({rotate: false}); 
var map1 = new ol.Map({
	controls:controls1,
  layers: [untiled1,untiledDrenaje1],
  interactions: ol.interaction.defaults({
    altShiftDragRotate: false,
    dragPan: false,
    rotate: false
 }).extend([new ol.interaction.DragPan({kinetic: null})]),
  target: olMapDiv1,
  view: view1
});


// al cambiar la resolición actualizar el div de resolución
map1.getView().on('change:resolution', function(evt) {
        var resolution = evt.target.get('resolution');
        var units = map1.getView().getProjection().getUnits();
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
        document.getElementById('scale1').innerHTML = "Escala = 1 : " + scale;
      });


 // centro en lago carlos paz
map1.getView().setCenter(ol.proj.transform([-64.46640,-31.38107], 'EPSG:4326', 'EPSG:3857'));
map1.getView().setZoom(10);

olMapDiv1.parentNode.removeChild(olMapDiv1);
gmap1Map.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv1);





