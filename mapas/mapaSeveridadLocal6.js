var myLatlng = new google.maps.LatLng(-31,-64);

var gmap6Map = new google.maps.Map(document.getElementById('gmap6'), {
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false,
  mapTypeId: google.maps.MapTypeId.HYBRID,
  rotateControl:false

});

var view6 = new ol.View({
  maxZoom: 21
});
view6.on('change:center', function() {
  var center = ol.proj.transform(view6.getCenter(), 'EPSG:3857', 'EPSG:4326');
  gmap6Map.setCenter(new google.maps.LatLng(center[1], center[0]));
});
view6.on('change:resolution', function() {
  gmap6Map.setZoom(view6.getZoom());
});

var format = 'image/png';
var bounds = [-65.2292861938477, -33.3717765808105,
              -63.8249664306641, -30.8809452056885];

var untiled6 = new ol.layer.Image({
	
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: wmsLocation,
          params: {'FORMAT': format,viewparams:'p_intervalo:6;p_fecha:' + pDateSelected ,
                   'VERSION': '1.1.1',  
                LAYERS: 'wspCirsa:sgaViewSeveridadLocal',
                STYLES: '',
          }
        })
      });



      
var olMapDiv6 = document.getElementById('olmap6');


var controls6 = ol.control.defaults({rotate: false}); 
var map6 = new ol.Map({
	 controls:controls6,
  layers: [untiled6,untiledDrenaje1],
  interactions: ol.interaction.defaults({
    altShiftDragRotate: false,
    dragPan: false,
    rotate: false
 }).extend([new ol.interaction.DragPan({kinetic: null})]),
  target: olMapDiv6,
  view: view6
});

// al cambiar la resolición actualizar el div de resolución
map6.getView().on('change:resolution', function(evt) {
        var resolution = evt.target.get('resolution');
        var units = map6.getView().getProjection().getUnits();
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
        document.getElementById('scale6').innerHTML = "Escala = 1 : " + scale;
      });


 // centro en lago carlos paz
map6.getView().setCenter(ol.proj.transform([-64.46640,-31.38107], 'EPSG:4326', 'EPSG:3857'));
map6.getView().setZoom(10);

olMapDiv6.parentNode.removeChild(olMapDiv6);
gmap6Map.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv6);
