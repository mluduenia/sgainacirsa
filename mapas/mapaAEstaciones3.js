var myLatlng = new google.maps.LatLng(-31,-64);

var gmap3Map = new google.maps.Map(document.getElementById('gmap3'), {
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false,
  mapTypeId: google.maps.MapTypeId.HYBRID//,maxZoom: 12

});

var view3 = new ol.View({
  maxZoom: 21
});

view3.on('change:center', function() {
  var center = ol.proj.transform(view3.getCenter(), 'EPSG:3857', 'EPSG:4326');
  gmap3Map.setCenter(new google.maps.LatLng(center[1], center[0]));
});
view3.on('change:resolution', function() {
  gmap3Map.setZoom(view3.getZoom());
});

var format = 'image/png';
var bounds = [-65.2292861938477, -33.3717765808105,
              -63.8249664306641, -30.8809452056885];


var untiled3 = new ol.layer.Image({
	
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: wmsLocation,
          params: {'FORMAT': format,viewparams:'p_intervalo:3',
                   'VERSION': '1.1.1',  
                LAYERS: 'wspCirsa:sgaViewSeveridadLocalLast',
                STYLES: '',
          }
        })
      });


      
var olMapDiv3 = document.getElementById('olmap3');

var controls3 = ol.control.defaults({rotate: false}); 
var map3 = new ol.Map({
	 controls:controls3,
  layers: [untiled3,untiledDrenaje],
  interactions: ol.interaction.defaults({
    altShiftDragRotate: false,
    dragPan: false,
    rotate: false
 }).extend([new ol.interaction.DragPan({kinetic: null})]),
  target: olMapDiv3,
  view: view3
});



// al cambiar la resolición actualizar el div de resolución
map3.getView().on('change:resolution', function(evt) {
        var resolution = evt.target.get('resolution');
        var units = map3.getView().getProjection().getUnits();
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
        document.getElementById('scale3').innerHTML = "Escala = 1 : " + scale;
      });


 // centro en lago carlos paz
map3.getView().setCenter(ol.proj.transform([-64.46640,-31.38107], 'EPSG:4326', 'EPSG:3857'));
map3.getView().setZoom(10);

olMapDiv3.parentNode.removeChild(olMapDiv3);
gmap3Map.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv3);
