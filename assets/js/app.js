;(function($, window) {

/*$("#map").toggle(function(show){});

$("#mapIO").click(function(){


$("#map").toggle(function(hideOrShow){
var mapProp = {
  center:new google.maps.LatLng(39.72,-86.09),
  zoom:7,
  mapTypeId:google.maps.MapTypeId.SATELLITE,
  scrollwheel: false
  };
var map=new google.maps.Map(document.getElementById("map")
  ,mapProp);

});
}); */


//Hide bottom menu button

$("#hideB").click(function(){

  var hideB = $("#hideB");
  var currentPos = hideB.css("bottom");
  var footer_container = $("#footer_container");

  if(currentPos == "50px"){
    $(hideB).stop().animate({bottom:0},100);
    $(footer_container).hide();
  }
  else if(currentPos == "0px") {
    $(hideB).stop().animate({bottom:50},100);
    $(footer_container).show();

  }
    
  });

//End Click Event



$("#currentLoc").click(function(){
var initialLocation;
var home = new google.maps.LatLng(40, -86);
var browserSupportFlag =  new Boolean();

  var myOptions = {
    zoom: 6,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  };
  var map = new google.maps.Map(document.getElementById("map"), myOptions);
  
  // Try W3C Geolocation (Preferred)
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      map.getCenter(initialLocation);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }
  
  function handleNoGeolocation(errorFlag) {
    if (errorFlag == true) {
      alert("Your browser doesn't support geolocation. We've placed you in Indiana.");
      initialLocation = home;
    }
    else {
      map.getCenter(initialLocation);
    }
  }

});


  var jQT;
  
// Some sample Javascript functions:
    $(function(){
  
      jQT = new $.jQTouch({
          statusBar: 'black-translucent',
          preloadImages: []
      });

    });
    
  $('.toggle').click(function(e) {
    var $t = $(this);
    var id = $t.attr('href');
    var target = $(id);
    
    if(target.css('display') != 'none') {
      target.removeClass('show');
    }
    else {
      target.addClass('show');
    }
    
    e.preventDefault();
  });
  
  $('.bars').click(function(e) {
    var $t = $(this);
    
    if($t.hasClass('rotate')) {
      $t.removeClass('rotate');
    }
    else {
      $t.addClass('rotate');
    }
        
    e.preventDefault();
  });
  
  $('#home').bind('pageAnimationEnd', function(event, info) {
    if (info.direction == 'in') {
      $("#map").show();
      
      google.maps.event.trigger(map.map, 'resize');
      
      map.map.setZoom(map.mapOptions.zoom);
      map.map.fitBounds(map.bounds);
          
    }
    return false;
  });
  
  $('#new-location').submit(function(e) {
    
    var $t      = $(this);
    var $name   = $t.find('#name');
    var $street = $t.find('#street');
    var $city   = $t.find('#city');
    var $state  = $t.find('#state');
    var $zip    = $t.find('#zip');
    
    var address = [
      $street.val(),
      $city.val(),
      $state.val(),
      $zip.val()
    ];
    
    var obj = {
      name: $name.val(),
      address: address.join(' '),
      street: $street.val(),
      city: $city.val(),
      state: $state.val(),
      zipcode: $zip.val()
    }
    
    map.addMarker(obj, function() {
      map.home();
      $name.val('');
      $street.val('');
      $city.val('');
      $state.val('');
      $zip.val('');
    });
    
    e.preventDefault();
    
    return false;
  });
  
  $('#edit-location').submit(function(e) {
    
    var $t      = $(this);
    var $name   = $t.find('#name');
    var $street = $t.find('#street');
    var $city   = $t.find('#city');
    var $state  = $t.find('#state');
    var $zip    = $t.find('#zip');
    
    var address = [
      $street.val(),
      $city.val(),
      $state.val(),
      $zip.val()
    ];
    
    var obj = {
      name: $name.val(),
      address: address.join(' '),
      street: $street.val(),
      city: $city.val(),
      state: $state.val(),
      zipcode: $zip.val()
    }
    
    map.editMarker(obj, function() {
      map.home();
      $name.val('');
      $street.val('');
      $city.val('');
      $state.val('');
      $zip.val('');
    });
    
    e.preventDefault();
    
    return false;
  });

  var map = $('#map').MobileMap({
    mapOptions: {
      center: new google.maps.LatLng(40, -86)
    },
    callback: {
      newMarker: function(marker, lat, lng, index) {
        google.maps.event.addListener(marker, 'click', function() {
        
          map.editIndex = index;
          
          var row     = map.db.query('markers', function(row) {
            if(row.ID == index+1) {
              return true;
            }
            return false;
          });
          
          row = row[0];
          
          var form    = $('#edit-location');
          var $name   = form.find('#name');
          var $street = form.find('#street');
          var $city   = form.find('#city');
          var $state  = form.find('#state');
          var $zip    = form.find('#zip');
          
          $name.val(row.name);
          $street.val(row.street);
          $city.val(row.city);
          $state.val(row.state);  
          $zip.val(row.zipcode);
          
          $.pageslide({ direction: 'right', href:'#edit' }); 
        });
      }
    }
  });

}(jQuery, this));