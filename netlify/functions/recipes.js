const OpenAI = require("openai");

exports.handler = async function(event, context) {
  console.log("🔸 Incoming request:", event);

  if (event.httpMethod !== "POST") {
    console.log("❌ Invalid HTTP method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Only POST method allowed" }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
    console.log("✅ Parsed request body:", data);
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { ingredients } = data;

  if (!ingredients || ingredients.trim() === "") {
    console.log("❌ Missing ingredients in request.");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ingredients" }),
    };
  }

  try {
    const prompt = `Suggest 3 easy recipes using these ingredients: ${ingredients}. Format as a numbered list with recipe names, ingredient quantities, and step-by-step directions for each.`;
    console.log("🔸 Prompt being sent to OpenAI:", prompt);

    // New OpenAI client init
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // New chat completion call
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful recipe generator." },
        { role: "user", content: prompt },
      ],
    });

    console.log("✅ OpenAI API response:", response);

    const generatedText = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ recipes: generatedText || "No recipes found." }),
    };

  } catch (error) {
    console.error("❌ OpenAI API request failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "OpenAI request failed" }),
    };
  }
};
