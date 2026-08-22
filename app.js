(() => {
  "use strict";

  const STORAGE_KEY = "meal-wheel-options-v1";
  const MAX_OPTIONS = 12;
  const POINTER_ANGLE = -Math.PI / 2;
  const START_ANGLE = -Math.PI / 2;

  const DEFAULT_POOL = {
    breakfast: [
      { name: "豆浆油条", emoji: "🥛" },
      { name: "包子", emoji: "🥟" },
      { name: "煎饼果子", emoji: "🌯" },
      { name: "三明治", emoji: "🥪" },
      { name: "小笼包", emoji: "🍥" },
      { name: "皮蛋瘦肉粥", emoji: "🍚" },
      { name: "鸡蛋灌饼", emoji: "🥞" },
      { name: "吐司牛奶", emoji: "🍞" },
      { name: "肠粉", emoji: "🍜" },
      { name: "手抓饼", emoji: "🫓" },
    ],
    lunch: [
      { name: "黄焖鸡米饭", emoji: "🍗" },
      { name: "麻辣烫", emoji: "🍲" },
      { name: "盖浇饭", emoji: "🍛" },
      { name: "兰州拉面", emoji: "🍜" },
      { name: "猪脚饭", emoji: "🍖" },
      { name: "沙县小吃", emoji: "🥟" },
      { name: "汉堡薯条", emoji: "🍔" },
      { name: "米线", emoji: "🍝" },
      { name: "煲仔饭", emoji: "🍚" },
      { name: "螺蛳粉", emoji: "🍜" },
    ],
    dinner: [
      { name: "火锅", emoji: "🍲" },
      { name: "烧烤", emoji: "🍢" },
      { name: "寿司", emoji: "🍣" },
      { name: "披萨", emoji: "🍕" },
      { name: "炸鸡", emoji: "🍗" },
      { name: "牛肉面", emoji: "🍜" },
      { name: "酸菜鱼", emoji: "🐟" },
      { name: "麻辣香锅", emoji: "🌶️" },
      { name: "日式便当", emoji: "🍱" },
      { name: "小龙虾", emoji: "🦞" },
    ],
  };

  const MEAL_LABELS = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
  };

  const FALLBACK_EMOJI = "🍽️";

  const COLORS = [
    "#ff6b6b",
    "#ffd93d",
    "#6bcb77",
    "#4d96ff",
    "#c39bd3",
    "#ff9a3c",
    "#3ec6d9",
    "#ff8fab",
    "#a9d6e5",
    "#ffb347",
    "#9d6bff",
    "#5cd6a0",
  ];

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const pointer = document.querySelector(".pointer");
  const spinBtn = document.getElementById("spin-btn");
  const addBtn = document.getElementById("add-btn");
  const spinAgain = document.getElementById("spin-again");
  const resultSection = document.getElementById("result");
  const resultName = document.getElementById("result-name");
  const resultEmoji = document.getElementById("result-emoji");
  const listBody = document.getElementById("list-body");
  const wheelCenterMeal = document.querySelector(".wheel-center-meal");
  const wheelCenterHint = document.querySelector(".wheel-center-hint");
  const dialog = document.getElementById("edit-dialog");
  const dialogInput = document.getElementById("dialog-input");
  const dialogConfirm = document.getElementById("dialog-confirm");
  const tabs = Array.from(document.querySelectorAll(".meal-tab"));

  let currentMeal = "breakfast";
  let rotation = 0;
  let spinning = false;
  let rafId = null;

  const stored = loadStorage();
  const options = {
    breakfast: stored.breakfast || DEFAULT_POOL.breakfast.slice(),
    lunch: stored.lunch || DEFAULT_POOL.lunch.slice(),
    dinner: stored.dinner || DEFAULT_POOL.dinner.slice(),
  };

  function loadStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }

  function getOptions() {
    return options[currentMeal];
  }

  function redraw() {
    const size = Math.min(window.innerWidth * 0.88, 420);
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const items = getOptions();
    const count = items.length;
    const slice = (Math.PI * 2) / count;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    items.forEach((item, i) => {
      const start = START_ANGLE + i * slice;
      const end = start + slice;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const mid = start + slice / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "700 16px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = item.name.length > 5 ? item.name.slice(0, 5) + "…" : item.name;
      ctx.fillText(label, radius * 0.56, 0);
      ctx.font = "18px sans-serif";
      ctx.fillText(item.emoji || FALLBACK_EMOJI, radius * 0.86, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  function animate(to) {
    const from = rotation;
    const delta = to - from;
    const duration = 4200;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      rotation = from + delta * eased;
      redraw();
      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = null;
        rotation = to;
        spinning = false;
        spinBtn.disabled = false;
        showResult();
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  function spin() {
    if (spinning) return;
    const items = getOptions();
    if (items.length < 2) {
      addBtn.click();
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    resultSection.classList.add("is-hidden");

    const count = items.length;
    const slice = (Math.PI * 2) / count;
    const targetIndex = Math.floor(Math.random() * count);
    const centerAngle = START_ANGLE + targetIndex * slice + slice / 2;

    let target = POINTER_ANGLE - centerAngle;
    const norm = (a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    target = rotation + norm(target - rotation);
    while (target - rotation < Math.PI * 8) {
      target += Math.PI * 2;
    }

    animate(target);
  }

  function currentResult() {
    const items = getOptions();
    const count = items.length;
    const slice = (Math.PI * 2) / count;
    const relative = (((POINTER_ANGLE - rotation - START_ANGLE) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(relative / slice) % count;
    return items[index];
  }

  function showResult() {
    const item = currentResult();
    resultName.textContent = item.name;
    resultEmoji.textContent = item.emoji || FALLBACK_EMOJI;
    resultSection.classList.remove("is-hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderList() {
    listBody.innerHTML = "";
    const items = getOptions();
    if (items.length === 0) {
      const empty = document.createElement("span");
      empty.className = "chip";
      empty.textContent = "选项池空啦，点「＋ 加餐」添加";
      listBody.appendChild(empty);
      return;
    }
    items.forEach((item, i) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = `${item.emoji || FALLBACK_EMOJI} ${item.name}`;

      const remove = document.createElement("button");
      remove.className = "remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `删除 ${item.name}`);
      remove.addEventListener("click", () => {
        options[currentMeal].splice(i, 1);
        saveStorage();
        renderList();
        redraw();
        showToast(`已删除「${item.name}」`);
      });
      chip.appendChild(remove);
      listBody.appendChild(chip);
    });
  }

  function switchMeal(meal) {
    currentMeal = meal;
    tabs.forEach((t) => {
      const active = t.dataset.meal === meal;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    wheelCenterMeal.textContent = MEAL_LABELS[meal];
    resultSection.classList.add("is-hidden");
    renderList();
    redraw();
  }

  function showToast(msg) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function openDialog() {
    dialogInput.value = "";
    dialog.showModal();
    dialogInput.focus();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!spinning) switchMeal(tab.dataset.meal);
    });
  });

  spinBtn.addEventListener("click", spin);
  spinAgain.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(spin, 250);
  });
  addBtn.addEventListener("click", openDialog);

  dialogConfirm.addEventListener("click", (e) => {
    const name = dialogInput.value.trim();
    if (!name) {
      e.preventDefault();
      dialogInput.focus();
      return;
    }
    if (getOptions().length >= MAX_OPTIONS) {
      e.preventDefault();
      dialogInput.setCustomValidity("");
      window.alert(`一个餐次最多 ${MAX_OPTIONS} 个选项，先删掉几个再添加吧`);
      return;
    }
    options[currentMeal].push({ name, emoji: FALLBACK_EMOJI });
    saveStorage();
    renderList();
    redraw();
    showToast(`已添加「${name}」并保存到本地`);
  });

  dialog.addEventListener("close", () => {
    dialogInput.setCustomValidity("");
  });

  window.addEventListener("resize", redraw);

  switchMeal("breakfast");
})();
