
var format = 'image/png';

var pCapa = document.getElementById('frmMapa:sel_capa_input').value;

var untiled = new ol.layer.Image({
	source : new ol.source.ImageWMS({
		ratio : 1,
		url : wmsLabsLocation,
		params : {
			'FORMAT' : format,
			'VERSION' : '1.1.1',
			LAYERS : 'wspCirsaLabs:' + pCapa,
			STYLES : ''
		}
	})
});

var lagrupadas = new ol.layer.Image({
	source : new ol.source.ImageWMS({
		ratio : 1,
		url : wmsLabsLocation,
		params : {
			'FORMAT' : format,
			'VERSION' : '1.1.1',
			LAYERS : 'wspCirsaLabs:agrupadas',
			STYLES : ''
		}
	})
});



var vectorSource = new ol.source.Vector();
var vectorLayer = new ol.layer.Vector({
	source : vectorSource
});

var controls = ol.control.defaults({
	rotate : false
});


var c = ol.proj.transform([ -64, -33 ], 'EPSG:4326', 'EPSG:3857');
var map = new ol.Map({
	controls : controls,
	layers : [
		new ol.layer.Tile({
			source: new ol.source.OSM()
		})
		, untiled, vectorLayer
		],

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
			zoom: 5
		})
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
	document.getElementById('nodelist').innerHTML = "Descargando la información... por favor espere...";

	var view = map.getView();
	var viewResolution = view.getResolution();
	var source = lagrupadas.getSource();

	var url = source.getFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {
		'INFO_FORMAT' : 'text/javascript',
		'FEATURE_COUNT' : '50'
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


function reloadMaps(layer) {
	var legend = urlEmpty;
	if (layer != "agrupadas") {
		legend = wmsLabsLocation + "?request=GetLegendGraphic&format=image/png&width=20&height=20&layer=wspCirsaLabs:" + layer
		+ "&transparent=false&LEGEND_OPTIONS=forceRule:True;borderColor:0000ff;border:true;fontSize:16;font-family:Arial";
	}
	document.getElementById('frmMapa:layerLegend').src = legend;

	var layerSelected = 'wspCirsaLabs:' + layer;

	untiled.getSource().updateParams({
		'LAYERS' : layerSelected,
		'VERSION' : '1.1.1'
	});

	var lonSelected = parseFloat(document.getElementById('frmMapa:it_lon').value.trim());
	var latSelected = parseFloat(document.getElementById('frmMapa:it_lat').value.trim());


	var lonlatArray = [ lonSelected, latSelected ];
	var lonlatTransformed = ol.proj.transform(lonlatArray, 'EPSG:4326', 'EPSG:3857');

	if (isNaN(lonlatTransformed[0]) || isNaN(lonlatTransformed[1])) {		
		resetAllValues();
		document.getElementById('nodelist').innerHTML = "La latitud o longitud ingresadas no son válidas..";
	}
	else{
		var view = map.getView();
		var viewResolution = view.getResolution();
		var source = lagrupadas.getSource();


		var url = source.getFeatureInfoUrl(lonlatTransformed, viewResolution, view.getProjection(), {
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

function calcular(p_lat, p_lon) {

	document.getElementById('frmMapa:it_lon').value = p_lon;
	document.getElementById('frmMapa:it_lat').value = p_lat;

	var lonlatArray = [ p_lon, p_lat ];
	var lonlatTransformed = ol.proj.transform(lonlatArray, 'EPSG:4326', 'EPSG:3857');
	var view = map.getView();
	var viewResolution = view.getResolution();
	var source = lagrupadas.getSource();

	//var url = source.getGetFeatureInfoUrl(lonlatTransformed, viewResolution, view.getProjection(), {
	var url = source.getFeatureInfoUrl(lonlatTransformed, viewResolution, view.getProjection(), {
		'INFO_FORMAT' : 'text/javascript',
		'FEATURE_COUNT' : '50'	
	});

	getValueFromMap(url);
	
	vectorSource.clear();
	var feature = new ol.Feature(new ol.geom.Point(lonlatTransformed));

	feature.setStyle(style);
	vectorSource.addFeature(feature);

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
			if (result == null || result.length == 0 ||  (result.length == 1 && result[0].get('Band8').toFixed() == 0)) {
				resetAllValues();
			} else {
				document.getElementById('frmMapa:it_valor_pmd2').value = result[0].get('Band1').toFixed();
				document.getElementById('frmMapa:it_valor_pmd5').value = result[0].get('Band2').toFixed();
				document.getElementById('frmMapa:it_valor_pmd10').value = result[0].get('Band3').toFixed();
				document.getElementById('frmMapa:it_valor_pmd25').value = result[0].get('Band4').toFixed();
				document.getElementById('frmMapa:it_valor_pmd50').value = result[0].get('Band5').toFixed();
				document.getElementById('frmMapa:it_valor_pmd100').value = result[0].get('Band6').toFixed();
				document.getElementById('frmMapa:it_valor_pmp24').value = result[0].get('Band7').toFixed();
				document.getElementById('frmMapa:it_valor_pmp1d').value = result[0].get('Band8').toFixed();
				document.getElementById('nodelist').innerHTML = "Punto en el área de cobertura";
				
				
			}


		});

	}
}

function resetAllValues() {
	document.getElementById('frmMapa:it_valor_pmd2').value = "";
	document.getElementById('frmMapa:it_valor_pmd5').value = "";
	document.getElementById('frmMapa:it_valor_pmd10').value = "";
	document.getElementById('frmMapa:it_valor_pmd25').value = "";
	document.getElementById('frmMapa:it_valor_pmd50').value = "";
	document.getElementById('frmMapa:it_valor_pmd100').value = "";
	document.getElementById('frmMapa:it_valor_pmp24').value = "";
	document.getElementById('frmMapa:it_valor_pmp1d').value = "";
	document.getElementById('nodelist').innerHTML = "El punto seleccionado no pertenece al área de cobertura.";
}




var exportButton = document.getElementById('frmMapa:export-pdf');
exportButton.addEventListener(
		'click',
		function () {
			exportButton.disabled = true;
			document.body.style.cursor = 'progress';

			var format = 'a4';
			var resolution = 72;
			var dim = [297, 210];
			var width = Math.round((dim[0] * resolution) / 25.4);
			var height = Math.round((dim[1] * resolution) / 25.4);
			var size = map.getSize();
			var viewResolution = map.getView().getResolution();

			map.once('rendercomplete', function () {
				var mapCanvas = document.createElement('canvas');
				mapCanvas.width = width;
				mapCanvas.height = height;
				var mapContext = mapCanvas.getContext('2d');
				Array.prototype.forEach.call(
						document.querySelectorAll('.ol-layer canvas'),
						function (canvas) {
							if (canvas.width > 0) {
								var opacity = canvas.parentNode.style.opacity;
								mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
								var transform = canvas.style.transform;
								// Get the transform parameters from the style's transform matrix
								var matrix = transform
								.match(/^matrix\(([^\(]*)\)$/)[1]
								.split(',')
								.map(Number);
								// Apply the transform to the export map context
								CanvasRenderingContext2D.prototype.setTransform.apply(
										mapContext,
										matrix
								);
								mapContext.drawImage(canvas, 0, 0);
							}
						}
				);
				// pdf
				var pdf = new jsPDF('landscape', 'mm', format);
		
				pdf.setFontType("bold"); 
				pdf.setFontSize(12);
				pdf.text(10, 10, 'Mapa de lluvias máximas diarias con recurrencia asociada (PMD) y valor límite estimado para la República Argentina');
				
				
				pdf.addImage(
						mapCanvas.toDataURL('image/jpeg'),
						'JPEG',
						10,
						15,
						//dim[0], dim[1]
						150, 105
				);
				
				pdf.setFontSize(10);
				var i=18;
				pdf.text(170, i, 'Información para el punto seleccionado');
				pdf.setFontType("normal");
				var e=7;
				
				pdf.text(170, i + e * 1, 'Latitud: ' + document.getElementById('frmMapa:it_lat').value );
				pdf.text(170, i + e * 2, 'Longitud:  ' + document.getElementById('frmMapa:it_lon').value );
				pdf.text(170, i + e * 3, 'PMD 2 años: ' + document.getElementById('frmMapa:it_valor_pmd2').value + 'mm');
				pdf.text(170, i + e * 4, 'PMD 5 años: ' + document.getElementById('frmMapa:it_valor_pmd5').value + 'mm');
				pdf.text(170, i + e * 5, 'PMD 10 años: ' + document.getElementById('frmMapa:it_valor_pmd10').value + 'mm');
				pdf.text(170, i + e * 6, 'PMD 25 años: ' + document.getElementById('frmMapa:it_valor_pmd25').value + 'mm');
				pdf.text(170, i + e * 7, 'PMD 50 años: ' + document.getElementById('frmMapa:it_valor_pmd50').value + 'mm');
				pdf.text(170, i + e * 8, 'PMD 100 años: ' + document.getElementById('frmMapa:it_valor_pmd100').value + 'mm');
				pdf.text(170, i + e * 9, 'VLEP 24 hs: ' + document.getElementById('frmMapa:it_valor_pmp24').value + 'mm');
				pdf.text(170, i + e * 10, 'VLEP 1d: '  + document.getElementById('frmMapa:it_valor_pmp1d').value + 'mm');
				
				pdf.setFontSize(8);
				var mi=10;
			    var md=10; 
			    var ancho=297;  // landscape A4 in mm
			    var nota=document.getElementById('frmMapa:otDisclaimer').innerHTML;
				
				var lineas =pdf.splitTextToSize(nota, (ancho-mi-md));
				 pdf.text(mi,130,lineas);
				
				pdf.save('SGA - PMD VLEP.pdf');
			
				map.setSize(size);
				map.getView().setResolution(viewResolution);
				exportButton.disabled = false;
				document.body.style.cursor = 'auto';
			});

			var printSize = [width, height];
			map.setSize(printSize);
			var scaling = Math.min(width / size[0], height / size[1]);
			map.getView().setResolution(viewResolution / scaling);
		},
		false
);


