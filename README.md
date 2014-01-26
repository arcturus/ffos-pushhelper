# ffospushhelper

Helper library for handling and configuring Push Notifications in Firefox OS.

## About

[Simple Push API](https://developer.mozilla.org/en-US/docs/WebAPI/Simple_Push) by Mozilla, allows us to receive push notifications in our Firefox OS.

This protocol requires the developer to do the following:

- Register a channel (or several) per app: *(happening in the phone)*
  - Call Simple Push API.
  - Store locally for previous use.
- Tell your server side which channel can use to send notifications *(happening in the phone)*.
- Send the push notificaion *(happening in your server side)*
- Receive the push notification: *(happening in the phone)*
  - Listen to push notifications.
  - Identify which from which channel we received the notification.
- Ask our server side what's the content of the notification *(happening in your server side)*.

As you see there are several steps happening in your Firefox OS app. This library helps you to deal with all the operations you have to do in the phone.

The library get tracks of the current data, so won't need to register a new channel for push anytime, it will keep track of the current status and what are the operations to perform.

## Installation

Using Bower:

```sh
    bower install ffos-pushhelper
```

Or grab the [source](https://github.com/arcturus/ffos-pushhelper/dist/ffospushhelper.js) ([minified](https://github.com/arcturus/ffos-pushhelper/dist/ffospushhelper.min.js)).

## Usage

Basic usage is as follows:

```javascript
// Listen to a new notification channel, register a callback for an action
// when we get the notification.
window.PushHelper.listen('notifications', null, function onNotifiaction() {
  alert('We got a notification');
});

// Tell your server the channels to communicate
// with this phone.
// This will happen just once, once saved, this operation
// won't be executed, the library will know when it has
// to perform this operation.
window.PushHelper.register(function saveMyChannels(channels) {
  // Your logic to send the data goes here
});

// Start listening to push messages.
window.PushHelper.init();
```

Below an example asking for what the notificaion is about
```javascript
// Listen to a new notification channel, write a function for resolving what
// the notification mens, register a callback for an action when we 
// get that content.
window.PushHelper.listen('notifications', function onNotification(version, channel, cb) {
  // Go to your server and ask what's the content for version <version>
  // for an specific user <unique channel> 
  // Once we get the data, just call to the callback parameter.
  ...
  cb(data)
}, function onData(data) {
  alert(data);
});

// Tell your server the channels to communicate
// with this phone.
window.PushHelper.register(function saveMyChannels(channels) {
  // Your logic to send the data goes here
});

// Start listening to push messages.
window.PushHelper.init();
```

### Note

Remember to enable push notifications in your application manifest:
```json
 ....
"permissions": {
  "push": {}
},
"messages": [
  { "push": "/index.html"}
] 
```

For advanced usage, see the documentation.

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## License

MIT. See `LICENSE.txt` in this directory.
