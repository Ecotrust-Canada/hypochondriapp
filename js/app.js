
var indicators = {

};


var isIndicatorInverted = function(indicator) {
    indicator = indicator || current_indicator;
    return indicator == 'Bike helmet' ||
      indicator == 'Flu shot' ||
      indicator == 'Measles/Mumps/Rubella Vaccination' || 
      indicator == 'Diptheria/Pertussis/Polio Vaccination';
};

HR.features.forEach(function(feature){
  for (var k in feature.properties) {
    if (feature.properties.hasOwnProperty(k)) {
      if (isIndicatorInverted(k) && feature.properties[k]) feature.properties[k] = 100 - feature.properties[k];
      if (k === "Earthquake count") feature.properties[k] = feature.properties[k] / ((feature.properties.area + 300000) / 66000);
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

var map = L.mapbox.map('map', 'ecotrust.405061ba',
{
  legendControl: {
    position:'topright'
  }
})
  .setView([57.8, -96], 4);

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
function getColor(d, indicator) {
    indicator = indicator || current_indicator;
    if (d === null || typeof d === 'undefined') return "#808080";
    var bounds = indicators[indicator];
    var index = Math.floor(((d - bounds.min) / (bounds.max-bounds.min)) * legendColors.length * .999)
    var color = legendColors[index];
    return color;
}

var attachLayerEvents = function(feature, layer) {
    layer.on({
        mouseover: mousemove,
        mouseout: mouseout,
        click: zoomToFeature
    });
}

var closeTooltip;

var indicatorDisplayName = function(layer){
    var val = current_indicator;
    if (isIndicatorInverted()) val = 'Missing ' + val;
    return val
};

var indicatorDisplayData = function(layer){
    var val = layer.feature.properties[current_indicator] || '(no data)';
    return typeof val === 'number' ? val.toFixed(1) : val;
};

function mousemove(e) {
    var layer = e.target;

    popup.setLatLng(e.latlng);
    popup.setContent('<div class="marker-title">' + layer.feature.properties.region + '</div>' +
        indicatorDisplayData(layer) + ' % ' + indicatorDisplayName(current_indicator));

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
    if (!selectedLayer || e.target.feature.properties.region !== selectedLayer.feature.properties.region) hrLayer.resetStyle(e.target);
    closeTooltip = window.setTimeout(function() {
        map.closePopup();
    }, 100);
}

var selectedLayer;
function zoomToFeature(e) {
    selectedLayer = e.target;
    map.fitBounds(e.target.getBounds());
    var props = e.target.feature.properties;
    var $report = $('<h1>' + props.region + '</h1>' + $("#report_template").html());
    for (k in props){
      if (props.hasOwnProperty(k)) {
        $item = $report.find('[data-indicator="'+ k + '"]');
        if (props[k] && $item.length) {
          $item.find('h3').text((typeof props[k] === 'number' ? props[k].toFixed() : props[k]) + '% in your area.');
          $item.css("border-left-color", getColor(props[k], k));
        } else {
          $item.hide();
        }
      }
    };
    $.getJSON("http://api-beta.breezometer.com/baqi/?lat="+e.latlng.lat+"&lon="+e.latlng.lng+"&key=d4bb7a4a7d8b4f0fb1ede90a5fbb4923", function(result){
        var message = "<b style='font-family:courier;color:darkred'>Air Quality at " + e.latlng.lat.toFixed(3) + "&deg;," + e.latlng.lng.toFixed(3) + "&deg</b> : ";
        if (result.data_valid == false) {
          message += "Sorry, no air quality data in most rural areas.";
        } else {
          message += "<b class='aq-result' style='background-color:"+result.country_color+"'>" + result.breezometer_description + ".</b> <small>" + (result.random_recommendations.health || '') + ". " + (result.random_recommendations.casues || '');
        }
        $("#airquality").html(message + "  <i>(data provided by Breezometer &copy;)<i></small>");
    });
    $("#report").empty(); //.append($report);
/*
    var xy = d3.geo.mercator().translate([200,100])
    console.log(HR.features[0].geometry.coordinates[0][0][0]);
    //.center(HR.features[0].geometry.coordinates[0][0][0][0],HR.features[0].geometry.coordinates[0][0][0][1]);//.scale(3);
    var path = d3.geo.path().projection(xy);
    xy.center(xy.invert(path.centroid(selectedLayer.feature))).scale(1000);
    var vis = d3.select("#report").append("svg:svg").attr("width", 400).attr("height", 200);
        vis.append("svg:g").attr("class", "tracts").selectAll("path").data([selectedLayer.feature]).enter().append("svg:path").attr("d", path).attr("fill-opacity", 0.5).attr("fill", function (d) {
            return "black";
        }).attr("stroke", "#222");
    console.log();
            */
    $("#report").append($report);
    
    $("#toggleview").show();
    $("#toggleview .region").html("Now living in " + props.region);
}


function getLegendHTML() {
  var from, to, labels = [];
  var bounds = indicators[current_indicator];

  for (var i = 0; i < legendColors.length; i++) {
    from = bounds.min + (bounds.max-bounds.min)*i/legendColors.length;
    to = bounds.min + (bounds.max-bounds.min)*(i+1)/legendColors.length;
    labels.push(
      '<li><span class="swatch" style="background:' + getColor(to - .1) + '"></span> ' +
      from.toFixed(1) + (to ? '&ndash;' + to.toFixed(1) : '+')) + '</li>';
  }

  return '<span>% </span><span id="current_indicator">' + indicatorDisplayName() + '</span><ul>' + labels.join('') + '</ul>';
}

var pickPrimaryView = function(which){
  $(".primary").css('display','none');
  $("#"+which).css('display','block');
  $("#toggle .item").show();
  $('[data-show="'+which+'"]').hide();
};

var pickSubmenu = function(which){
  $("#menu img").swapActiveImg(false);
  $(".submenu").css('bottom','-100px');
  $("#"+which).css('bottom','80px');
  $img = $('[data-show="'+which+'"] img');
  $img.swapActiveImg(true);
};

var current_indicator;
var toggleIndicatorIcon = function(state){
  if (!current_indicator) return;
  var $img = $('[data-indicator="'+current_indicator+'"]').find("img");
  $img.swapActiveImg(state);
};

$.fn.swapActiveImg = function(state) {
  $(this).each(function(){
    $img = $(this);
    if (state) {
      $img.addClass('active');
    } else {
      $img.removeClass('active');
    }
    $img.attr('src', $img.attr('src').replace("icons/" + (state ? 'i' : 'a'), "icons/" + (state ? 'a' : 'i')));
  });
}

var pickIndicator = function(which, initial){
  toggleIndicatorIcon(false);
  current_indicator = which;
  if (!initial) resetStyles();
  if (legendHTML) map.legendControl.removeLegend(legendHTML);
  legendHTML = getLegendHTML();
  map.legendControl.addLegend(legendHTML,{position: 'topright'});
  toggleIndicatorIcon(true);
  
  setTweetLayer(current_indicator);
};

$('#menu').click(function(e){
  var which = $(e.target).parents('.item').attr('data-show');
  pickSubmenu(which);
});

$('.submenu').click(function(e){
  var which = $(e.target).parents('.item').attr('data-indicator');
  pickIndicator(which);
});

$('#toggleview').click(function(){
  $('#map').css('display','none');
  $('#report').css('display','block');
});

$('body').on( "click", "#close_report", function(){
  $('#report').css('display','none');
  $('#map').css('display','block');
});

$(".submenu .item").each(function(){
  $(this).find('img').attr("title", $(this).attr("data-indicator"));
});

$('.md-close').bind( 'click', function( ev ) {
  $("#modal-10").remove();
});


var legendHTML = '';

pickPrimaryView('map');
pickSubmenu('stranger-danger');
pickIndicator('Flu shot', true);

var hrLayer = L.geoJson(HR,  {
    style: getStyle,
    onEachFeature: attachLayerEvents
});
hrLayer.addTo(map);


// plotting the tweets.
var tweetLayer;

function setTweetLayer(k){
  
  var indicatorTweets = {
    'Injury year medical':'injury' ,
    'Earthquake count':'earthquake',
    'Flu shot':'flu',
    'Measles/Mumps/Rubella Vaccination':'measles',
    'Daily smoker':'cigarette',
    'Diabetes':'diabetes',
    'Diptheria/Pertussis/Polio Vaccination':'vaccination',
    'High stress':'stressful'
  }
  if (indicatorTweets[k]) k = indicatorTweets[k];
  
  if (tweetLayer) map.removeLayer(tweetLayer);
  tweetLayer = null;
  
  if (! (k in tw)) return;
  
  tweetLayer = new L.MarkerClusterGroup();
  for (var i = 0; i < tw[k].length; i++) {
      var a = tw[k][i];
      var when = (new Date(a.when));
      var title = "TWEETED FROM HERE -- <b style='font-family:courier'>" + a.user + ' (' + when.getMonth() + '/' + when.getDate() + ')</b> <small>' + a.text + '</small>';
      var marker = L.marker(new L.LatLng(a.geo.coordinates[0], a.geo.coordinates[1]), {
          icon: L.mapbox.marker.icon({'marker-symbol': 'danger', 'marker-color': '#880000'}),
          title: title
      });
      marker.bindPopup(title);
      tweetLayer.addLayer(marker);
  }

  map.addLayer(tweetLayer);
}

