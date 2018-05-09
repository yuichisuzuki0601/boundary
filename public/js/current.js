// 位置情報取得
function start_func() {
	get_location();
}

// ( 1 )位置情報を取得します。
function get_location() {
	if (navigator.geolocation) {
		// 現在の位置情報取得を実施 正常に位置情報が取得できると、
		// successCallbackがコールバックされます。
		navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
	} else {
		alert("本ブラウザではGeolocationが使えません");
	}
}
// ( 2 )位置情報が正常に取得されたら
function successCallback(pos) {
	var Potition_latitude = pos.coords.latitude;
	var Potition_longitude = pos.coords.longitude;

	// 位置情報が取得出来たらGoogle Mapを表示する
	initialize(Potition_latitude, Potition_longitude);
}

function errorCallback(error) {
	alert("位置情報が許可されていません");
}

// ( 3 )Google Map API を使い、地図を読み込み
function initialize(x, y) {
	// Geolocationで取得した座標を代入
	var myLatlng = new google.maps.LatLng(x, y);
	var mapOptions = {
		zoom : 17,
		center : myLatlng,
		mapTypeId : google.maps.MapTypeId.HYBRID
	}
	// MapTypeId に、地図タイプを指定
	// HYBRID 衛星画像と主要な通りが表示されます
	// ROADMAP 通常の地図画像が表示されます
	// SATELLITE 衛生画像が表示されます。
	// TERRAIN 地形や植生などのマッピングをします。

	//var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	var marker = new google.maps.Marker({
		position : myLatlng,
		map : map,
		title : "Your position"
	});
	get_area_name(myLatlng);
}

function get_area_name(latLng_now) {
	// 座標から住所名を取得
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({
		latLng : latLng_now
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			alert(results[0].formatted_address + '付近にいます');
		} else {
			// エラーの場合
		}
	});
}
