// This is our emotion/sentiment detection ffor the mental journal. It uses j-hartmann's emotion-english-distilroberta model, and transformers.js
// to allow us to use AI models entirely within the browser. The process is entirely local, except for the downloading of the model. 


// This is an import statement. It's a piece of code that allows us to use libraries, which if you didn't already know are pieces of
// code written by other people so that we can use them in our applications. 
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';
let analyzer;

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
  const progresstext = document.querySelector(".test")
  
  // Env means environment, and it is how we will configure the settings that the model will use.
  env.allowRemoteModels = false; 
  env.localModelPath = 'https://orpheus.spiritualsworld.xyz/ai-test/models' //Repl.it won't let me upload the files, so I'm just fetching it from my server.
  analyzer = await Pipeline.getInstance((data) => {
    if (data.status == "progress") {
      progresstext.innerHTML = `MODEL LOADING. PROGRESS: ${data.progress}`
    } else {
      progresstext.innerHTML = "DONE. START TYPING. WHENEVER SPACE IS PRESSED, THE ENTIRE PASSAGE WILL BE ANALYZED."
    }
  });
}

async function analyzeTextEmotion() {
  const inputbox = document.getElementById("textarea"); 
  // Here is where we would make any changes to the text before giving it to the model.
  const sentences = inputbox.value.match(/[^.!?]+[.!?]+/g);
  const lastSentence = getLastSentences(sentences)
  const result = await analyzer(lastSentence, { topk: 2 }); 

  

  
  document.querySelector(".test").innerHTML = result[0].label;
  setColorOfBackground(result[0])
}

function getLastSentences(sentences) {
  if (sentences.length >= 2) {
    return sentences.slice(-2).map(sentence => sentence.trim()).join(' ');
  } else if (sentences.length === 1) {
    return sentences[0].trim();
  } 
}


function setColorOfBackground(result) {
  const div = document.getElementById("textarea")
  const emotion = result.label
  const score = result.score
  
  switch (emotion) {
    case "anger":
      div.style.backgroundColor = `rgba(219, 68, 55, ${score})`;
      break;
    case "disgust":
      div.style.backgroundColor = `rgba(104, 159, 56, ${score})`;
      break;
    case "fear":
      div.style.backgroundColor = `rgba(185, 41, 185, ${score})`;
      break;
    case "joy":
      div.style.backgroundColor = `rgba(255,255,0,${score})`;
      break;
    case "neutral":
      div.style.backgroundColor = `rgba(211, 207, 205, ${score})`;
      break;
    case "sadness":
      div.style.backgroundColor = `rgba(173, 216, 230, ${score})`;
      break;
    case "surprise":
      div.style.backgroundColor = `rgba(255,165,0,${score})`;
      break;
  }
}


setup();


document.addEventListener("keyup", function(event) {
  if (event.key == '.' || event.key == '!' || event.key == '?') {
    analyzeTextEmotion()
  }
})





