const state = {
  cards: [],
  available: [],
  selected: [],
  followups: [],
  currentStep: "code",
  code: "JUZI-2026-ABCD",
  question: "",
  questionLeft: 2,
  followLeft: 3,
  angelUsed: false,
  isReading: false
};

const steps = ["code", "question", "shuffle", "draw", "result"];
const positions = ["过去 / 根源", "现在 / 状态", "未来 / 建议"];

const el = {
  steps: {
    code: document.querySelector("#step-code"),
    question: document.querySelector("#step-question"),
    shuffle: document.querySelector("#step-shuffle"),
    draw: document.querySelector("#step-draw"),
    result: document.querySelector("#step-result")
  },
  quotaDisplay: document.querySelector("#quota-display"),
  questionCount: document.querySelector("#question-count"),
  followupCount: document.querySelector("#followup-count"),
  codeForm: document.querySelector("#code-form"),
  codeInput: document.querySelector("#code-input"),
  questionForm: document.querySelector("#question-form"),
  questionInput: document.querySelector("#question-input"),
  fullDeck: document.querySelector("#full-deck"),
  selectedStrip: Array.from(document.querySelectorAll("#selected-strip span")),
  drawCounter: document.querySelector("#draw-counter"),
  drawQuestion: document.querySelector("#draw-question"),
  resultQuestion: document.querySelector("#result-question"),
  resultSpread: document.querySelector("#result-spread"),
  readingTitle: document.querySelector("#reading-title"),
  readingText: document.querySelector("#reading-text"),
  followInput: document.querySelector("#follow-input"),
  followButton: document.querySelector("#follow-button"),
  angelButton: document.querySelector("#angel-button"),
  followHint: document.querySelector("#follow-hint"),
  blessingBox: document.querySelector("#blessing-box p"),
  restartButton: document.querySelector("#restart-button"),
  saveButton: document.querySelector("#save-button")
};

function cardImage(index) {
  return `/cards/${index}.webp`;
}

async function loadCards() {
  const response = await fetch("/cards/manifest.json");
  const manifest = await response.json();
  state.cards = manifest.cards.map((card) => ({
    index: card.index,
    name: card.name || `牌 ${card.index}`
  }));
  state.available = state.cards.filter((card) => card.index > 0).map((card) => card.index);
  renderDeck();
  
  const hashStep = window.location.hash.replace("#", "");
  if (steps.includes(hashStep)) {
    state.code = "JUZI-2026-ABCD";
    state.question = el.questionInput.value.trim();
    if (hashStep === "result" && state.selected.length === 0) {
      state.selected = [
        { index: 3, name: "女祭司 The High Priestess", reversed: false, position: positions[0] },
        { index: 7, name: "恋人 The Lovers", reversed: true, position: positions[1] },
        { index: 15, name: "节制 Temperance", reversed: false, position: positions[2] }
      ];
      renderResult();
    }
    el.drawQuestion.textContent = state.question;
    updateStep(hashStep);
    return;
  }
  updateStep("code");
}

function updateStep(step) {
  state.currentStep = step;
  
  // 隐藏所有步骤
  Object.values(el.steps).forEach(stepEl => {
    stepEl.style.display = "none";
  });
  
  // 显示当前步骤
  if (el.steps[step]) {
    el.steps[step].style.display = "flex";
  }
  
  // 更新头部配额显示
  if (step === "question" || step === "draw" || step === "result") {
    el.quotaDisplay.style.display = "flex";
    el.questionCount.textContent = state.questionLeft;
    el.followupCount.textContent = state.followLeft;
  } else {
    el.quotaDisplay.style.display = "none";
  }
  
  // 洗牌动画自动完成
  if (step === "shuffle") {
    setTimeout(() => {
      updateStep("draw");
    }, 3500);
  }
}

