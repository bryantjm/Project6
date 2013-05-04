;(function($) {
	
	var MobileMap = function(obj, options) {
	
		var $t = $(obj);
		
		var t = {
			callback: {
				init: function() {},
				search: function(results, lat, lng, distance, circle) {},
				clearSearch: function() {},
				home: function() {},
				newMarker: function(marker, lat, lng) {},	
			},
			db: new localStorageDB("MapIndex", localStorage),
			bounds: new google.maps.LatLngBounds(),
			editIndex: false,
			geocoder: new google.maps.Geocoder(),
			hasSearched: false,
			map: false,
			mapOptions: {
				zoom: 15,
				center: new google.maps.LatLng(0, 0), 
				scrollwheel: false
			},
			settings: {
				icon: false,
				iconSize: false,
				mapType: 'ROADMAP'
			},
			circles: [],
			markers: [],
			searchBounds: new google.maps.LatLngBounds(),
			ui: {
				map: $t
			}
		}
		
		if(!options) {
			var options = {};
		}
		
		t = $.extend(true, t, options);
		
		t.getMapTypeId = function() {
			var _default = google.maps.MapTypeId.ROADMAP;
			
			if(google.maps.MapTypeId[t.settings.mapType]) {
				return google.maps.MapTypeId[t.settings.mapType];
			}
			
			return _default;
		}
		
		t.createSettingsTable = function() {
			if(!t.db.tableExists('settings')) {			
			    t.db.createTable("settings", ["key", "value"]);
			    t.db.commit();
			}
		}
		
		t.saveSettings = function() {
			t.createSettingsTable();
			
			$.each(t.settings, function(key, value) {
				t.db.insertOrUpdate('settings', {key: key}, {
					key: key,
					value: value
				});
			});
			
			t.db.commit();
		}
		
		t.setSettings = function(settings) {
			t.settings = settings;
			t.saveSettings();
		}
		
		t.setSetting = function(setting, value) {
			if(t.settings[setting]) {
				t.settings[setting] = value;
			}
		}
		
		t.getSettings = function(setting) {
			t.createSettingsTable();
			
			var _default = t.settings;
			var settings = {};
			
			t.db.query('settings', function(row) {
				settings[row.key] = row.value; 
			});
			
			t.settings = $.extend(true, _default, settings);
			
			return t.settings;
		}
		
		t.getSetting = function(setting) {
			if(t.settings[setting]) {
				return t.settings[setting];
			}			
			return false;
		}
		
		t.init = function(options) {
			t.getSettings();
			
			if(options) {
				t.mapOptions = $.extend(true, t.mapOptions, options);	
			}
			
			t.mapOptions.mapTypeId = t.getMapTypeId(); 
		
			t.map = new google.maps.Map(t.ui.map.get(0), t.mapOptions);
			
			// t.db.dropTable('markers');
			
			if(!t.db.tableExists('markers')) {			
			    t.db.createTable("markers", ["name", "address", "response", "street", "city", "state", "zipcode", "lat", "lng"]);
			    t.db.commit();
			}
			
			t.db.query('markers', function(row) {
				t.newMarker(row.lat, row.lng, row.ID);
			});
			
			t.callback.init(t);
			
			return t.map;
		}
		
		t.home = function() {
			google.maps.event.trigger(t.map, 'resize');
			t.map.setZoom(t.mapOptions.zoom);
			t.map.fitBounds(t.bounds);
			
			t.callback.home();
		}
		
		t.addCircle = function(lat, lng, distance, circleOptions) {
			
			if(!circleOptions) {
				var circleOptions = {
					fillColor: 'blue',
					fillOpacity: .2,
					strokeColor: 'blue',
					strokeOpacity: .4,
					strokeWeight: 3
				};
			}
			
			if(typeof distance != "number") {
				distance = parseFloat(distance);
			}
			
			var oneMeter = 1609.34;
			
			circleOptions = $.extend(true, circleOptions, {
				center: new google.maps.LatLng(lat, lng),
				map: t.map,
				radius: distance * oneMeter,
			});
			
			var circle = new google.maps.Circle(circleOptions);
			
			t.circles.push(circle);
			t.bounds.union(circle.getBounds());			
			t.resetBounds();
			
			return circle;
		}
		
		t.hideCircles = function() {
			$.each(t.circles, function(i, circle) {
				t.circles[i].setVisible(false);
			});
		}
		
		t.showCircles = function() {
			$.each(t.circles, function(i, circle) {
				t.circles[i].setVisible(true);
			});
		}
		
		t.showCircle = function(index) {
			if(t.circles[index]) {
				t.circles[index].setVisible(false);
			}
		}
		
		t.clearSearch = function() {
			t.hasSearched = false;
			t.hideCircles();
			t.showMarkers();
			t.resetBounds();
			t.callback.clearSearch();
		}
		
		t.getMarkerById = function(id) {
			var _return;
			
			$.each(t.markers, function(i, marker) {
				if(marker.id == id) {
					_return = marker;
				}
			});
			
			return _return;
		}
		
		t.search = function(location, distance, callback) {
			if(typeof callback != "function") {
				callback = function() {};
			}
			
			distance = parseInt(distance);
			
			if(isNaN(distance)) {
				distance = false;
			}
			
			var _return = [];
			
			t.hideCircles();
			
			t.geocode(location, function(response) {
				if(response.success) {				
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					
					var circle = t.addCircle(lat, lng, distance);
			
					t.db.query('markers', function(row) {
						var markerDistance = ((Math.acos(Math.sin(lat * Math.PI / 180) * Math.sin(row.lat * Math.PI / 180) + Math.cos(lat * Math.PI / 180) * Math.cos(row.lat * Math.PI / 180) * Math.cos((lng - row.lng) * Math.PI / 180)) * 180 / Math.PI) * 60 * 1.1515) * 1;
						
						if(!distance || distance > markerDistance) {
							_return.push(row);
						}
					});
					
					t.searchBounds = circle.getBounds();
					t.map.fitBounds(t.searchBounds);
										
					t.hideMarkers();
					
					$.each(_return, function(i, row) {
						var marker = t.getMarkerById(row.ID);
						
						if(!marker) {
							console.log(marker);
						}
						
						if(marker) {
							marker.setVisible(true);
						}
					});
					
					t.callback.search(_return, lat, lng, distance, circle);
					t.hasSearched = true;
				}
				
				callback(_return, response);
			});
			
			return _return;
		}
		
		t.setBounds = function(bounds) {
			t.map.fitBounds(bounds);
			t.bounds = bounds;
		}
		
		t.hideMarkers = function() {
			$.each(t.markers, function(i, marker) {
				if(marker) {
					marker.setVisible(false);	
				}
			});
		}
		
		t.showMarkers = function() {
			$.each(t.markers, function(i, marker) {
				if(marker) {
					marker.setVisible(true);	
				}
			});
		}
		
		t.resetBounds = function(circles) {
			var bounds = new google.maps.LatLngBounds();
			
			google.maps.event.trigger(t.map, 'resize');
			
			$.each(t.markers, function(i, marker) {
				if(marker && marker.getVisible()) {
					bounds.extend(marker.getPosition());
				}
			});
			
			if(circles) {
				$.each(t.circles, function(i, circle) {
					if(circle.getVisible()) {
						bounds.union(circle.getBounds());
					}
				});
			}
			
			if(!t.hasSearched) {
				t.bounds = bounds;
				t.map.fitBounds(t.bounds);
			}
			else {
				t.map.fitBounds(t.searchBounds);
			}
			
			return bounds;
		}
		
		t.newMarker = function(lat, lng, id) {
			var latLng = new google.maps.LatLng(lat, lng);
			
			if(!id) {
				var id = false;
			}
			
			marker = new google.maps.Marker({
				map: t.map,
				position: latLng,
				id: id
			});
			
			if(t.settings.icon) {
				
				if(!t.settings.iconSize) {
					t.settings.iconSize = '40,40';	
				}
				
				iconSize = t.settings.iconSize.split(',');
				
				var width  = iconSize[0] && parseInt(iconSize[0]) ? parseInt(iconSize[0]) : 40;
				var height = iconSize[1] && parseInt(iconSize[1]) ? parseInt(iconSize[1]) : 40;
				
				marker.setIcon({
					url: t.settings.icon,
					scaledSize: new google.maps.Size(width, height)
				});
			}
			
			t.callback.newMarker(marker, lat, lng, t.markers.length);
			
			t.markers.push(marker);
			t.bounds.extend(latLng);
			
			t.resetBounds();
			
			return marker;
		}
		
		t.deleteMarker = function(index) {
			
			var marker = t.markers[index];
			
			if(!marker) {
				var id = false;	
			}
			else {
				var id = marker.id;
				
				marker.setVisible(false);
			}
			
			if(id) {
				t.db.deleteRows('markers', function(row) {
					if(row.ID == id) {
						return true;
					}
				});
				
				t.db.commit();
			}
			
			t.markers[index] = false;
			
			t.resetBounds();
			t.home();
		}
		
		t.updateMarker = function(marker, lat, lng) {
			marker.setPosition(new google.maps.LatLng(lat, lng));
		}
		
		t.editMarker = function(location, callback) {
			
			t.geocode(location.address, function(response) {
				if(response.success) {
					
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					var hasLatLng = t.hasLatLng(lat, lng);
					
					// if(hasLatLng) {
					//	alert('\''+$.trim(location.address)+'\' is already a location on the map');	
					//}
					//else {						
						t.updateMarker(t.markers[t.editIndex], lat, lng);
									
						t.db.update("markers", {ID: t.editIndex+1}, function() {
							
							var row = {
								name: location.name,
								address: location.address,
								street: location.street,
								city: location.city,
								state: location.state,
								zipcode: location.zipcode,
								response: response,
								lat: lat,
								lng: lng
							}
							
							return row;
						});
						
						t.db.commit();
						
						if(typeof callback == "function") {
							callback(response, location);
						}
					//}
				}
				else {
					alert('\''+$.trim(location.address)+'\' is an invalid location');
				}
			});
		}
		
		t.addMarker = function(location, save, callback) {
			
			if(typeof save == "undefined") {
				var save = true;
			}
			
			if(typeof save == "function") {
				callback = save;
				save = true;
			}
			
			t.geocode(location.address, function(response) {
				if(response.success) {
					
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					var hasLatLng = t.hasLatLng(lat, lng);
					var marker = false;
					var id = false;
					
					if(save && !hasLatLng) {
						id = t.db.insert("markers", {
							name: location.name,
							address: location.address,
							street: location.street,
							city: location.city,
							state: location.state,
							zipcode: location.zipcode,
							response: response,
							lat: lat,
							lng: lng
						});
						
						t.db.commit();
					}
					
					if(hasLatLng) {
						alert('\''+$.trim(location.address)+'\' is already a location on the map');	
					}
					else {				
						t.newMarker(lat, lng, id);
						
						if(typeof callback == "function") {
							callback(response, location, save);
						}
					}
				}
				else {
					alert('\''+$.trim(location.address)+'\' is an invalid location');
				}
			});
		}
		
		t.hasLatLng = function(lat, lng) {
			var _return = false;
			
			t.db.query('markers', function(row) {
				if(row.lat == lat && row.lng == lng) {
					_return = true;	
				}
			});
			
			return _return;
		}
		
		t.geocode = function(location, callback) {
			if(typeof callback != "function") {
				callback = function() {};
			}
			
			t.geocoder.geocode({'address': location}, function(results, status) {
				
				var response = {
					success: status == google.maps.GeocoderStatus.OK ? true : false,
					status: status,
					results: results
				}
				
				callback(response);
			});
		}
		
		t.init();
		
		return t;
	}
	
	$.fn.MobileMap = function(options) {
		return new MobileMap($(this), options);
	}	
	
})(jQuery);