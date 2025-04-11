
var view = new ol.View({
	maxZoom : 21
});

var format = 'image/png';
var bounds = [ -65.2292861938477, -33.3717765808105, -63.8249664306641, -30.8809452056885 ];

var geolocation = new ol.Geolocation({
	projection : view.getProjection()
});

geolocation.on('error', function(error) {
	var info = document.getElementById('frmMapa:info');
	if (error.code == 1) {
		info.innerHTML = '(El navegador web no tiene permiso para mostrar su geolocalización.)';
	} else {
		info.innerHTML = '(El sitema no ha podido resolver su geolocalización para mostrar en el mapa.)';

	}
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

// radar
var pDateSelected = document.getElementById('frmMapa:stringDate').value;
var boundsRadar = [ -66.7436605900, -33.5784708300, -61.6401794100, -29.2802255600 ];
var extentRadar = ol.proj.transformExtent(boundsRadar, 'EPSG:4326', 'EPSG:3857');

var radarLayer = new ol.layer.Image({
	source : new ol.source.ImageStatic({
		url : urlEmpty,
		imageExtent : extentRadar
	})
});

var centerRadar = [ parseFloat(-64.19194444), parseFloat(-31.44138889) ];
var circle = new ol.geom.Circle(ol.proj.transform(centerRadar, 'EPSG:4326', 'EPSG:3857'), 282000);
var circleFeature = new ol.Feature(circle);

function updateInfo() {
	var el = document.getElementById('frmMapa:infofecha');
	var txtActualizado = startDate.format('DD/MM/YYYY HH:mm');
	el.innerHTML = txtActualizado;

}

function changeStartDate(hsSel) {
	maxDate = moment(pDateSelected, 'DD/MM/YYYY HH:mm').floor(10, 'minutes');

	var timestamp_to = maxDate;
	var timestamp_from = moment(maxDate).add(-1 * hsSel, 'hours');
	startDate = timestamp_from;
	search_images('RMA1', 'TH', timestamp_from, timestamp_to);
}

var lastImage = urlEmpty;
function updateTimeAndImage() {

	var hsSel = 6;
	var layerSelected = PF('wvLayers').getJQ().find(':checked').val();
	if (layerSelected != 'amenazas') {
		hsSel = PF('wvLayers').getJQ().find(':checked').val();
	}

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
	} else {
		urlImage = lastImage;

	}

	var source = new ol.source.ImageStatic({
		url : urlImage,
		imageExtent : extentRadar
	});

	radarLayer.setSource(source);
	radarLayer.setZIndex(0);
	updateInfo();
}

var stop = function() {
	if (animationId !== null) {
		window.clearInterval(animationId);
		animationId = null;
	}
};

var play = function() {
	stop();
	animationId = window.setInterval(updateTimeAndImage, 500);
};

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

});

var controls = ol.control.defaults({
	rotate : false
});




var c = ol.proj.transform([ -64.46640, -31.38107 ], 'EPSG:4326', 'EPSG:3857');
var map = new ol.Map({
	controls : controls,
	layers : [
	    new ol.layer.Tile({
		    source: new ol.source.OSM()
		    }), vector_layer, radarLayer, cuencasLayer, estacionesLayer, drenajeLayer, geolocLayer ],
	interactions : ol.interaction.defaults({
		altShiftDragRotate : false,
		dragPan : false,
		rotate : false,
		pinchRotate : false
	}).extend([ new ol.interaction.DragPan({
		kinetic : null
	}) ]),
	target : 'map',
	view: new ol.View({
		 center: c,
	     zoom: 10
	  })
});

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


var startDate = moment(pDateSelected, 'DD/MM/YYYY HH:mm').add(-3, 'hours').floor(10, 'minutes');
var maxDate = moment(pDateSelected, 'DD/MM/YYYY HH:mm');
var animationId = null;
var sources = {};

var url_api = 'https://radares.mininterior.gob.ar/api_radares/images_radares/?format=json';
if (isIE()) {
	url_api = '/api_radares/images_radares/?format=json';
}

function search_images(code_radar, polarimetric_var, timestamp_from, timestamp_to) {
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
	radarLayer.setZIndex(0);
	cuencasLayer.setZIndex(1);
	estacionesLayer.setZIndex(2);
	drenajeLayer.setZIndex(3);
	geolocLayer.setZIndex(4);
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
			$.each(data, function(i, image) {
				var moment_date = rounded_time(moment(image.date)); // utc
				var date_formatted = moment_date.format("DD/MM/YYYY-HH:mm");
				var roundDate = moment_date.floor(10, 'minutes');
				var df10 = roundDate.format("DD/MM/YYYY-HH:mm");
				sources[image.radar_code][image.polarimetric_var][df10] = image.image;

			});

			$(function() {
				PF('wvStatusDialog').hide();
			});
			play();
		},

		error : function(xhr, ajaxOptions, thrownError) {
			$(function() {
				PF('wvStatusDialog').hide();
				PF('wvErrorDialog').show();
				document.getElementById('frmMapa:infohoras').innerHTML = "";
				PF('wvChRadar').uncheck();

			});
			
		},
		timeout : 30000

	});

};

var timeround = 10;
function rounded_time(moment_date) {
	var moment_date = moment_date;
	var minutos = moment_date.minute();
	if (minutos % timeround < (timeround / 2)) {
		moment_date.subtract((minutos % timeround), 'minute');
	} else {
		moment_date.add((timeround - (minutos % timeround)), 'minute');
	}

	return moment_date;
}

function isIE() {
	var ua = window.navigator.userAgent;
	if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0)
		return true;
	else
		return false;

}
