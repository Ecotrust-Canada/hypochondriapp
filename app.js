
var indicators = {

};

HR.features.forEach(function(feature){
  for (var k in feature.properties) {
    if (feature.properties.hasOwnProperty(k)) {
      indicators[k] = indicators[k] || {};
      if (feature.properties[k] !== null) {
        indicators[k].max = Math.max(indicators[k].max || 0, feature.properties[k]);
        indicators[k].min = Math.min(indicators[k].min || 100, feature.properties[k]);
      }
    }
  }
});


function gotoUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            map.setView([position.coords.longitude, position.coords.longitude], 4);
        });
    }
}

resetStyles = function(){
  for (k in hrLayer._layers) {
    if (hrLayer._layers.hasOwnProperty(k)){
      var feature = hrLayer._layers[k];
      hrLayer.resetStyle(feature);
    }
  };
};


L.mapbox.accessToken = 'pk.eyJ1IjoiZWNvdHJ1c3QiLCJhIjoibGo4TG5nOCJ9.QJnT2dgjL4_4EA7WlK8Zkw';

var map = L.mapbox.map('map', 'examples.3hqcl3di')
  .setView([67.8, -96], 4);

var popup = new L.Popup({ autoPan: false });


function getStyle(feature) {
    return {
        weight: 3,
        opacity: 0.2,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties[current_indicator])
    };
}

var legendColors = ["#ffffcc",
  "#ffeda0", "#fed976", "#feb24c","#fd8d3c",
  "#fc4e2a","#e31a1c", "#b10026"];
// get color depending on population density value
function getColor(d) {
    if (d === null) return "#808080";
    var bounds = indicators[current_indicator];
    return legendColors[Math.floor(((d - bounds.min) / (bounds.max-bounds.min)) * legendColors.length)];
}

function onEachFeature(feature, layer) {
    layer.on({
        mousemove: mousemove,
        mouseout: mouseout,
        click: zoomToFeature
    });
}

var closeTooltip;

function mousemove(e) {
    var layer = e.target;

    popup.setLatLng(e.latlng);
    popup.setContent('<div class="marker-title">' + layer.feature.properties.region + '</div>' +
        layer.feature.properties[current_indicator] + ' ' + current_indicator + ' prevalence');

    if (!popup._map) popup.openOn(map);
    window.clearTimeout(closeTooltip);

    // highlight feature
    layer.setStyle({
        weight: 3,
        opacity: 0.3,
        fillOpacity: 0.9
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}

function mouseout(e) {
    hrLayer.resetStyle(e.target);
    closeTooltip = window.setTimeout(function() {
        map.closePopup();
    }, 100);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
    var props = e.target.feature.properties;
    var report = '<h1>' + props.region + '</h1>'
    for (k in props){
      if (props.hasOwnProperty(k)) {
        report += k + ' : ' + (props[k] || '(no data)') + '<br>'
      }
    };
    $("#report").html(report);
}


function getLegendHTML() {
  var from, to, labels = [];
  var bounds = indicators[current_indicator];

  for (var i = 0; i < legendColors.length; i++) {
    from = bounds.min + (bounds.max-bounds.min)*i/legendColors.length;
    to = bounds.min + (bounds.max-bounds.min)*(i+1)/legendColors.length;
    color = getColor(to - .1);
    labels.push(
      '<li><span class="swatch" style="background:' + getColor(to - .1) + '"></span> ' +
      from.toFixed(1) + (to ? '&ndash;' + to.toFixed(1) : '+')) + '</li>';
  }

  return '<span>Percent </span><span id="current_indicator">' + current_indicator + '</span><ul>' + labels.join('') + '</ul>';
}

var pickPrimaryView = function(which){
  $(".primary").css('z-index',0);
  $("#"+which).css('z-index',100);
};

var pickSubmenu = function(which){
  $(".submenu").css('bottom','-100px');
  $("#"+which).css('bottom','');
};

var pickIndicator = function(which, initial){
  current_indicator = which;
  if (!initial) resetStyles();
  if (legendHTML) map.legendControl.removeLegend(legendHTML);
  legendHTML = getLegendHTML();
  map.legendControl.addLegend(legendHTML);
};

$('#toggle').click(function(e){
  var which = $(e.target).attr('data-show');
  pickPrimaryView(which);
});

$('#menu').click(function(e){
  var which = $(e.target).attr('data-show');
  pickSubmenu(which);
});

$('.submenu').click(function(e){
  var which = $(e.target).attr('data-indicator');
  pickIndicator(which);

});

var legendHTML = '';

pickPrimaryView('map');
pickSubmenu('stranger-danger');
pickIndicator('Flu shot', true);

var hrLayer = L.geoJson(HR,  {
    style: getStyle,
    onEachFeature: onEachFeature
});
hrLayer.addTo(map);
