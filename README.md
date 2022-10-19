# Eclipsed
🗣 The Royal Canterlot Voice for the [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) API. Supports Cloudflare Workers, Deno and bun.js.

Node.js support isn't considered, and this project would not get uploaded to NPM.

## Naming
_I thank thee, dear Fluttershy!_

The name of this project is a reference to MLP:FiM S02E04, _Luna Eclipsed_.

## Usage
### Download
Eclipsed can be fetched from sources listed below.
* GitHub releases
* Deno modules

### API
It's pretty simple to use, just like [`Deno.upgradeWebSocket`](https://deno.land/api?s=Deno.upgradeWebSocket)! Although, because `EventSource` is unidirectional, you cannot receive messages from clients.

### `upgradeEventSource(Request: request, String: serviceId)`
Upgrade an incoming HTTP request to an `EventSource` connection. Returns an object containing the needed response body and the `EventSourceServer` socket.

_Define a unique `serviceId` if you want to utilize the built-in transparent retransmission support._ (not implemented yet)

```
{
	socket: EventSourceServer,
	response: Response
}
```

### `EventSourceServer`
#### `.readyState` _readonly_
A number representing the state of the connection. Possible values are `CONNECTING` (`0`), `OPEN` (`1`), or `CLOSED` (`2`).

#### `.close()`
Closes the connection, and set the `readyState` attribute to `CLOSED`. If the connection is already closed, this method does nothing.

#### `.send(data)`
Enqueues data to be transmitted, same as [`WebSocket.send()`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send). Event types, retry lengths and IDs cannot be set with this method.

#### `.sendAs(eventObject)`
Enqueues data to be transmitted. Event types, retry lengths and IDs can be set with this method.

```
{
	retry: Number,
	event: String,
	id: String,
	data: String
}
```

#### `.setEvent(String: eventType)`
Sets event type of the current event message. Does nothing if provided with a blank value.

#### `.setID(String: id)`
Sets event ID of the current event message. Will generate a randomized ID if provided with a blank value, or no ID is set.

#### `.setRetry(Number: retryTime)`
Sets the client retry time in milliseconds. Does nothing if the provided value isn't an integer, smaller than `1`, or greater than `3600000`.

#### `.setData(String: data)`
Appends string data to the current message. Does nothing if the provided value isn't a string.

When this is first called in a message, event type, ID and retry will all be sent at the same time as well if defined. Setting said fields after sending the first chunk of data won't achieve anything.

#### `.setCommit()`
Sends the current event to the client. Does nothing if there are nothing to send.

#### `.onclose`
Fired when an `EventSource` connection closes.

#### `.onerror`
Fired when an `EventSource` connection errors out.
