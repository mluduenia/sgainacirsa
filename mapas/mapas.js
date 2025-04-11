var myLatlng = new google.maps.LatLng(-31, -64);

var gmap = new google.maps.Map(document.getElementById('gmap'), {
	disableDefaultUI : true,
	keyboardShortcuts : false,
	draggable : false,
	disableDoubleClickZoom : true,
	scrollwheel : true,
	streetViewControl : false,
	mapTypeId : google.maps.MapTypeId.HYBRID,
	rotateControl : false

});

var view = new ol.View({
	maxZoom : 21
});

view.on('change:center', function() {
	var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
	gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
});
view.on('change:resolution', function() {
	gmap.setZoom(view.getZoom());
});

var format = 'image/png';
var bounds = [ -65.2292861938477, -33.3717765808105, -63.8249664306641, -30.8809452056885 ];

// geolocalization
var geolocation = new ol.Geolocation({
	projection : view.getProjection()
});

// handle geolocation error.
geolocation.on('error', function(error) {
	var info = document.getElementById('info');
	if (error.code == 1) {
		info.innerHTML = '(El navegador web no tiene permiso para mostrar su geolocalización.)';
	} else {
		// info.innerHTML = error.code + '-' + error.message;
		info.innerHTML = '(El sitema no ha podido resolver su geolocalización para mostrar en el mapa.)';

	}
	// si el codigo es 1 entonces el usuario no permite la geolocalizacion
	info.style.display = '';
});

var positionFeature = new ol.Feature();
geolocation.setTracking(true);
geolocation.changed();

var coordinates = geolocation.getPosition();
positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);

var geolocLayer = new ol.layer.Image({
	visible : false,
	source : new ol.source.ImageWMS({
		ratio : 1,
		url : wmsLocation,
		params : {
			'FORMAT' : format,
			viewparams : 'p_lat:0;p_lon:0',
			'VERSION' : '1.1.1',
			LAYERS : 'wspCirsa:sgaViewLocUser',
			STYLES : '',
		}
	})
});

var check = true;

geolocation.on('change:position', function() {
	coordinates = geolocation.getPosition();

	if (check) {
		check = false;
		// actualizar capa de alerta
		var viewparams = [ 'p_lat:' + coordinates[0], 'p_lon:' + coordinates[1] ];
		geolocLayer.set('visible', true);
		var source = geolocLayer.getSource();
		var params = source.getParams();
		params.viewparams = viewparams.join(';');
		source.updateParams(params);
	}

	positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

var geoLayer = new ol.layer.Vector({
	source : new ol.source.Vector({
		features : [ positionFeature ]
	})
});

var sourceEstaciones = new ol.source.ImageWMS({
	ratio : 1,
	url : wmsLocation,
	params : {
		'FORMAT' : format,
		'VERSION' : '1.1.1',
		LAYERS : 'wspCirsa:sgaViewEstaciones',
		STYLES : ''
	}
})
var estacionesLayer = new ol.layer.Image({
	source : sourceEstaciones
});

var sourceCuencas = new ol.source.ImageWMS({
	ratio : 1,
	url : wmsLocation,
	params : {
		'FORMAT' : format,
		'VERSION' : '1.1.1',
		LAYERS : 'wspCirsa:sgaViewAlertasCuencas',
		STYLES : '',
	}
})

var cuencasLayer = new ol.layer.Image({
	maxResolution : 136000,
	source : sourceCuencas
});

var sourceDrenaje = new ol.source.ImageWMS({
	ratio : 1,
	url : wmsLocation,
	params : {
		'FORMAT' : format,
		'VERSION' : '1.1.1',
		LAYERS : 'wspCirsa:sgaViewSADrenaje',
		STYLES : '',
	}
});

var drenajeLayer = new ol.layer.Image({
	maxResolution : 136000,
	source : sourceDrenaje
});

var olMapDiv = document.getElementById('olmap');

var controls = ol.control.defaults({
	rotate : false
});
var map = new ol.Map({
	controls : controls,
	layers : [ cuencasLayer, estacionesLayer, drenajeLayer, geolocLayer ],
	interactions : ol.interaction.defaults({
		altShiftDragRotate : false,
		dragPan : false,
		rotate : false,
		pinchRotate : false
	}).extend([ new ol.interaction.DragPan({
		kinetic : null
	}) ]),
	target : olMapDiv,
	view : view
});

// al cambiar la resolición actualizar el div de resolución
map.getView().on('change:resolution', function(evt) {
	var resolution = evt.target.get('resolution');
	var units = map.getView().getProjection().getUnits();
	var dpi = 25.4 / 0.28;
	//var mpu = ol.proj.METERS_PER_UNIT[units];
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

positionFeature.setStyle(new ol.style.Style({
	image : new ol.style.Circle({
		radius : 8,
		fill : new ol.style.Fill({
			color : '#606060'
		}),
		stroke : new ol.style.Stroke({
			color : '#fff',
			width : 2
		})
	}),
	text : new ol.style.Text({
		text : '',
		fill : new ol.style.Fill({
			color : 'white'
		}),
		stroke : new ol.style.Stroke({
			color : 'black',
			width : 1
		}),
		scale : 1.3,
		offsetX : -20,
		offsetY : 20
	})
}));

// centro en lago carlos paz
map.getView().setCenter(ol.proj.transform([ -64.46640, -31.38107 ], 'EPSG:4326', 'EPSG:3857'));
map.getView().setZoom(10);

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);