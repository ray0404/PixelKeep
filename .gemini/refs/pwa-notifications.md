# Notification

Limited availability

This feature is not Baseline because it does not work in some of the most widely-used browsers.

- Learn more
- See full compatibility
- Report feedback

**Secure context:** This feature is available only in secure contexts (HTTPS), in some or all supporting browsers.

**Note:** This feature is available in Web Workers.

The **`Notification`** interface of the Notifications API is used to configure and display desktop notifications to the user.

These notifications' appearance and specific functionality vary across platforms but generally they provide a way to asynchronously provide information to the user.

## Constructor

`Notification()`
:   Creates a new instance of the `Notification` object.

## Static properties

*Also inherits properties from its parent interface, `EventTarget`*.

`Notification.permission` Read only
:   A string representing the current permission to display notifications. Possible values are:

    - `denied` — The user refuses to have notifications displayed.
    - `granted` — The user accepts having notifications displayed.
    - `default` — The user choice is unknown and therefore the browser will act as if the value were denied.

`Notification.maxActions` Read only Experimental
:   The maximum number of actions supported by the device and the User Agent.

## Instance properties

*Also inherits properties from its parent interface, `EventTarget`*.

`Notification.actions` Read only Experimental
:   The actions array of the notification as specified in the constructor's `options` parameter.

`Notification.badge` Read only
:   A string containing the URL of an image to represent the notification when there is not enough space to display the notification itself such as for example, the Android Notification Bar. On Android devices, the badge should accommodate devices up to 4x resolution, about 96 by 96 px, and the image will be automatically masked.

`Notification.body` Read only
:   The body string of the notification as specified in the constructor's `options` parameter.

`Notification.data` Read only
:   Returns a structured clone of the notification's data.

`Notification.dir` Read only
:   The text direction of the notification as specified in the constructor's `options` parameter.

`Notification.icon` Read only
:   The URL of the image used as an icon of the notification as specified in the constructor's `options` parameter.

`Notification.image` Read only Experimental
:   The URL of an image to be displayed as part of the notification, as specified in the constructor's `options` parameter.

`Notification.lang` Read only
:   The language code of the notification as specified in the constructor's `options` parameter.

`Notification.renotify` Read only Experimental
:   Specifies whether the user should be notified after a new notification replaces an old one.

`Notification.requireInteraction` Read only
:   A boolean value indicating that a notification should remain active until the user clicks or dismisses it, rather than closing automatically.

`Notification.silent` Read only
:   Specifies whether the notification should be silent — i.e., no sounds or vibrations should be issued regardless of the device settings.

`Notification.tag` Read only
:   The ID of the notification (if any) as specified in the constructor's `options` parameter.

`Notification.timestamp` Read only Experimental
:   Specifies the time at which a notification is created or applicable (past, present, or future).

`Notification.title` Read only
:   The title of the notification as specified in the first parameter of the constructor.

`Notification.vibrate` Read only Experimental
:   Specifies a vibration pattern for devices with vibration hardware to emit.

## Static methods

*Also inherits methods from its parent interface, `EventTarget`*.

`Notification.requestPermission()`
:   Requests permission from the user to display notifications.

## Instance methods

*Also inherits methods from its parent interface, `EventTarget`*.

`Notification.close()`
:   Programmatically closes a notification instance.

## Events

*Also inherits events from its parent interface, `EventTarget`*.

`click`
:   Fires when the user clicks the notification.

`close`
:   Fires when the user closes the notification.

`error`
:   Fires when the notification encounters an error.

`show`
:   Fires when the notification is displayed.

## Examples

Assume this basic HTML:

It's possible to send a notification as follows — here we present a fairly verbose and complete set of code you could use if you wanted to first check whether notifications are supported, then check if permission has been granted for the current origin to send notifications, then request permission if required, before then sending a notification.

We no longer show a live sample on this page, as Chrome and Firefox no longer allow notification permissions to be requested from cross-origin `<iframe>`s, with other browsers to follow. To see an example in action, check out our To-do list example (also see the app running live).

**Note:**
In the above example we spawn notifications in response to a user gesture (clicking a button). This is not only best practice — you should not be spamming users with notifications they didn't agree to — but going forward browsers will explicitly disallow notifications not triggered in response to a user gesture. Firefox is already doing this from version 72, for example.

## Specifications



| Specification |
| --- |
| Notifications API # api |

## Browser compatibility

## See also

- Using the Notifications API

## Help improve MDN

Learn how to contribute

This page was last modified on ⁨Jun 23, 2025⁩ by MDN contributors.

View this page on GitHub • Report a problem with this content
