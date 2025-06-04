const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Only POST method allowed" }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { ingredients } = data;

  if (!ingredients || ingredients.trim() === "") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ingredients" }),
    };
  }

  try {
    const prompt = `Suggest 3 easy recipes using these ingredients: ${ingredients}. Format as a numbered list with recipe names and brief descriptions.`;

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ recipes: completion.data.choices[0].text.trim() }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "OpenAI request failed" }),
    };
  }
};
