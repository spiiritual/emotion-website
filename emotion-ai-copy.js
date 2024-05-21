// This is our emotion/sentiment detection ffor the mental journal. It uses j-hartmann's emotion-english-distilroberta model, and transformers.js
// to allow us to use AI models entirely within the browser. The process is entirely local, except for the downloading of the model. 


// This is an import statement. It's a piece of code that allows us to use libraries, which if you didn't already know are pieces of
// code written by other people so that we can use them in our applications. 
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';
let analyzer;
let lastEmotion;

// https://github.com/xenova/transformers.js/blob/main/examples/extension/src/background.js
// Here, I am creating a new class called Pipeline, which will be used to load the AI model 
// and use it to analyze the text.
class Pipeline {
  static task = "sentiment-analysis"
  static model = "j-hartmann/emotion-english-distilroberta-base"
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) { //If the model is not loaded yet,
      this.instance = pipeline(this.task, this.model, { progress_callback }); //It loads the model and puts a progress meter for the loading.
    }
    return this.instance;
  }
}

async function setup() {
  const textarea = document.getElementById("textarea")

  // Env means environment, and it is how we will configure the settings that the model will use.
  env.allowRemoteModels = false;
  env.localModelPath = 'https://orpheus.spiritualsworld.xyz/ai-test/models' //Repl.it won't let me upload the files, so I'm just fetching it from my server.
  analyzer = await Pipeline.getInstance((data) => {
    if (data.status == "progress") {
      textarea.placeholder = "Loading model..."
    }
  });

  textarea.placeholder = "This is Clear, a mental journaling app where you can write what you want, modify what you wrote and save it for later, and see what you wrote in the past. As you type, your emotions will determine the colors you see. Start typing here..."

  textarea.disabled = false;

}

export async function analyzeTextEmotion() {
  const inputbox = document.getElementById("textarea");
  const lastWords = getLastWords(inputbox.value, 15)
  const result = await analyzer(lastWords, { topk: 2 });

  setColorOfBackground(result[0])
}

function getLastWords(input, amount) {
  const sentences = input.trim();
  const wordArray = sentences.split(" ");
  let lastwords;

  if (wordArray.length > amount) {
    lastwords = wordArray.slice((amount * -1)).join(" ");
  } else {
    lastwords = sentences;
  }

  return lastwords;

}

export async function analyzeEntireText(input) {
  const result = await analyzer(input);
  return result;
}

export function setColorOfBackground(result) {
  const div = document.getElementById("textarea");
  const emotion = result.label;
  const score = result.score;
  const fadedColors = {
    "anger": "rgba(219, 68, 55, 0.1)",
    "disgust": "rgba(104, 159, 56, 0.1)",
    "joy": "rgba(255,255,0,0.1)",
    "fear": "rgba(185, 41, 185, 0.1)",
    "neutral": "rgba(211, 207, 205, 0.1)",
    "sadness": "rgba(173, 216, 230, 0.1)",
    "surprise": "rgba(255,165,0,0.1)"
  };

  if (lastEmotion == emotion) {
    return;
  } else {
    if (lastEmotion) {
      document.getElementById(lastEmotion).style.backgroundColor = fadedColors[lastEmotion];
    }
  }

  switch (emotion) {
    case "anger":
      div.style.backgroundColor = `rgba(219, 68, 55, ${score})`;
      document.getElementById("anger").style.backgroundColor = 'rgba(219, 68, 55, 1)';
      break;
    case "disgust":
      div.style.backgroundColor = `rgba(104, 159, 56, ${score})`;
      document.getElementById("disgust").style.backgroundColor = 'rgba(104, 159, 56, 1)';
      break;
    case "fear":
      div.style.backgroundColor = `rgba(185, 41, 185, ${score})`;
      document.getElementById("fear").style.backgroundColor = 'rgba(185, 41, 185, 1)';
      break;
    case "joy":
      div.style.backgroundColor = `rgba(255,255,0,${score})`;
      document.getElementById("joy").style.backgroundColor = 'rgba(255,255,0,1)';
      break;
    case "neutral":
      div.style.backgroundColor = `rgba(211, 207, 205, ${score})`;
      document.getElementById("neutral").style.backgroundColor = 'rgba(211, 207, 205)';
      break;
    case "sadness":
      div.style.backgroundColor = `rgba(173, 216, 230, ${score})`;
      document.getElementById("sadness").style.backgroundColor = 'rgba(173,216,230)';
      break;
    case "surprise":
      div.style.backgroundColor = `rgba(255,165,0,${score})`;
      document.getElementById("surprise").style.backgroundColor = 'rgba(255, 165, 0)';
      break;
  }

  lastEmotion = emotion;
}


setup();


document.addEventListener("keyup", function(event) {
  if (event.code == "Space") {
    analyzeTextEmotion()
  }
})





