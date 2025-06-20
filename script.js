// Grab DOM elements
const ingredientInput = document.getElementById("ingredient-input");
const commonIngredientsList = document.getElementById("common-ingredients-list");
const yourIngredientsBox = document.getElementById("your-ingredients");
const recipesContainer = document.getElementById("recipes-container");
const addIngredientForm = document.getElementById("add-ingredient-form");

// Store selected ingredients in a Set for easy add/remove
const selectedIngredients = new Set();

// Function to update the "Your Ingredients" box display
function updateYourIngredients() {
  yourIngredientsBox.innerHTML = "";

  selectedIngredients.forEach((ingredient) => {
    const span = document.createElement("span");
    span.textContent = ingredient;
    span.className = "ingredient-chip";

    // Add remove 'X' on hover
    const removeX = document.createElement("span");
    removeX.textContent = " ×";
    removeX.className = "remove-x";
    removeX.onclick = () => {
      selectedIngredients.delete(ingredient);
      updateYourIngredients();
    };
    span.appendChild(removeX);

    yourIngredientsBox.appendChild(span);
  });
}

// Add ingredient when clicked from common list
commonIngredientsList.addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("ingredient-item")) {
    selectedIngredients.add(e.target.textContent);
    updateYourIngredients();
  }
});

// Handle typing your own ingredient and pressing enter
addIngredientForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newIngredient = ingredientInput.value.trim();
  if (newIngredient && !selectedIngredients.has(newIngredient)) {
    selectedIngredients.add(newIngredient);
    updateYourIngredients();
    ingredientInput.value = "";
  }
});

// Function to call backend API to get recipes

function cleanRecipeText(text) {
  if (!text) return '';
  // Remove leading/trailing asterisks and trim whitespace
  return text.replace(/^\*+|\*+$/g, '').trim();
}

async function fetchRecipes() {
  if (selectedIngredients.size === 0) {
    recipesContainer.textContent = "Please add some ingredients first.";
    return;
  }

  recipesContainer.textContent = "Loading recipes...";

  try {
    const response = await fetch("/.netlify/functions/recipes", {
      method: "POST",
      body: JSON.stringify({
        ingredients: Array.from(selectedIngredients).join(", "),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(data);  // add this line to see what's coming back

    if (data.recipes) {
      const cleanText = cleanRecipeText(data.recipes);
      // Use textContent inside <pre> by creating element, or just do this:
      recipesContainer.innerHTML = `<pre></pre>`;
      recipesContainer.querySelector('pre').textContent = cleanText;
    } else if (data.error) {
      recipesContainer.textContent = `Error: ${data.error}`;
    } else {
      recipesContainer.textContent = "Unexpected error.";
    }
  } catch (err) {
    recipesContainer.textContent = `Request failed: ${err.message}`;
  }
}

// You can trigger fetchRecipes with a button click or whenever you want:
document.getElementById("get-recipes-btn").addEventListener("click", fetchRecipes);

