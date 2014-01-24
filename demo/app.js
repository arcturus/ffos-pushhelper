// Perform a request against the simplepushclient server
var doRequest = function doPost(type, uri, data, cb) {
  var xhr = new XMLHttpRequest({mozSystem: true});

  xhr.onload = function onLoad(evt) {
    if (xhr.status === 200 || xhr.status === 0) {
      cb(null, xhr.response);
    } else {
      cb(xhr.status);
    }
  };
  xhr.open(type, uri, true);
  xhr.onerror = function onError(e) {
    console.error('onerror en xhr ' + xhr.status);
    cb(e);
  }
  xhr.send(data);
};

window.PushHelper.debug = true;

window.PushHelper.listen('messages', 
  function(version, endPoint, callback) {
    doRequest('GET', 'http://simplepushclient.eu01.aws.af.cm/api/v1/' +
      version + '?client=' + endPoint, null,
      function(err, data) {
        if (err) {
          alert('Cannot get message with version ' + version);
        } else {
          callback(data);
        }
      });
  },
  function(message) {
    alert(message);
  }
);

window.PushHelper.register(function(channels) {
  var channel = channels[0];
  var data = new FormData();
  data.append('client', channel.endPoint);
  doRequest('POST', 'http://simplepushclient.eu01.aws.af.cm/api/v1/register', data,
    function(err, res) {
      if (err) {
        alert('Error registering');
      } else {
        alert('Register to receive push notifications');
      }
    });
});

window.PushHelper.init();
