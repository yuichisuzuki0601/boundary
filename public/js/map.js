var _ = {};

_.BP = '/gmap3/area/';

_.$ = function(id){
  return document.getElementById(id);
}

_.query = function(v){
  if(typeof(v) != 'object') return;
  var a = new Array;
  for(k in v) a.push(k + '=' + encodeURI(v[k]));
  return a.join('&');
}

_.nf = function(num){
 return num.toString().replace( /([0-9]+?)(?=(?:[0-9]{3})+$)/g , '$1,' );
}

_.d = function(){};

// !cookie---------------------------------------------->
_.cookie = {}
_.cookie.get = function(name){
  name = name + '=';
  value = '';
  myStr = document.cookie + ';';
  myOfst = myStr.indexOf(name);
  if(myOfst != -1){
    myStart = myOfst + name.length;
    myEnd   = myStr.indexOf(';' , myStart);
    value = unescape(myStr.substring(myStart,myEnd));
  }
  return value;
}
_.cookie.set = function(name,value,day){
  if(!value) var value = '';
  if(!day) var day = 0;
  myExp = new Date();
  myExp.setTime(myExp.getTime()+(day*24*60*60*1000));
  myItem = name + '=' + escape(value) + ';';
  myExpires = day ? 'expires=' + myExp.toGMTString() + ';' : '';
  myPath = 'path=' + _.BP;
  document.cookie =  myItem + myExpires + myPath;
}
_.cookie.grp = function(type,v,no){
  if(this.get(type)){
    var c = this.get(type).split('*');
  }else{
    var c = new Array();
  }
  if(typeof(v) == 'object'){
    for(var k in v){
      if(v[k] != null) c[k] = v[k];
    }
  }else if(typeof(no) == 'number'){
    c[no] = v;
  }
  c = c.join('*');
  this.set(type,c,30);
}

// !map---------------------------------------------->
var map;

_.AREA = {};

_.mapLoad = function(){
  var c = _.mapCookie();
  var lat = c['lat'];
  var lng = c['lng'];
  var zoom = parseFloat(c['zoom']);
  var maptype = c['maptype'];
  lat = _.ll(lat);
  lng = _.ll(lng);
  if(!(lat >= -90 && lat <= 90) || !(lng > -180 && lng < 180)){
    lat = _.MAP_DEF[0];
    lng = _.MAP_DEF[1];
  }
  var ll = new google.maps.LatLng(lat,lng);

  var opts = {
    zoom: zoom,
    center: ll,
    panControl: false,
    mapTypeControl: true,
    mapTypeId: _.mapType(maptype),
    scrollwheel:true,
    keyboardShorts: true,
    scaleControl: true
  };
  map = new google.maps.Map(_.$('map_canvas'),opts);

  google.maps.event.addListener(map,'idle',function(){
    var z = map.getZoom();
    var c = map.getCenter().toUrlValue().split(',');
    _.cookie.grp('map',[c[0],c[1], z]);
  });

  google.maps.event.addListener(map,'maptypeid_changed',function(){
    var maptype = map.getMapTypeId();
    _.cookie.grp('map',maptype,3);
  });

//  google.maps.event.addListener(map,'click',function(res){
//    if(_.MARKER){
//      _.MARKER.setPosition(res.latLng);
//    }else{
//      _.marker.create(res.latLng);
//    }
//    _.area.create(res.latLng);
//  });
}

_.mapCookie = function(){
  var n = ['lat','lng','zoom','maptype'];
  var d = _.MAP_DEF = [35.681338, 139.766663, 14, 'ROADMAP'];
  var v = new Array(n.length);
  if(_.cookie.get('map')){
    var v = _.cookie.get('map').split('*');
  }
  var c = {};
  for(i=0; i < n.length; i++){
    c[n[i]] = v[i] ? v[i] : d[i];
  }
  return c;
}

_.mapType = function(type){
  var maptype;
  switch(type){
    case 'satellite': maptype = google.maps.MapTypeId.SATELLITE; break;
    case 'hybrid': maptype = google.maps.MapTypeId.HYBRID; break;
    case 'terrain': maptype = google.maps.MapTypeId.TERRAIN; break;
    default: maptype = google.maps.MapTypeId.ROADMAP; break;
  }
  return maptype;
}

_.mapAddr = function(addr){
  if(!addr) return;
  if(!_.geocoder) _.geocoder = new google.maps.Geocoder();
  _.geocoder.geocode({'address':addr},function(results,status){
    if(status == google.maps.GeocoderStatus.OK){
      var ll = results[0].geometry.location;
      map.panTo(ll);
      if(_.MARKER){
        _.MARKER.setPosition(ll);
      }else{
        _.marker.create(ll);
      }
      _.area.create(ll);
    }else{
      alert('「' + addr + '」は、見つかりませんでした。');
    }
  });
}

