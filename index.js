import "dotenv/config";
import readlineSync from "readline-sync";

const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPEN_AI_API_KEY,
});

const tools = {
  getWeatherDetails: getWeatherDetails,
};

// Tools
function getWeatherDetails(city = "") {
  if (city.toLocaleLowerCase() === "delhi") {
    return "The weather in Delhi is 30°C with clear skies.";
  }
  if (city.toLocaleLowerCase() === "mumbai") {
    return "The weather in Mumbai is 28°C with light rain.";
  }
  if (city.toLocaleLowerCase() === "bangalore") {
    return "The weather in Bangalore is 25°C with scattered clouds.";
  }
  if (city.toLocaleLowerCase() === "varanasi") {
    return "The weather in Varanasi is 32°C with sunny conditions.";
  }
  return "Weather details not available for the specified city.";
}

const SYSTEM_PROMPT = `You are an AI assistant with START, PLAN, ACTION, Observation and Output states.
Wait for the user prompt and first PLAN using the available tools.
After Planning, Take the action using the available tools and wait for observation based on the action.
Once you have the observation, Return the AI response based on START prompt and observation.

Strictly follow the JSON output format as in examples.

Available tools:
- function getWeatherDetails(city: string) : string - Get the weather details for a given city.


EXAMPLE:
START
{"type": "user", "user":"what is the sum of weather in Delhi and Mumbai?"}
{"type": "plan", "plan":"To answer the user's question, I will first get the weather details for Delhi and Mumbai using the getWeatherDetails function."}
{"type": "action", "function":"getWeatherDetails", "input":"Delhi"}
{"type": "observation", "observation":"The weather in Delhi is 30°C with clear skies."}
{"type" : "plan", "plan": "Now I will get the weather details for Mumbai."}
{"type": "action", "function":"getWeatherDetails", "input":"Mumbai"}
{"type": "observation", "observation":"The weather in Mumbai is 28°C with light rain."}
{"type": "output", "output":"The weather in Delhi is 30°C and in Mumbai is 28°C. The sum of the weather of mumbai and delhi is 58°C."}


`;

const message = [
  {
    role: "system",
    content: SYSTEM_PROMPT, // Set the system prompt for the AI
  },
];

while (true) {
  const query = readlineSync.question(">>"); // Get user input from the console
  const q = {
    type: "user",
    user: query,
  };
  message.push({ role: "user", content: JSON.stringify(q) }); // Add user input to the message array
  console.log("User:", query);

  while (true) {
    const response = await client.chat.completions.create({
      model: "deepseek/deepseek-r1-0528-qwen3-8b:free", // Use the appropriate model, DeepSeek API may not support this model
      messages: message,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    // console.log("AI:", content); // Log AI response to the console

    message.push({ role: "assistant", content: content }); // Add AI response to the message array

    const call = JSON.parse(content); // Parse the AI response to JSON

    if (call.type == "output") {
      console.log("Final Output:", call.output); // Log the final output to the console
      break; // Exit the loop if the output type is "output"
    } else if (call.type == "action") {
      // Call the function specified in the action
      const fn = tools[call.function]; // Get the function from the tools object
      const observation = fn(call.input); // Use eval to call the function dynamically
      const obs = {
        type: "observation",
        "observation": observation,
      };
      console.log("Action Result:", observation); // Log the result of the action
      message.push({
        role: "developer",
        content: JSON.stringify(obs), // Add observation to message array
      }); // Add observation to message array
    }
  }
}

// call the OpenAI API to get a response
/*
client.chat.completions
  .create({
    // model: "gpt-4o", // Use the appropriate model it's not available in DeepSeek API
    model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    messages: [{ role: "user", content: user }],
  })
  .then((response) => {
    console.log(response.choices[0].message.content);
  });
*/