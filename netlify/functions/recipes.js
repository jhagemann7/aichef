const axios = require("axios");

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
    const prompt = `Suggest 3 easy recipes using these ingredients: ${ingredients}. Format as a numbered list with recipe names, ingredient quantities, and step-by-step directions for each.`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-small",
      {
        inputs: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    const generatedText = response.data[0]?.generated_text;

    return {
      statusCode: 200,
      body: JSON.stringify({ recipes: generatedText || "No recipes found." }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Hugging Face request failed" }),
    };
  }
};