_.ll = function(v){
  if(!v) return 0;
  return Math.floor(v*1000000)/1000000;
}

// !marker---------------------------------------------->
_.marker = {};
_.marker.create = function(ll){
  _.MARKER = new google.maps.Marker({
     position: ll,
     map: map,
     draggable: true
  });
  google.maps.event.addListener(_.MARKER,'dragend',function(){
    var ll = _.MARKER.getPosition();
    _.area.create(ll);
  });
}

// !area---------------------------------------------->
_.area = {};
_.area.create = function(index){
  var THIS = this;
  $('#addrDisp,#areaDisp,#saveDisp').html('&nbsp;');
  $('#addrDisp').addClass('loader');
  //THIS.remove();

  THIS.get(index, function(json){
    $('#addrDisp').removeClass('loader');

    if(json.type == 'pref'){
      _.pref.create(json);
      return;
    }

    if(json.pref){
      var addr = json.pref;
      if(json.city) addr += ' ' + json.city;
      $('#addrDisp').html(addr);
    }

    if(json.count > 0){
      var result = json.result;
      for(var i in result){
        var res = result[i];
        if(res.enc){
          var path = google.maps.geometry.encoding.decodePath(res.enc);
        }else if(res.path){
          var path = [];
          for(var i in res.path){
            var pt = res.path[i].split(',');
            var lat = pt[0];
            var lng = pt[1];
            path.push(new google.maps.LatLng(lat, lng));
          }
        }
        if(path){
          var polygon = _.area.polygon(path,res.id);
          //polygon.city = res.city;
          _.AREA[res.id] = polygon;
          if(!res.enc){
            var enc = google.maps.geometry.encoding.encodePath(path);
            _.area.encSave(res.id,enc);
          }
        }
      }


      return;
    }
    $('#addrDisp').html('境界データがヒットしませんでした。');
    //THIS.remove();
  });
}

_.area.get = function(index, callback){
  var bds = map.getBounds();
  //var q = {};
  //q.cmd = 'getArea';
  //q.ll = ll.toUrlValue();
  //if(_.PREF) q.pref = 1;
  //var url = _.BP + 'api.php?' + _.query(q);
  //$.get(url,null,function(json){
  	var json = data[index];
    if(json.error){
      $('#addrDisp').html(json.error);
      $('#addrDisp').removeClass('loader');
      return;
    }
    if(callback) callback(json);
  //},'json');
}

_.area.polygon = function(path,id){
  var opts = {
    paths: path,
    strokeColor: _.PREF ? '#0055ee' : "#0055ee",
    strokeOpacity: 0.8,
    strokeWeight: 4,
    fillColor: _.PREF ? '#0055ee' : "#FF0000",
    fillOpacity: 0.00
  }
  var polygon = new google.maps.Polygon(opts);
  polygon.setMap(map);

  google.maps.event.addListener(polygon,'click',function(res){
    var ll = res.latLng;
    if(_.MARKER){
      _.MARKER.setPosition(ll);
      if(id && _.AREA[id]){
        var res = _.AREA[id];
        var city = res.city ? '(' + res.city + ')' : '';
        $('#city').html(city);
      }
    }
  });

  //map.panBy(0,1);
  //_.AREA.push(polygon);
  return polygon;
}

_.area.remove = function(){
  for(var i in _.AREA){
    _.AREA[i].setMap(null);
    delete _.AREA[i];
  }
}

_.area.encSave = function(id,enc){
  var q = {};
  q.cmd = 'saveEnc';
  q.id = id;
  //q.enc = enc;
  var url = _.BP + 'api.php?' + _.query(q);
  $.post(url,{enc:enc},function(res){
    if(res == '1') $('#saveDisp').html('●');
  },'html');
}

// !pref---------------------------------------------->
_.pref = {};
_.pref.toggle = function(v){
  _.PREF = v;
  if(_.MARKER){
    var ll = _.MARKER.getPosition();
    _.area.create(ll);
  }
}

_.pref.create = function(json){
  var addr = json.pref + ' <small id="city"></small>'
  $('#addrDisp').html(addr);
  if(json.city) $('#city').html('(' + json.city + ')');

  if(!json.count) return;
  $('#areaDisp').html(json.count + '市区町村');
  var result = json.result;
  for(var i in result){
    var res = result[i];
    if(res.enc){
      var path = google.maps.geometry.encoding.decodePath(res.enc);
    }else if(res.path){
      var path = [];
      for(var i in res.path){
        var pt = res.path[i].split(',');
        var lat = pt[0];
        var lng = pt[1];
        path.push(new google.maps.LatLng(lat, lng));
      }
    }
    if(path){
      var polygon = _.area.polygon(path,res.id);
      polygon.city = res.city;
      _.AREA[res.id] = polygon;
    }
  }
}