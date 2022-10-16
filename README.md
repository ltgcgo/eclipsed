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

### `upgradeEventSource(Request: request)`
Upgrade an incoming HTTP request to an `EventSource` connection.

Returns an object containing the needed response body and the `EventSourceServer` socket.

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
Enqueues data to be transmitted, same as [`WebSocket.send()`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send).

#### `.onclose`
Fired when an `EventSource` connection closes.

#### `.onerror`
Fired when an `EventSource` connection errors out.


#### `.onopen`
Fired when an `EventSource` connection establishes.
