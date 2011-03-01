(function (undefined, JS2) {
  JS2.require = function(file, callback) {
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    } else { 
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
        try {
          eval(JS2.render(xmlhttp.responseText));
        } catch(e) {
          console.log(JS2.render(xmlhttp.responseText));
        }
        if (callback) callback(xmlhttp.responseText);
      }
    }

    xmlhttp.open("GET",file,true);
    xmlhttp.send();
  }
})(undefined, JS2);
