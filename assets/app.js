;(function($, window) {

	var jQT, mobMap;

	 // Some sample Javascript functions:
    $(function(){

    	

   
	
	    jQT = new $.jQTouch({
	        statusBar: 'black-translucent',
	        preloadImages: []
	    });

	    mobMap = $('#map').MobileMap({
	    	callback: {
	    			newMarker: function(LatLng),
	    	}
	    	mapOptions: {
	    		zoom: 4,
	    		center: new google.maps.LatLng(40, -86)
	    	}
	    });

	    $('#new-location'.submit(function))
	    	var $form = $(this);
	    	var $name = $form.fid('#name');

	    	var $address = {
	    		$street

	    	}

    });
}(jQuery, this));