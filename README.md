# Setup

* `cp .env.example .env`
* Add your chatgpt API key
* Install dependencies `npm install` / `pnpm i`
* Run `node src/stream-demo.mjs` or `node src/chatgpt-demo.mjs` 

# HTTP Streams Demo

> `src/stream-demo.mjs`

A quick demo showcasing ways to work with HTTP streams in node with two endpoints.

1. `/streams` accepts a GET parameter `msg` and returns that text as a stream with 500ms delay between the words.
2. `/keepalive` keeps the connection open and returns values from the local file `streamdata`. You can play with it by pushing more lines to the file (`echo "Lorem ipsum" >> streamdata`). The new lines will be streamed to the connected client(s).

Easiest to test using cURL, e.g. `curl --get --data-urlencode "msg=Hai there, I heard you like streams" localhost:3000/streams` or `curl localhost:3000/keepalive` but works in the browser too.

# ChatGPT Demo

> `src/chatgpt-demo.mjs` 

Another demo showcasing a way to forward received tokens to a stream.

`/joke` accept a GET parameter `topic` and returns a joke considering the provided or default topic. The next step would be to forward either the whole text or passages to a text 2 speech service. The demo is using langchain (https://js.langchain.com/docs/get_started/quickstart).
