import { analyzeTextEmotion, analyzeEntireText, setColorOfBackground } from './emotion-ai-copy.js';

let api_key;
let entries = [];
let firstRun = true;

async function getChatGPTAPIKey() {
  fetch("https://orpheus.spiritualsworld.xyz/key?authkey=*LprL%EmvVv2*")
    .then(response => response.text())
    .then(key => api_key = key);
}

async function changeTextWithChatGPT(change) {
  const text = document.getElementById("textarea").value;
  const big = document.getElementById("big");
  const slight = document.getElementById("slight");

  const body = {
    "model": "gpt-3.5-turbo",
    "messages": [
      { "role": "system", "content": `You are an assistant for a mental journaling app. Your job is to analyze the text and change it ${change} to be less triggering to the user.` },
      { "role": "user", "content": text }
    ],
    "stream": true
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${api_key}`
    },
    body: JSON.stringify(body) // Add this line to send the body as JSON
  })


  // https://stackoverflow.com/a/75751803 
  // where i learned how to read eventreader stream
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    } else {
      const responsearray = value.split('\n');

      responsearray.forEach((data) => {
        if (data.length == 0 || data.startsWith(":") || data == "data: [DONE]") {
          return;
        }

        if (data.finish_reason == null) {
          let json;
          try {
            json = JSON.parse(data.substring(6));
          } catch (error) {
            console.log(error)
            console.log(data)
          }
          if (json.choices[0].delta.content) {
            if (change == "a little") {
              slight.innerHTML += json.choices[0].delta.content;
              scrollSlightContainer()
            } else if (change == "a lot") {
              big.innerHTML += json.choices[0].delta.content;
              scrollBigContainer()
            }
          } else {
            return; // try to skip word i guess? 
          }
        } else {
          return;
        }
      });
    }
  }
}

async function scrollSlightContainer() {
  const slight = document.getElementById("slight")
  const version = document.querySelectorAll(".version")[1]
  version.scrollTop = slight.scrollHeight;
}

async function scrollBigContainer() {
  const big = document.getElementById("big")
  const version = document.querySelectorAll(".version")[2]
  version.scrollTop = big.scrollHeight;
}

async function makeSelectionBoxVisible() {
  document.querySelector(".select-overlay").style.display = "flex";
}

async function makeSelectionBoxInvisible() {
  document.querySelector(".select-overlay").style.display = "none";
}

async function makeInstructionsOverlayInvisible() {
  document.querySelector(".instructions-overlay-bg").style.display = "none";
}

async function makeInstructionsOverlayVisible() {
  document.querySelector(".instructions-overlay-bg").style.display = "flex";
}


async function submitEntry(text, color) {
  let data = new FormData();
  data.append("entry.1888859906", text);
  data.append("entry.297927375", color);

  const req = fetch('https://docs.google.com/forms/d/e/1FAIpQLSdm4M7yvsIjjdYC_8pjiTsnhRKvENnnYzWIBKJh61kuQnHfUQ/formResponse', {
    method: "POST",
    body: data,
    mode: "no-cors"
  }).then(
    makeSelectionBoxInvisible()
  );
}

async function loadEntries() {
  let raw_data;
  let data;
  entries = []

  const req = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQzjk-2OvACIc9ouzjvUstIgpBSEEh9Qc9dXY14GWN7cL9q-6HdP3XT68kD5t19C0NZtui9EFoFwixN/pub?output=tsv", {
    headers: {
      'pragma': 'no-cache',
      'cache-control': 'no-cache'
    }
  }).then(response => response.text()).then(response => raw_data = response);

  data = raw_data.split("\n");

  for (let i = 0; i < data.length; i++) {
    if (i !== 0 && data[i].trim() !== "") {
      entries.push(data[i].split("\t"));
    }
  }
}

async function setUpEntries() {
  const container = document.querySelector(".entries-body-container")
  container.innerHTML = '';

  document.getElementById("select-direction-text").innerHTML = "Loading..."

  const data = await loadEntries();
  for (let i = 0; i < entries.length; i++) {
    const main_element = document.createElement("div");
    const text_preview = document.createElement("p");
    const emotionWithScore = JSON.parse(entries[i][2])[0]

    main_element.classList.add("entries-body");
    text_preview.classList.add("entries-body-text");
    main_element.innerHTML = entries[i][0];
    text_preview.innerHTML = entries[i][1];
    main_element.style.background = getColorFromEmotion(emotionWithScore.label, emotionWithScore.score);

    main_element.dataset.entryNumber = i;
    main_element.addEventListener("click", function() { putEntryIntoTextArea(this.dataset.entryNumber) })

    main_element.appendChild(text_preview);


    container.appendChild(main_element)

  }

  document.getElementById("select-direction-text").innerHTML = "Choose which entry to load!";
}

function getColorFromEmotion(emotion, score) {
  switch (emotion) {
    case "anger":
      return `rgba(219, 68, 55, ${score})`;
      break;
    case "disgust":
      return `rgba(104, 159, 56, ${score})`;
      break;
    case "fear":
      return `rgba(185, 41, 185, ${score})`;
      break;
    case "joy":
      return `rgba(255,255,0,${score})`;
      break;
    case "neutral":
      return `rgba(211, 207, 205, ${score})`;
      break;
    case "sadness":
      return `rgba(173, 216, 230, ${score})`;
      break;
    case "surprise":
      return `rgba(255,165,0,${score})`;
      break;
  }
}


function putEntryIntoTextArea(i) {
  const entry = entries[i][1]
    .replace(/  /g, "\n\n")
    .trim();
  const emotion = JSON.parse(entries[i][2])
  const textarea = document.getElementById("textarea");
  textarea.value = entry;
  setColorOfBackground(emotion[0]);
  document.getElementById("select-direction-text").innerHTML = "Loading entry..."

  setTimeout(() => {
    document.querySelector(".entries-overlay").style.display = "none";
  }, 100);
}

async function handleSubmit() {
  const optionsContainer = document.querySelector(".options-container");
  const originalContainer = optionsContainer.querySelectorAll(".version")[0];
  const slightContainer = optionsContainer.querySelectorAll(".version")[1];
  const mostContainer = optionsContainer.querySelectorAll(".version")[2];
  const big = document.getElementById("big");
  const slight = document.getElementById("slight");
  const original = document.getElementById("original");

  original.innerHTML = document.getElementById("textarea").value;
  big.innerHTML = "";
  slight.innerHTML = "";
  document.getElementById("direction-text").innerHTML = "Generating alternate versions...";

  if (firstRun) {
    firstRun = false;
  } else {
    originalContainer.removeEventListener("click", orig);
    slightContainer.removeEventListener("click", slig);
    mostContainer.removeEventListener("click", larg);
  }

  makeSelectionBoxVisible();
  document.getElementById("exit").addEventListener("click", makeSelectionBoxInvisible);

  slight.classList.add("blinking");
  await changeTextWithChatGPT("a little");
  slight.classList.remove("blinking");

  big.classList.add("blinking");
  await changeTextWithChatGPT("a lot");
  big.classList.remove("blinking");

  document.getElementById("direction-text").innerHTML = "Click on which version you want to save!";

  originalContainer.addEventListener("click", orig);
  slightContainer.addEventListener("click", slig);
  mostContainer.addEventListener("click", larg);
}

async function orig() {
  const text = document.getElementById("original").textContent;
  const emotion = await analyzeEntireText(text);
  submitEntry(text, JSON.stringify(emotion));
}

async function slig() {
  const text = document.getElementById("slight").textContent;
  const emotion = await analyzeEntireText(text);
  submitEntry(text, JSON.stringify(emotion));
}

async function larg() {
  const text = document.getElementById("big").textContent;
  const emotion = await analyzeEntireText(text);
  submitEntry(text, JSON.stringify(emotion));
}

getChatGPTAPIKey();

document.getElementById("submit").addEventListener("click", async function(e) {
  e.preventDefault();
  handleSubmit()
});

document.getElementById("show").addEventListener("click", async function(e) {
  e.preventDefault();
  document.querySelector(".entries-overlay").style.display = "flex";
  setUpEntries();
});

document.getElementById("instructionExit").addEventListener("click", makeInstructionsOverlayInvisible)

document.getElementById("instruction").addEventListener("click", makeInstructionsOverlayVisible)

document.getElementById("entries-exit").addEventListener("click", function() { document.querySelector(".entries-overlay").style.display = "none"; })

document.getElementById("delete").addEventListener("click", clearTextarea);

function clearTextarea() {
  const textbox = document.getElementById("textarea");
  textbox.value = "";
  textbox.style.background = "none";
  setColorOfBackground("empty");
}