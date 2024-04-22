// https://js.langchain.com/docs/get_started/quickstart

import { Readable } from "node:stream"

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import Fastify from 'fastify'

import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
})

const DEFAULT_TOPIC = "Dogs";

fastify.get('/joke', async function(request, reply) {
  const { topic = DEFAULT_TOPIC } = request.query;

  const stream = Readable();
  stream._read = () => { };

  if (topic === DEFAULT_TOPIC) {
    stream.push("Hint: You can define the topic for the joke using the 'topic' parameter\n\n");
  }

  const chatModel = new ChatOpenAI({
    temperature: 0.9,
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
          // Here we just forward everything we receive to the stream
          // We could also collect chunks until we have a full paragraph instead. Might
          // be better for text to speech.
          stream.push(token);
        },
        handleLLMEnd(output, runId) {
          // Print some stats
          console.log(`Run ID: ${runId} for topic "${topic}"`);
          console.log(`Total tokens: ${output.llmOutput.estimatedTokenUsage.totalTokens}`);
          console.log();

          // Send term signal
          stream.push(null);
        }
      },
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "Given a keyword you tell a funny joke about it"],
    ["user", "{input}"],
  ]);

  const chain = prompt.pipe(chatModel);

  await chain.invoke({
    input: topic,
  });

  reply.header('Content-Type', 'text/html; charset=utf-8')

  // This would be the correct response header
  // reply.header('Content-Type', 'application/octet-stream')

  return await reply.send(stream)
})

// Run the server
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