function resetReadingState() {
  state.available = state.cards.filter((card) => card.index > 0).map((card) => card.index);
  state.selected = [];
  state.followups = [];
  state.followLeft = 3;
  state.angelUsed = false;
  state.isReading = false;
  el.followInput.value = "";
  el.blessingBox.textContent = "愿你在还没确定答案的时候，也能先安稳地照顾自己。";
  el.readingTitle.textContent = "正在生成解析";
  el.readingText.textContent = "橘子正在读取这组三张牌之间的关系。";
  renderDeck();
  renderSelectedStrip();
}

function renderDeck() {
  el.fullDeck.innerHTML = "";
  
  // 多行密集排列布局
  const cardsPerRow = 26; // 每行26张
  const totalRows = 3; // 3行
  
  for (let index = 1; index <= 78; index += 1) {
    const rowIndex = Math.floor((index - 1) / cardsPerRow);
    const colIndex = (index - 1) % cardsPerRow;
    const progress = colIndex / (cardsPerRow - 1);
    const centered = progress - 0.5;
    
    // 每行的弧度角度范围
    const angleRange = 65;
    const angle = -angleRange / 2 + progress * angleRange;
    
    // 水平位置
    const rowWidth = 920;
    const x = -rowWidth / 2 + progress * rowWidth;
    
    // 垂直位置 - 形成弧形
    const arcHeight = 45;
    const y = rowIndex * 85 + arcHeight * Math.pow(centered * 2, 2);
    
    const button = document.createElement("button");
    button.type = "button";
    button.className = "deck-card";
    button.dataset.cardIndex = String(index);
    button.style.setProperty("--angle", `${angle}deg`);
    button.style.setProperty("--x", `${x}px`);
    button.style.setProperty("--y", `${y}px`);
    button.style.setProperty("--row", String(rowIndex));
    button.style.setProperty("--z", String(index));
    button.setAttribute("aria-label", `塔罗牌背面 ${index}`);
    button.addEventListener("click", () => drawCard(button));
    el.fullDeck.appendChild(button);
  }
}

function renderSelectedStrip() {
  el.drawCounter.textContent = `${state.selected.length} / 3`;
  el.selectedStrip.forEach((item, index) => item.classList.toggle("filled", index < state.selected.length));
}

function randomCardFromDeck() {
  const slot = Math.floor(Math.random() * state.available.length);
  const [index] = state.available.splice(slot, 1);
  const card = state.cards.find((item) => item.index === index);
  return {
    index,
    name: card?.name || `牌 ${index}`,
    reversed: Math.random() > 0.5
  };
}

function drawCard(button) {
  if (state.selected.length >= 3 || state.isReading) return;
  const card = randomCardFromDeck();
  const position = positions[state.selected.length];
  state.selected.push({ ...card, position });
  button.classList.add("selected");
  button.disabled = true;
  renderSelectedStrip();

  if (state.selected.length === 3) {
    window.setTimeout(() => {
      renderResult();
      updateStep("result");
      createMainReading();
    }, 500);
  }
}

function renderResult() {
  el.resultQuestion.textContent = state.question;
  el.resultSpread.innerHTML = "";
  state.selected.forEach((card) => {
    const article = document.createElement("article");
    article.className = "spread-card";

    const image = document.createElement("img");
    image.src = cardImage(card.index);
    image.alt = `${card.name} ${card.reversed ? "逆位" : "正位"}`;
    image.className = card.reversed ? "reversed" : "";

    const position = document.createElement("span");
    position.textContent = card.position;

    const name = document.createElement("strong");
    name.textContent = `${card.name} · ${card.reversed ? "逆位" : "正位"}`;

    article.append(image, position, name);
    el.resultSpread.appendChild(article);
  });

  updateFollowControls();
}

function updateFollowControls() {
  el.followButton.disabled = state.isReading || state.followLeft <= 0 || !el.followInput.value.trim();
  el.angelButton.disabled = state.isReading || state.angelUsed;
  el.followHint.textContent = `还可以追问 ${state.followLeft} 次。天使祝福每个主问题仅一次。`;
}

