var myLatlng = new google.maps.LatLng(-31, -64);

var gmap = new google.maps.Map(document.getElementById('gmap'), {
	disableDefaultUI : true,
	keyboardShortcuts : false,
	draggable : false,
	disableDoubleClickZoom : true,
	scrollwheel : true,
	streetViewControl : false,
	mapTypeId : google.maps.MapTypeId.HYBRID

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

var pDateSelected = document.getElementById('frmMapa:idCalendarSelection_input').value;
var sourcesLluvia = {};
var sourcesDrenaje = {};

var untiled = new ol.layer.Image({
	source : new ol.source.ImageWMS({
		ratio : 1,
		url : wmsLocation,
		params : {
			'FORMAT' : format,
			viewparams : 'p_fecha:' + pDateSelected,
			'VERSION' : '1.1.1',
			LAYERS : 'wspCirsa:sgaViewDWDataIntervalo',
			STYLES : '',
		}
	})
});

var untiledDrenaje = new ol.layer.Image({
	maxResolution : 136000,
	source : new ol.source.ImageWMS({
		ratio : 1,
		url : wmsLocation,
		params : {
			'FORMAT' : format,
			viewparams : 'p_fecha:' + pDateSelected,
			'VERSION' : '1.1.1',
			LAYERS : 'wspCirsa:sgaViewDrenajeSeveridadLocal',
			STYLES : '',
		}
	})
});

// de api radares, bounds:point2_long,point2_lat,point1_long,point1_lat
/*
 * { "code": "RMA1", "title": "Cordoba", "description": "Radar RMA1", "center_lat": "-31.44138889", "center_long": "-64.19194444", "img_radio": 240, "point1_lat": "-29.2802255600", "point1_long":
 * "-61.6401794100", "point2_lat": "-33.5784708300", "point2_long": "-66.7436605900", "order": 16 },
 */

var boundsRadar = [ -66.7436605900, -33.5784708300, -61.6401794100, -29.2802255600 ];
var extentRadar = ol.proj.transformExtent(boundsRadar, 'EPSG:4326', 'EPSG:3857');


var radarLayer = new ol.layer.Image({
	source : new ol.source.ImageStatic({
		url : urlEmpty,
		imageExtent : extentRadar
	})
});

var centerRadar = [ parseFloat(-64.19194444), parseFloat(-31.44138889) ];
// var radioRadar=1000 * parseInt(radar.img_radio);
var radioRadar = 282000;

var circle = new ol.geom.Circle(ol.proj.transform(centerRadar, 'EPSG:4326', 'EPSG:3857'), radioRadar);
var circleFeature = new ol.Feature(circle);

var marker = new ol.Feature({
	geometry : new ol.geom.Point(ol.proj.transform([ 16.9071388, 52.4901917 ], 'EPSG:4326', 'EPSG:3857')),
});

var startDate = moment(pDateSelected, 'DD/MM/YYYY HH:mm').add(-3, 'hours').floor(10, 'minutes');
var maxDate = moment(pDateSelected, 'DD/MM/YYYY HH:mm');

var animationId = null;

function updateInfo() {
	var el = document.getElementById('infofecha');
	var txtActualizado = startDate.format('DD/MM/YYYY HH:mm');
	el.innerHTML = txtActualizado;
}

function changeStartDate() {
	maxDate = moment(PF('wvCalendarSelection').getDate()).floor(10, 'minutes');
	if (maxDate > new Date()) {
		PF('wvCalendarSelection').setDate(new Date());
		maxDate = moment(PF('wvCalendarSelection').getDate()).floor(10, 'minutes');

	}
	var hsSel = PF('wvSelHoras').getJQ().find(':selected').val();
	var timestamp_to = maxDate;
	var timestamp_from = moment(maxDate).add(-1 * hsSel, 'hours');
	startDate = timestamp_from;
	search_images('RMA1', 'TH', timestamp_from, timestamp_to);
}

var lastImage = urlEmpty;
function updateTimeAndImage() {

	var hsSel = PF('wvSelHoras').getJQ().find(':selected').val();
	startDate.add(10, 'minutes');

	if (startDate > maxDate) {
		lastImage = urlEmpty;
		startDate.add(-1 * hsSel, 'hours');
	}

	var moment_date = moment(startDate);
	var date_formatted = moment_date.format("DD/MM/YYYY-HH:mm");
	var urlImage;
	var texto;

	if (sources && sources["RMA1"] && sources["RMA1"]["TH"] && sources["RMA1"]["TH"][date_formatted]) {
		urlImage = sources["RMA1"]["TH"][date_formatted];
		lastImage = urlImage;
		// texto = date_formatted + " -> Imagen: " + urlImage;
	} else {
		urlImage = lastImage;
		// texto = date_formatted + " -> No hay imagen para la fecha/hora. ";
	}

	// document.getElementById('infoimagen').innerHTML = texto;

	var source = new ol.source.ImageStatic({
		url : urlImage,
		imageExtent : extentRadar
	});

	radarLayer.setSource(source);
	updateInfo();

	// TODO también cada 10 minutos la capa de precip.acumulada 5/01/2020 16:02
	var date_formatted_sga = moment_date.format("DD/MM/YYYY HH:mm");
	loadSources(date_formatted_sga);

}

var stop = function() {
	if (animationId !== null) {
		window.clearInterval(animationId);
		animationId = null;
	}
};

var play = function() {
	stop();
	animationId = window.setInterval(updateTimeAndImage, 5000);
};

function changeRate(milis) {
	stop();
	animationId = window.setInterval(updateTimeAndImage, milis);
}
// common
var olMapDiv = document.getElementById('olmap');
var controls = ol.control.defaults({
	rotate : false
});
var map = new ol.Map({
	controls : controls,
	layers : [ radarLayer, untiledDrenaje, untiled ],
	interactions : ol.interaction.defaults({
		altShiftDragRotate : false,
		dragPan : false,
		rotate : false
	}).extend([ new ol.interaction.DragPan({
		kinetic : null
	}) ]),
	target : olMapDiv,
	view : view
});

var vector_layer = new ol.layer.Vector({
	source : new ol.source.Vector({
		features : [ circleFeature ]
	}),
	style : [ new ol.style.Style({
		stroke : new ol.style.Stroke({
			color : 'rgba(255, 255, 255, 0.5)',
			width : 1
		}),
		fill : new ol.style.Fill({
			color : 'rgba(0, 0, 255, 0)'

		})
	}) ]

})
map.addLayer(vector_layer);

// test();

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

map.getView().setCenter(ol.proj.transform([ -64.46640, -31.38107 ], 'EPSG:4326', 'EPSG:3857'));
map.getView().setZoom(8);

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);

var sources = {};
// url : "http://localhost:8080/cirsa/js/imagenes_radares.json",
var url_api = 'https://radares.mininterior.gob.ar/api_radares/images_radares/?format=json';
if (isIE()) {
	url_api = '/api_radares/images_radares/?format=json';
}

search_images('RMA1', 'TH', startDate, maxDate);

function search_images(code_radar, polarimetric_var, timestamp_from, timestamp_to) {
	// document.getElementById('infoimagen').innerHTML = "Calling api radares..."; // gif
	sources = {};
	sources[code_radar] = {};
	sources[code_radar][polarimetric_var] = {};

	$(function() {
		PF('wvStatusDialog').show();
	});

	lastImage = urlEmpty;
	var source = new ol.source.ImageStatic({
		url : urlEmpty,
		imageExtent : extentRadar
	});
	radarLayer.setSource(source);
	stop();

	var parametros_json = {
		'code_radar' : code_radar,
		'polarimetric_var' : polarimetric_var,
		'date_from' : timestamp_from.format("YYYY-MM-DD HH:mm"),
		'date_to' : timestamp_to.format("YYYY-MM-DD HH:mm"),
	};

	$.ajax({
		data : parametros_json,
		url : url_api,
		success : function(data) {
			// document.getElementById('infoimagen').innerHTML = "Fin call api radares";
			$(function() {
				PF('wvSlider').enable();
			});
			$.each(data, function(i, image) {
				var moment_date = rounded_time(moment(image.date)); // utc
				var date_formatted = moment_date.format("DD/MM/YYYY-HH:mm");
				var roundDate = moment_date.floor(10, 'minutes');
				var df10 = roundDate.format("DD/MM/YYYY-HH:mm");
				sources[image.radar_code][image.polarimetric_var][df10] = image.image;

			});

			$(function() {
				PF('wvStatusDialog').hide();
				// reloadMaps(maxDate.format('DD/MM/YYYY HH:mm'));
				PF('wbStop').enable();
			});

			play();
		},

		error : function(xhr, ajaxOptions, thrownError) {
			$(function() {
				PF('wvStatusDialog').hide();
				PF('wvErrorDialog').show();
				PF('wvSlider').disable();
			});
			// document.getElementById('infoimagen').innerHTML = "Error call api: " + thrownError + "-" + xhr.status + " " + xhr.responseText;
		},
		timeout : 30000

	});

};

function loadSources(pDateSelected) {

	var hsSel = PF('wvSelHoras').getJQ().find(':selected').val();

	console.log("loadSources: " + pDateSelected);
	// consultar y guardar
	var viewparamsDrenaje = [ 'p_fecha:' + pDateSelected ];
	var sourceDrenaje = untiledDrenaje.getSource();
	var paramsDrenaje = sourceDrenaje.getParams();
	paramsDrenaje.viewparams = viewparamsDrenaje;
	sourceDrenaje.updateParams(paramsDrenaje);

	var viewparams = ['p_fecha:' + pDateSelected ];
	var source = untiled.getSource();
	var params = source.getParams();
	params.viewparams = viewparams.join(';');
	source.updateParams(params);

	radarLayer.setZIndex(0);
	untiledDrenaje.setZIndex(1);
	untiled.setZIndex(2);
}

function isIE() {
	var ua = window.navigator.userAgent;
	if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0)
		return true;
	else
		return false;

}
