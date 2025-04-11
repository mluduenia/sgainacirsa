var myLatlng = new google.maps.LatLng(-31, -64);

var gmap = new google.maps.Map(document.getElementById('gmap'), {
	disableDefaultUI : true,
	keyboardShortcuts : false,
	draggable : false,
	disableDoubleClickZoom : true,
	scrollwheel : false,
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

var untiled = new ol.layer.Image({

	source : new ol.source.ImageWMS({
		ratio : 1,
		url : wmsLabsLocation,
		params : {
			'FORMAT' : format,
			'VERSION' : '1.1.1',
			LAYERS : 'wspCirsaLabs:ABC'

		}
	})
});

var olMapDiv = document.getElementById('olmap');

var vectorSource = new ol.source.Vector();
var vectorLayer = new ol.layer.Vector({
	source : vectorSource
});

var controls = ol.control.defaults({
	rotate : false
});
var map = new ol.Map({
	controls : controls,
	layers : [ untiled, vectorLayer ],
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

var style = new ol.style.Style({
	image : new ol.style.Circle({
		radius : 6,
		stroke : new ol.style.Stroke({
			color : 'white',
			width : 2
		}),
		fill : new ol.style.Fill({
			color : 'green'
		})
	})
});

map.on('singleclick', function(evt) {
	document.getElementById('nodelist').innerHTML = "Calculando idT... por favor espere...";
	var view = map.getView();
	var viewResolution = view.getResolution();

	var source = untiled.getSource();

	var url = source.getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {
		'INFO_FORMAT' : 'text/javascript'
	});

	var lonlat = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

	document.getElementById('frmMapa:it_lon').value = lonlat[0];
	document.getElementById('frmMapa:it_lat').value = lonlat[1];

	getValueFromMap(url);

	vectorSource.clear();
	var feature = new ol.Feature(new ol.geom.Point(evt.coordinate));
	feature.setStyle(style);
	vectorSource.addFeature(feature);

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

// centro en lago carlos paz
map.getView().setCenter(ol.proj.transform([ -62.62, -28.86 ], 'EPSG:4326', 'EPSG:3857'));
map.getView().setZoom(5);

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);

function calculate_idt() {

	var lonSelected = parseFloat(document.getElementById('frmMapa:it_lon').value.trim());
	var latSelected = parseFloat(document.getElementById('frmMapa:it_lat').value.trim());

	if (isNaN(lonSelected) || isNaN(latSelected)) {
	} else {
		var lonlatArray = [ lonSelected, latSelected ];
		var lonlatTransformed = ol.proj.transform(lonlatArray, 'EPSG:4326', 'EPSG:3857');

		var view = map.getView();
		var viewResolution = view.getResolution();
		var source = untiled.getSource();

		var url = source.getGetFeatureInfoUrl(lonlatTransformed, viewResolution, view.getProjection(), {
			'INFO_FORMAT' : 'text/javascript',
			'FEATURE_COUNT' : '50'
		});

		getValueFromMap(url);

		vectorSource.clear();
		var feature = new ol.Feature(new ol.geom.Point(lonlatTransformed));
		feature.setStyle(style);
		vectorSource.addFeature(feature);

	}
}

function out_of_coverage_area() {

	document.getElementById('frmMapa:it_valor_A').value = "";
	document.getElementById('frmMapa:it_valor_B').value = "";
	document.getElementById('frmMapa:it_valor_C').value = "";

	document.getElementById('nodelist').innerHTML = "El punto seleccionado no se encuentra en el área de cobertura del mapa, no es posible calcular el idT";
	document.getElementById('frmMapa:it_valor').value = "";

	// clear tabla idt sin items
	document.getElementById('frmMapa:cmdCalcularIdt').click();

}

function getValueFromMap(p_url) {
	if (p_url) {
		var parser = new ol.format.GeoJSON();
		$.ajax({
			url : p_url,
			dataType : 'jsonp',
			jsonpCallback : 'parseResponse'
		}).then(function(response) {
			var result = parser.readFeatures(response);

			if (result.length) {
				var valor_A = parseFloat(result[0].get('RED_BAND'));
				var valor_B = parseFloat(result[0].get('GREEN_BAND'));
				var valor_C = parseFloat(result[0].get('BLUE_BAND'));

				document.getElementById('frmMapa:it_valor_A').value = valor_A;
				document.getElementById('frmMapa:it_valor_B').value = valor_B;
				document.getElementById('frmMapa:it_valor_C').value = valor_C;

				var duracion = document.getElementById('frmMapa:it_duracion').value;
				var recurrencia = document.getElementById('frmMapa:it_recurrencia').value;

				if (valor_A == 0 || valor_B == 0 || valor_C == 0) {
					out_of_coverage_area();

				} else {
					// calcular idt para la tabla de duraciones/recurrencia predeterminadas y para las ingresadas
					document.getElementById('frmMapa:cmdCalcularIdt').click();
					document.getElementById('nodelist').innerHTML = "idT calculado";
				}

			} else {
				out_of_coverage_area();
			}
		});

	}

}