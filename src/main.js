/* global window, module, localStorage, navigator, console */
/* jshint -W078 */
'use strict';


var PushHelper = (function PushHelper() {

  // Simple check if we have the api enabled
  // otherwise throw an error
  if (typeof navigator.push === undefined) {
    throw new Error('No Simple Push API available');
  }

  // Array to map in memory an structure containing the channels that
  // we listen for and the actual endpoints.
  //
  // CHANNELS = [
  //    {
  //      'name': 'channelName1',
  //      'endPoint': '<unique endpoint>'
  //    },
  //    {
  //      'name': 'channelName2',
  //      'endPoint': '<unique endpoint>'
  //    }
  //    ...
  // ];
  //
  var CHANNELS = [];
  // List of previous channels already that
  // were successfully registered
  var REGISTEREDCHANNELS = [];

  var pendingRegisters = 0;
  var onRegister = null;

  var errors = [];

  var DEBUG = false;

  // Try to fetch the specific channel from the storage.
  // Currently using localStorage and making this sync, but in the
  // future this should change to any kind of async storage.
  //
  // @param channelName String
  var getChannelFromStore = function getChannelFromStore(channelName) {
    if (DEBUG) {
      console.log('Do I have channel ' + channelName);
    }

    var value = localStorage[channelName];
    return value ? JSON.parse(value) : null;
  };

  // Save the current channel to storage.
  // Right now using localStorage, we should move this to async storage.
  //
  // @param channel Object Channel object
  var saveChannelToStore = function saveChannelToStore(channel) {
    var simpleChannel = {
      name: channel.name,
      endPoint: channel.endPoint
    };
    REGISTEREDCHANNELS.push(simpleChannel);
    localStorage[channel.name] = JSON.stringify(simpleChannel);
    // Also save a key with the channel endpoint containing the name
    // for double lookup
    localStorage[channel.endPoint] = channel.name;
  };

  // Setup a new channel from which we want to receive notifications.
  //
  // @param channelName String A identifier for this channel.
  // @param resolverFn Function Used to fetch the info associated
  //        to an specific version that will come in the push notification.
  //        Optional, if no specified, will go directly to the data callback.
  //        This function must have a unique parameter, that will be a function,
  //        to be call once we went to the our server for the data.
  // @param dataFn Function Will be called once the data has been resolver,
  //        if needed. Mandatory
  var listen = function listen(channelName, resolverFn, dataFn) {
    if (!channelName || !dataFn) {
      throw new Error('Invalid parameters please check documentation');
    }
    var channel = getChannelFromStore(channelName);

    if (!channel) {
      channel = {
        'endPoint': null
      };
    }

    channel.resolver = resolverFn;
    channel.data = dataFn;
    channel.name = channelName;

    CHANNELS.push(channel);
    if (DEBUG) {
      console.log('Channels is ' + CHANNELS);
    }
  };

  // Check if the channels that we are listening are not registered
  // in our app, in that case perform the register (even for multiple)
  // channels, and send the information of the callbacks to the register
  // callback to perform any storing operation in a different place than
  // the phone.
  //
  // @param registerFn Function Will be called if we need to register new
  //        channels (end points) in our server side. First param is an error
  //        object, second parameter is the result.
  var register = function register(registerFn) {
    onRegister = registerFn;
    CHANNELS.forEach(function onChannel(channel) {
      if (!channel.endPoint) {
        doRegister(channel);
      } else if (DEBUG) {
        console.log('We already have the channel ' + channel.endPoint);
	checkRegister();
      }
    });
  };

  // Register a new channel for a new endpoint
  var doRegister = function doRegister(channel) {
    if (DEBUG) {
      console.log('Registering channel ' + channel.name + ' (performing navigator.push.register)');
    }
    var req = navigator.push.register();
    pendingRegisters++;

    req.onsuccess = function onSuccess() {
      if (DEBUG) {
        console.log('Successfully registered channel ' + channel.name);
      }
      var endPoint = req.result;
      channel.endPoint = endPoint;
      saveChannelToStore(channel);
      pendingRegisters--;
      checkRegister();
    };

    req.onerror = function onError() {
      if (DEBUG) {
        console.log('Error registering channel ' + channel.name);
      }
      errors.push({
        'type': 'register',
        'data': channel.name
      });
      pendingRegisters--;
      checkRegister();
    };
  };

  // Check if we have pending registers operations, if not
  // call the onRegister callback if present.
  var checkRegister = function checkRegister() {
    if (pendingRegisters === 0 && onRegister !== null) {
      if (DEBUG) {
        console.log('Finished the registering, telling the server ' + JSON.stringify(REGISTEREDCHANNELS));
      }
      onRegister(REGISTEREDCHANNELS);
    }
  };

  function findChannel(endPoint) {
    var result;
    if (!CHANNELS) {
      return result;
    }

    CHANNELS.forEach(function (el) {
      if (el.endPoint === endPoint) {
        result = el;
      }
    });

    return result;
  }

  // Start the process, will listen for any incoming push notifications.
  var init = function init() {
    window.navigator.mozSetMessageHandler('push', function(evt) {
      var endPoint = evt.pushEndpoint;
      var version = evt.version;
      console.log('Receivied a push message: ' + endPoint + ' : ' + version);

      var channel = findChannel(endPoint);

      // Warn and don't err, if channel not registered
      if (channel === undefined) {
        console.warn('Unknown channel via endpoint ' + endPoint + ' with version ' + version);
        return;
      }

      if (channel.resolver) {
        channel.resolver(version, endPoint, channel.data);
      } else {
        channel.data();
      }
    });
  };

  // Removes any trace of configuration from localStorage
  var reset = function reset(channelNames) {
    CHANNELS = [];
    REGISTEREDCHANNELS = [];
    if (!channelNames || !Array.isArray(channelNames)) {
      return;
    }

    channelNames.forEach(function (channel) {
      var info = JSON.parse(localStorage[channel]);
      delete localStorage[info.endPoint];
      delete localStorage[channel];
    });
  };

  return {
    'listen': listen,
    'register': register,
    'init': init,
    'reset': reset,
    set debug(bol) {
      DEBUG = !!bol;
    }
  };

})();

if (typeof module === undefined && window) {
  window.PushHelper = PushHelper;
} else if (!window) {
  module.exports = PushHelper;
}
