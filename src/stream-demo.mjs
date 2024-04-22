import { Readable } from "node:stream"

import Fastify from 'fastify'
import TailFile from "@logdna/tail-file";

const fastify = Fastify({
  logger: true
})

// delayed and chunkedMsgGenerator are helpers to simulate some external API response
function delayed(time, value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), time);
  });
}

const chunkedMsgGenerator = async function*(text, delay = 500) {
  const chunks = text.split(" ");

  for (const chunk of chunks) {
    yield delayed(delay, `${chunk} ` + "\n"); // "\n" marks the end of a chunk
  }
}

// Return a stream and close the socket after it's finished
// `curl --get --data-urlencode "msg=Hi there, I heard you like streams" localhost:3000/streams`
fastify.get('/streams', async function(request, reply) {
  const { msg = "Set a custom message via a 'msg' GET parameter" } = request.query;

  // Create a ReadableStream to hold the response chunks
  // In this case we create it directly from a generator function
  // We could also pipe another stream into it or push data directly
  // via stream.push("chunk"). This is just conventient for demonstration
  const stream = Readable.from(chunkedMsgGenerator(msg), { encoding: 'utf8' });

  // This is for debugging in the browser, using cURL is advised though
  // Chrome needs text/html, otherwise it will buffer the response
  // Firefox would work with text/plain, but needs charset=utf-8, otherwise it will buffer as well
  // cURL works regardless
  reply.header('Content-Type', 'text/html; charset=utf-8')

  // This would be the correct response header
  // reply.header('Content-Type', 'application/octet-stream')

  return reply.send(stream)
})


// Pipe one stream into another
// Here we keep a file handle and the HTTP socket open and push the file contents
// to our response stream as it changes
// `curl localhost:3000/keepalive`
fastify.get('/keepalive', async function(request, reply) {
  const stream = Readable();
  stream._read = () => { };

  // Tail the file using @logdna/tail-file and push new lines as they come up
  // You can push new data to the stream by editing the file in your editor
  // or in your shell with `echo "Hi there\!" >> streamdata`
  new TailFile('./streamdata', { encoding: 'utf8', startPos: 0 })
    .on('data', (chunk) => {
      stream.push(chunk);
    })
    .on('tail_error', (err) => {
      console.error(err)
    })
    .start()
    .catch((err) => {
      console.error(err)
    })

  // Again, just for debugging in the browser
  reply.header('Content-Type', 'text/html; charset=utf-8')

  return await reply.send(stream)
})

// Run the server
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