async function requestReading(payload) {
  const response = await fetch("/api/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`解析请求失败：${response.status}`);
  return response.json();
}

async function createMainReading() {
  state.isReading = true;
  updateFollowControls();
  el.readingTitle.textContent = "正在生成解析";
  el.readingText.textContent = "橘子正在读取这组三张牌之间的关系。";

  try {
    const result = await requestReading({
      mode: "main",
      question: state.question,
      cards: state.selected
    });
    el.readingTitle.textContent = result.configured ? "牌阵解析完成" : "演示解析";
    el.readingText.textContent = result.reading;
  } catch (error) {
    el.readingTitle.textContent = "解析暂时失败";
    el.readingText.textContent = error instanceof Error ? error.message : "请稍后再试。";
  } finally {
    state.isReading = false;
    updateFollowControls();
  }
}

async function createFollowup() {
  const question = el.followInput.value.trim();
  if (!question || state.followLeft <= 0 || state.isReading) return;

  const followupCard = randomCardFromDeck();
  state.followLeft -= 1;
  state.isReading = true;
  updateFollowControls();
  el.readingTitle.textContent = "正在生成追问解析";
  el.readingText.textContent = `追问抽到：${followupCard.name} · ${followupCard.reversed ? "逆位" : "正位"}\n\n橘子正在把这张牌放回主牌阵上下文里。`;

  try {
    const result = await requestReading({
      mode: "followup",
      question: state.question,
      cards: state.selected,
      followupQuestion: question,
      followupCard,
      followups: state.followups
    });
    state.followups.push({ question, card: followupCard, reading: result.reading });
    el.readingTitle.textContent = result.configured ? "追问解析完成" : "追问演示解析";
    el.readingText.textContent = `追问：${question}\n抽牌：${followupCard.name} · ${followupCard.reversed ? "逆位" : "正位"}\n\n${result.reading}`;
    el.followInput.value = "";
  } catch (error) {
    el.readingTitle.textContent = "追问解析失败";
    el.readingText.textContent = error instanceof Error ? error.message : "请稍后再试。";
  } finally {
    state.isReading = false;
    updateFollowControls();
  }
}

async function createAngelBlessing() {
  if (state.angelUsed || state.isReading) return;
  state.angelUsed = true;
  state.isReading = true;
  updateFollowControls();
  el.blessingBox.textContent = "橘子正在为你抽取天使的祝福。";

  try {
    const result = await requestReading({
      mode: "angel",
      question: state.question,
      cards: state.selected,
      followups: state.followups
    });
    el.blessingBox.textContent = result.reading;
  } catch {
    el.blessingBox.textContent = "愿你在还没有完全确定答案的时候，也能先稳稳照顾自己。";
  } finally {
    state.isReading = false;
    updateFollowControls();
  }
}

function saveResult() {
  const content = [
    "橘子塔罗",
    `兑换码：${state.code}`,
    `问题：${state.question}`,
    "",
    "牌阵：",
    ...state.selected.map((card) => `${card.position}：${card.name} · ${card.reversed ? "逆位" : "正位"}`),
    "",
    el.readingText.textContent,
    "",
    el.blessingBox.textContent
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "橘子塔罗结果.txt";
  link.click();
  URL.revokeObjectURL(link.href);
}

el.codeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.code = el.codeInput.value.trim().toUpperCase() || "JUZI-2026-ABCD";
  updateStep("question");
});

el.questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.question = el.questionInput.value.trim();
  if (!state.question) return;
  resetReadingState();
  el.drawQuestion.textContent = state.question;
  updateStep("shuffle");
});

el.followInput.addEventListener("input", updateFollowControls);
el.followButton.addEventListener("click", createFollowup);
el.angelButton.addEventListener("click", createAngelBlessing);
el.restartButton.addEventListener("click", () => {
  resetReadingState();
  updateStep("code");
});
el.saveButton.addEventListener("click", saveResult);

loadCards().catch((error) => {
  el.readingTitle.textContent = "资源加载失败";
  el.readingText.textContent = error instanceof Error ? error.message : "请检查卡牌资源。";
});
