import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "flappy-bird-mobile-save";

const SKINS = [
  {
    id: "classic",
    name: "Sunny",
    unlockScore: 0,
    body: "#f7d51d",
    wing: "#fff3a3",
    accent: "#e86f1c",
  },
  {
    id: "mint",
    name: "Mint",
    unlockScore: 5,
    body: "#53d76a",
    wing: "#c4f7b2",
    accent: "#12834e",
  },
  {
    id: "berry",
    name: "Berry",
    unlockScore: 10,
    body: "#e94f8a",
    wing: "#ffc0d3",
    accent: "#9b204d",
  },
  {
    id: "night",
    name: "Night",
    unlockScore: 15,
    body: "#4457c7",
    wing: "#aeb7ff",
    accent: "#1c2b78",
  },
  {
    id: "gold",
    name: "Gold",
    unlockScore: 25,
    body: "#f0a90e",
    wing: "#ffec86",
    accent: "#945a0d",
  },
];

const WORLD = {
  width: 390,
  height: 720,
  birdX: 104,
  birdRadius: 18,
  pipeWidth: 68,
  pipeGap: 174,
  pipeSpacing: 235,
  pipeSpeed: 150,
  pipeStartX: 510,
  hazardStartX: 720,
  hazardSpacing: 340,
  groundHeight: 70,
};

const HAZARD_SIZES = {
  bug: { width: 38, height: 24 },
  crate: { width: 34, height: 34 },
  spikes: { width: 48, height: 30 },
};

const MAPS = [
  {
    name: "Meadow",
    scene: "meadow",
    sky: "#70c5ce",
    cloud: "#ffffff",
    cloudShade: "#dff7df",
    treeBase: "#e7f6cf",
    treeA: "#c6e8a0",
    treeB: "#d5efb4",
    grass: "#92d74f",
    grassDark: "#4f9b3d",
    ground: "#ded895",
    dirt: "#cbbf77",
    groundLight: "#f2e59d",
    pipeDark: "#245e1b",
    pipe: "#67b832",
    pipeLight: "#a5ee57",
    pipeShade: "#3f8628",
  },
  {
    name: "Mountains",
    scene: "mountains",
    sky: "#7fcbe4",
    cloud: "#ffffff",
    cloudShade: "#d8eef1",
    treeBase: "#d4efc2",
    treeA: "#477c54",
    treeB: "#6fa56a",
    grass: "#7fc458",
    grassDark: "#3f7a46",
    ground: "#b78b5b",
    dirt: "#7d5638",
    groundLight: "#d5aa72",
    pipeDark: "#25534b",
    pipe: "#3f9b84",
    pipeLight: "#70d7b4",
    pipeShade: "#287064",
  },
  {
    name: "City",
    scene: "city",
    sky: "#8fb6d9",
    cloud: "#f5f0dc",
    cloudShade: "#cfdeca",
    treeBase: "#7d8fa1",
    treeA: "#556779",
    treeB: "#6d7f91",
    grass: "#707d8a",
    grassDark: "#48525f",
    ground: "#a58d75",
    dirt: "#6d5a4c",
    groundLight: "#c2a78a",
    pipeDark: "#253847",
    pipe: "#4e7c96",
    pipeLight: "#87b8c7",
    pipeShade: "#35586d",
  },
  {
    name: "Ice",
    scene: "ice",
    sky: "#9eddea",
    cloud: "#ffffff",
    cloudShade: "#d6f4ff",
    treeBase: "#d9f8ff",
    treeA: "#9ed4e8",
    treeB: "#b9e8f2",
    grass: "#d8f7ff",
    grassDark: "#7ec5da",
    ground: "#b7e6ef",
    dirt: "#7fb9ce",
    groundLight: "#edfaff",
    pipeDark: "#27617d",
    pipe: "#4ca3bd",
    pipeLight: "#a8eff4",
    pipeShade: "#357e9a",
  },
  {
    name: "Ocean",
    scene: "ocean",
    sky: "#59b4d1",
    cloud: "#f7ffff",
    cloudShade: "#b9e8e5",
    treeBase: "#7ed6b5",
    treeA: "#3aa585",
    treeB: "#5ec9a4",
    grass: "#59c487",
    grassDark: "#2f815d",
    ground: "#d8c47e",
    dirt: "#ad9656",
    groundLight: "#f3dda0",
    pipeDark: "#11545c",
    pipe: "#1b9aa0",
    pipeLight: "#63d5cf",
    pipeShade: "#147178",
  },
  {
    name: "Lava",
    scene: "lava",
    sky: "#75466f",
    cloud: "#ffc7a8",
    cloudShade: "#d48a73",
    treeBase: "#5d5842",
    treeA: "#72452c",
    treeB: "#98623a",
    grass: "#dd7b32",
    grassDark: "#8b3f26",
    ground: "#6a4c3b",
    dirt: "#3f2f2b",
    groundLight: "#a55a34",
    pipeDark: "#402434",
    pipe: "#875047",
    pipeLight: "#c9795a",
    pipeShade: "#5e3340",
  },
];

function getDifficulty(score = 0) {
  const tier = Math.floor(score / 10);

  return {
    tier,
    map: MAPS[tier % MAPS.length],
    pipeGap: Math.max(116, WORLD.pipeGap - tier * 12),
    pipeSpeed: WORLD.pipeSpeed + tier * 18,
    pipeSpacing: Math.max(190, WORLD.pipeSpacing - tier * 5),
    hazardCount: Math.min(6, 3 + tier),
    hazardSpacing: Math.max(210, WORLD.hazardSpacing - tier * 28),
    hazardSpeedBonus: tier * 10,
  };
}

function defaultSave() {
  return {
    bestScore: 0,
    selectedSkin: "classic",
    unlockedSkins: ["classic"],
  };
}

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") {
      return defaultSave();
    }

    return {
      ...defaultSave(),
      ...parsed,
      unlockedSkins: Array.isArray(parsed.unlockedSkins)
        ? [...new Set(["classic", ...parsed.unlockedSkins])]
        : ["classic"],
    };
  } catch {
    return defaultSave();
  }
}

function buildPipes(difficulty = getDifficulty(0)) {
  return Array.from({ length: 4 }, (_, index) =>
    createPipe(WORLD.pipeStartX + index * difficulty.pipeSpacing, difficulty),
  );
}

function buildHazards(difficulty = getDifficulty(0)) {
  return Array.from({ length: difficulty.hazardCount }, (_, index) =>
    createHazard(WORLD.hazardStartX + index * difficulty.hazardSpacing, index, difficulty),
  );
}

function createPipe(x, difficulty = getDifficulty(0)) {
  const topMin = 98;
  const topMax = WORLD.height - WORLD.groundHeight - difficulty.pipeGap - 116;
  return {
    x,
    topHeight: topMin + Math.random() * (topMax - topMin),
    gap: difficulty.pipeGap,
    scored: false,
  };
}

function createHazard(x, seed = 0, difficulty = getDifficulty(0)) {
  const types = ["bug", "crate", "spikes"];
  const type = types[(seed + Math.floor(Math.random() * types.length)) % types.length];
  const size = HAZARD_SIZES[type];
  const airMin = Math.max(96, 118 - difficulty.tier * 2);
  const airMax = WORLD.height - WORLD.groundHeight - 172;
  const y =
    type === "spikes"
      ? WORLD.height - WORLD.groundHeight - size.height
      : airMin + Math.random() * (airMax - airMin);

  return {
    x,
    y,
    type,
    phase: Math.random() * Math.PI * 2,
    bob: type === "bug" ? 18 + difficulty.tier * 2 : 0,
    speedOffset: type === "bug" ? 24 + difficulty.hazardSpeedBonus : difficulty.hazardSpeedBonus * 0.45,
  };
}

function syncHazardsForDifficulty(game, difficulty) {
  while (game.hazards.length < difficulty.hazardCount) {
    const rightmostX = game.hazards.length ? Math.max(...game.hazards.map((hazard) => hazard.x)) : WORLD.hazardStartX;
    game.hazards.push(createHazard(rightmostX + difficulty.hazardSpacing, game.hazards.length + game.score, difficulty));
  }
}

function unlockSkinsForScore(save, score) {
  const bestScore = Math.max(save.bestScore, score);
  const unlockedSkins = SKINS.filter((skin) => skin.unlockScore <= bestScore).map((skin) => skin.id);

  return {
    ...save,
    bestScore,
    unlockedSkins: [...new Set(["classic", ...unlockedSkins])],
  };
}

function pixelRect(ctx, x, y, width, height) {
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawPixelCloud(ctx, x, y, theme) {
  ctx.fillStyle = theme.cloud;
  pixelRect(ctx, x, y + 12, 68, 18);
  pixelRect(ctx, x + 12, y + 4, 20, 14);
  pixelRect(ctx, x + 32, y, 24, 22);
  pixelRect(ctx, x + 54, y + 8, 22, 14);
  ctx.fillStyle = theme.cloudShade;
  pixelRect(ctx, x, y + 26, 76, 8);
  pixelRect(ctx, x + 6, y + 30, 12, 4);
  pixelRect(ctx, x + 44, y + 30, 20, 4);
}

function drawMeadowScene(ctx, theme, treeLine) {
  ctx.fillStyle = theme.treeBase;
  pixelRect(ctx, 0, treeLine + 22, WORLD.width, 58);

  for (let x = -18; x < WORLD.width + 34; x += 31) {
    ctx.fillStyle = x % 62 === 0 ? theme.treeA : theme.treeB;
    pixelRect(ctx, x, treeLine + 16, 28, 54);
    pixelRect(ctx, x + 6, treeLine + 8, 16, 12);
    pixelRect(ctx, x - 6, treeLine + 24, 16, 12);
    pixelRect(ctx, x + 18, treeLine + 28, 16, 12);
  }
}

function drawMountainScene(ctx, theme, elapsed, treeLine) {
  const drift = -Math.round(((elapsed / 1000) * 18) % 96);

  ctx.fillStyle = "#8ea0a7";
  for (let x = drift - 120; x < WORLD.width + 120; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, treeLine + 62);
    ctx.lineTo(x + 66, treeLine - 106);
    ctx.lineTo(x + 142, treeLine + 62);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#eff8f1";
    ctx.beginPath();
    ctx.moveTo(x + 42, treeLine - 44);
    ctx.lineTo(x + 66, treeLine - 106);
    ctx.lineTo(x + 94, treeLine - 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8ea0a7";
  }

  ctx.fillStyle = theme.treeBase;
  pixelRect(ctx, 0, treeLine + 30, WORLD.width, 52);

  for (let x = -12; x < WORLD.width + 26; x += 28) {
    ctx.fillStyle = x % 56 === 0 ? theme.treeA : theme.treeB;
    pixelRect(ctx, x + 9, treeLine + 20, 8, 40);
    pixelRect(ctx, x + 4, treeLine + 8, 18, 18);
    pixelRect(ctx, x, treeLine + 22, 26, 18);
  }
}

function drawCityScene(ctx, theme, elapsed, treeLine) {
  const drift = -Math.round(((elapsed / 1000) * 22) % 72);
  ctx.fillStyle = "#c4d0d9";
  pixelRect(ctx, 0, treeLine + 42, WORLD.width, 28);

  for (let x = drift - 72; x < WORLD.width + 72; x += 72) {
    const height = 80 + ((x + 144) % 3) * 26;
    ctx.fillStyle = x % 144 === 0 ? "#657789" : "#526577";
    pixelRect(ctx, x, treeLine + 62 - height, 46, height);
    ctx.fillStyle = "#405263";
    pixelRect(ctx, x + 46, treeLine + 62 - height + 14, 10, height - 14);

    ctx.fillStyle = "#f2cf67";
    for (let wx = x + 8; wx < x + 38; wx += 14) {
      for (let wy = treeLine + 80 - height; wy < treeLine + 46; wy += 22) {
        pixelRect(ctx, wx, wy, 6, 8);
      }
    }
  }

  ctx.fillStyle = theme.treeBase;
  pixelRect(ctx, 0, treeLine + 62, WORLD.width, 20);
}

function drawIceScene(ctx, theme, elapsed, treeLine) {
  const drift = -Math.round(((elapsed / 1000) * 14) % 86);
  ctx.fillStyle = "#ffffff";

  for (let x = drift - 86; x < WORLD.width + 86; x += 86) {
    ctx.beginPath();
    ctx.moveTo(x, treeLine + 60);
    ctx.lineTo(x + 46, treeLine - 68);
    ctx.lineTo(x + 96, treeLine + 60);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#b7e6ef";
    ctx.beginPath();
    ctx.moveTo(x + 46, treeLine - 68);
    ctx.lineTo(x + 96, treeLine + 60);
    ctx.lineTo(x + 62, treeLine + 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
  }

  ctx.fillStyle = theme.treeBase;
  pixelRect(ctx, 0, treeLine + 50, WORLD.width, 32);

  for (let x = -8; x < WORLD.width + 34; x += 42) {
    ctx.fillStyle = theme.treeA;
    pixelRect(ctx, x + 12, treeLine + 18, 10, 46);
    ctx.fillStyle = "#ffffff";
    pixelRect(ctx, x + 4, treeLine + 14, 26, 12);
    pixelRect(ctx, x, treeLine + 28, 34, 12);
  }
}

function drawOceanScene(ctx, theme, elapsed, treeLine) {
  ctx.fillStyle = "#2f8fb9";
  pixelRect(ctx, 0, treeLine + 14, WORLD.width, 68);

  const waveShift = -Math.round(((elapsed / 1000) * 34) % 36);
  for (let x = waveShift - 36; x < WORLD.width + 36; x += 36) {
    ctx.fillStyle = "#8be5e2";
    pixelRect(ctx, x, treeLine + 30, 18, 5);
    pixelRect(ctx, x + 18, treeLine + 48, 18, 5);
  }

  for (let x = 18; x < WORLD.width; x += 92) {
    ctx.fillStyle = "#8b6339";
    pixelRect(ctx, x + 16, treeLine + 8, 8, 58);
    ctx.fillStyle = "#3aa585";
    pixelRect(ctx, x, treeLine - 2, 28, 12);
    pixelRect(ctx, x + 18, treeLine - 14, 34, 14);
    pixelRect(ctx, x + 6, treeLine + 10, 32, 12);
  }
}

function drawLavaScene(ctx, theme, elapsed, treeLine) {
  ctx.fillStyle = "#3b2b3d";
  pixelRect(ctx, 0, treeLine - 18, WORLD.width, 100);

  const lavaShift = -Math.round(((elapsed / 1000) * 46) % 42);
  ctx.fillStyle = "#e95b2d";
  pixelRect(ctx, 0, treeLine + 46, WORLD.width, 36);

  for (let x = lavaShift - 42; x < WORLD.width + 42; x += 42) {
    ctx.fillStyle = "#ffb13d";
    pixelRect(ctx, x, treeLine + 56, 22, 6);
    ctx.fillStyle = "#a33a31";
    pixelRect(ctx, x + 18, treeLine + 70, 24, 5);
  }

  ctx.fillStyle = "#201824";
  for (let x = -30; x < WORLD.width + 60; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, treeLine + 40);
    ctx.lineTo(x + 28, treeLine - 80);
    ctx.lineTo(x + 74, treeLine + 40);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLevelScene(ctx, theme, elapsed, treeLine) {
  if (theme.scene === "mountains") {
    drawMountainScene(ctx, theme, elapsed, treeLine);
  } else if (theme.scene === "city") {
    drawCityScene(ctx, theme, elapsed, treeLine);
  } else if (theme.scene === "ice") {
    drawIceScene(ctx, theme, elapsed, treeLine);
  } else if (theme.scene === "ocean") {
    drawOceanScene(ctx, theme, elapsed, treeLine);
  } else if (theme.scene === "lava") {
    drawLavaScene(ctx, theme, elapsed, treeLine);
  } else {
    drawMeadowScene(ctx, theme, treeLine);
  }
}

function drawBackground(ctx, elapsed = 0, difficulty = getDifficulty(0)) {
  const theme = difficulty.map;

  ctx.fillStyle = theme.sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  drawPixelCloud(ctx, 28, 118, theme);
  drawPixelCloud(ctx, 234, 72, theme);
  drawPixelCloud(ctx, 282, 214, theme);

  const treeLine = WORLD.height - WORLD.groundHeight - 78;
  drawLevelScene(ctx, theme, elapsed, treeLine);

  ctx.fillStyle = theme.grass;
  pixelRect(ctx, 0, WORLD.height - WORLD.groundHeight - 8, WORLD.width, 8);
  ctx.fillStyle = theme.grassDark;
  pixelRect(ctx, 0, WORLD.height - WORLD.groundHeight, WORLD.width, 6);

  const groundY = WORLD.height - WORLD.groundHeight + 6;
  ctx.fillStyle = theme.ground;
  pixelRect(ctx, 0, groundY, WORLD.width, WORLD.groundHeight);

  const scroll = -Math.round(((elapsed / 1000) * difficulty.pipeSpeed) % 24);
  for (let x = scroll - 24; x < WORLD.width + 24; x += 24) {
    ctx.fillStyle = theme.dirt;
    pixelRect(ctx, x, groundY + 10, 12, 5);
    pixelRect(ctx, x + 12, groundY + 34, 12, 5);
    ctx.fillStyle = theme.groundLight;
    pixelRect(ctx, x + 8, groundY + 22, 10, 4);
  }
}

function drawPipeBody(ctx, x, y, width, height, theme) {
  ctx.fillStyle = theme.pipeDark;
  pixelRect(ctx, x - 4, y, width + 8, height);
  ctx.fillStyle = theme.pipe;
  pixelRect(ctx, x, y, width, height);
  ctx.fillStyle = theme.pipeLight;
  pixelRect(ctx, x + 8, y, 12, height);
  ctx.fillStyle = theme.pipeShade;
  pixelRect(ctx, x + width - 14, y, 10, height);
}

function drawPipeCap(ctx, x, y, width, height, theme) {
  ctx.fillStyle = theme.pipeDark;
  pixelRect(ctx, x - 10, y - 4, width + 20, height + 8);
  ctx.fillStyle = theme.pipe;
  pixelRect(ctx, x - 6, y, width + 12, height);
  ctx.fillStyle = theme.pipeLight;
  pixelRect(ctx, x + 4, y + 5, 16, height - 10);
  ctx.fillStyle = theme.pipeShade;
  pixelRect(ctx, x + width - 10, y + 4, 10, height - 8);
}

function drawPipes(ctx, pipes, theme) {
  pipes.forEach((pipe) => {
    const x = Math.round(pipe.x);
    const topHeight = Math.round(pipe.topHeight);
    const pipeGap = pipe.gap ?? WORLD.pipeGap;
    const bottomY = pipe.topHeight + pipeGap;
    const bottomHeight = WORLD.height - WORLD.groundHeight - bottomY;
    const capHeight = 30;

    drawPipeBody(ctx, x, 0, WORLD.pipeWidth, topHeight, theme);
    drawPipeCap(ctx, x, topHeight - capHeight, WORLD.pipeWidth, capHeight, theme);
    drawPipeBody(ctx, x, bottomY, WORLD.pipeWidth, bottomHeight, theme);
    drawPipeCap(ctx, x, bottomY, WORLD.pipeWidth, capHeight, theme);
  });
}

function getHazardY(hazard, elapsed = 0) {
  if (hazard.type !== "bug") {
    return hazard.y;
  }

  return hazard.y + Math.sin(elapsed * 0.005 + hazard.phase) * hazard.bob;
}

function drawBug(ctx, x, y, elapsed, phase) {
  const wingLift = Math.sin(elapsed * 0.026 + phase) > 0 ? -3 : 2;

  ctx.fillStyle = "#ffffff";
  pixelRect(ctx, x + 8, y + wingLift, 10, 8);
  pixelRect(ctx, x + 20, y + wingLift, 10, 8);

  ctx.fillStyle = "#5b3a1d";
  pixelRect(ctx, x + 4, y + 8, 30, 14);
  pixelRect(ctx, x, y + 12, 6, 6);
  pixelRect(ctx, x + 32, y + 12, 6, 6);

  ctx.fillStyle = "#e84f2b";
  pixelRect(ctx, x + 8, y + 10, 22, 10);
  ctx.fillStyle = "#f7d51d";
  pixelRect(ctx, x + 12, y + 10, 4, 10);
  pixelRect(ctx, x + 22, y + 10, 4, 10);

  ctx.fillStyle = "#ffffff";
  pixelRect(ctx, x + 26, y + 7, 8, 8);
  ctx.fillStyle = "#22313f";
  pixelRect(ctx, x + 31, y + 10, 3, 3);
}

function drawCrate(ctx, x, y) {
  ctx.fillStyle = "#5b3a1d";
  pixelRect(ctx, x, y, 34, 34);
  ctx.fillStyle = "#c47a32";
  pixelRect(ctx, x + 4, y + 4, 26, 26);
  ctx.fillStyle = "#e2a24a";
  pixelRect(ctx, x + 7, y + 7, 20, 5);
  pixelRect(ctx, x + 7, y + 15, 20, 4);
  pixelRect(ctx, x + 7, y + 23, 20, 4);
  ctx.fillStyle = "#7b4a23";
  pixelRect(ctx, x + 8, y + 8, 5, 20);
  pixelRect(ctx, x + 22, y + 8, 4, 20);
}

function drawSpikes(ctx, x, y) {
  ctx.fillStyle = "#5b3a1d";
  pixelRect(ctx, x, y + 24, 48, 6);

  for (let index = 0; index < 4; index += 1) {
    const spikeX = x + index * 12;
    ctx.fillStyle = "#5b3a1d";
    ctx.beginPath();
    ctx.moveTo(spikeX - 2, y + 26);
    ctx.lineTo(spikeX + 6, y);
    ctx.lineTo(spikeX + 14, y + 26);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f7f1d0";
    ctx.beginPath();
    ctx.moveTo(spikeX + 2, y + 24);
    ctx.lineTo(spikeX + 6, y + 7);
    ctx.lineTo(spikeX + 10, y + 24);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHazards(ctx, hazards, elapsed) {
  hazards.forEach((hazard) => {
    const x = Math.round(hazard.x);
    const y = Math.round(getHazardY(hazard, elapsed));

    if (hazard.type === "bug") {
      drawBug(ctx, x, y, elapsed, hazard.phase);
    } else if (hazard.type === "crate") {
      drawCrate(ctx, x, y);
    } else {
      drawSpikes(ctx, x, y);
    }
  });
}

function drawBird(ctx, y, skin, pulse = 0) {
  const flap = Math.round(Math.sin(pulse * 0.018) * 3);
  const x = WORLD.birdX;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = "rgba(75, 64, 38, 0.25)";
  pixelRect(ctx, -16, 25, 38, 6);

  ctx.fillStyle = "#5c3217";
  pixelRect(ctx, -18, -12, 30, 24);
  pixelRect(ctx, -14, -16, 22, 4);
  pixelRect(ctx, -14, 12, 22, 4);
  pixelRect(ctx, 8, -8, 10, 17);

  ctx.fillStyle = skin.body;
  pixelRect(ctx, -14, -8, 25, 20);
  pixelRect(ctx, -10, -12, 17, 4);
  pixelRect(ctx, -10, 12, 16, 4);

  ctx.fillStyle = "#fff4a7";
  pixelRect(ctx, -4, 4, 13, 6);

  ctx.fillStyle = "#5c3217";
  pixelRect(ctx, -19, -1 + flap, 13, 12);
  ctx.fillStyle = skin.wing;
  pixelRect(ctx, -16, 2 + flap, 10, 8);

  ctx.fillStyle = "#5c3217";
  pixelRect(ctx, 2, -13, 14, 14);
  ctx.fillStyle = "#ffffff";
  pixelRect(ctx, 5, -10, 8, 8);
  ctx.fillStyle = "#22313f";
  pixelRect(ctx, 10, -7, 3, 3);

  ctx.fillStyle = "#5c3217";
  pixelRect(ctx, 15, -3, 14, 11);
  ctx.fillStyle = skin.accent;
  pixelRect(ctx, 17, -1, 11, 4);
  pixelRect(ctx, 17, 4, 9, 3);

  ctx.restore();
}

function drawCanvas(ctx, game, skin, elapsed) {
  const difficulty = getDifficulty(game.score ?? 0);

  drawBackground(ctx, elapsed, difficulty);
  drawPipes(ctx, game.pipes, difficulty.map);
  drawHazards(ctx, game.hazards ?? [], elapsed);
  drawBird(ctx, game.birdY, skin, elapsed);
}

function collidesWithPipe(pipe, birdY) {
  const birdLeft = WORLD.birdX - WORLD.birdRadius + 4;
  const birdRight = WORLD.birdX + WORLD.birdRadius - 2;
  const pipeLeft = pipe.x;
  const pipeRight = pipe.x + WORLD.pipeWidth;
  const withinPipeX = birdRight > pipeLeft && birdLeft < pipeRight;

  if (!withinPipeX) {
    return false;
  }

  const topCollision = birdY - WORLD.birdRadius < pipe.topHeight;
  const bottomCollision = birdY + WORLD.birdRadius > pipe.topHeight + (pipe.gap ?? WORLD.pipeGap);
  return topCollision || bottomCollision;
}

function circleHitsRect(circleX, circleY, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(circleX, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circleY, rect.y + rect.height));
  const deltaX = circleX - closestX;
  const deltaY = circleY - closestY;
  return deltaX * deltaX + deltaY * deltaY < radius * radius;
}

function collidesWithHazard(hazard, birdY, elapsed) {
  const size = HAZARD_SIZES[hazard.type];
  const hitboxInset = hazard.type === "spikes" ? 5 : 3;
  return circleHitsRect(WORLD.birdX, birdY, WORLD.birdRadius - 4, {
    x: hazard.x + hitboxInset,
    y: getHazardY(hazard, elapsed) + hitboxInset,
    width: size.width - hitboxInset * 2,
    height: size.height - hitboxInset * 2,
  });
}

function SkinPreview({ skin }) {
  return (
    <span className="skin-preview" aria-hidden="true">
      <span className="skin-preview__body" style={{ background: skin.body }}>
        <span className="skin-preview__wing" style={{ background: skin.wing }} />
        <span className="skin-preview__eye" />
        <span className="skin-preview__beak" style={{ background: skin.accent }} />
      </span>
    </span>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const pointerIdRef = useRef(null);
  const gameRef = useRef(null);
  const [screen, setScreen] = useState("menu");
  const [save, setSave] = useState(loadSave);
  const [score, setScore] = useState(0);
  const [lastUnlocks, setLastUnlocks] = useState([]);
  const [showReady, setShowReady] = useState(false);
  const currentLevel = getDifficulty(score).map.name;

  const selectedSkin = useMemo(
    () => SKINS.find((skin) => skin.id === save.selectedSkin) ?? SKINS[0],
    [save.selectedSkin],
  );

  const persistSave = useCallback((nextSave) => {
    setSave(nextSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSave));
  }, []);

  const startGame = useCallback(() => {
    const initialDifficulty = getDifficulty(0);
    const nextGame = {
      birdY: WORLD.height / 2,
      targetY: WORLD.height / 2,
      pipes: buildPipes(initialDifficulty),
      hazards: buildHazards(initialDifficulty),
      score: 0,
      active: false,
      started: false,
      over: false,
      elapsed: 0,
    };

    gameRef.current = nextGame;
    setScore(0);
    setLastUnlocks([]);
    setShowReady(true);
    setScreen("playing");
  }, []);

  const finishGame = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.over) {
      return;
    }

    game.over = true;
    const previousUnlocked = new Set(save.unlockedSkins);
    const nextSave = unlockSkinsForScore(save, game.score);
    const newUnlocks = nextSave.unlockedSkins
      .filter((id) => !previousUnlocked.has(id))
      .map((id) => SKINS.find((skin) => skin.id === id)?.name)
      .filter(Boolean);

    persistSave(nextSave);
    setLastUnlocks(newUnlocks);
    setScore(game.score);
    setScreen("dead");
  }, [persistSave, save]);

  const updatePointerTarget = useCallback((event) => {
    const canvas = canvasRef.current;
    const game = gameRef.current;
    if (!canvas || !game) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleY = WORLD.height / rect.height;
    const y = (event.clientY - rect.top) * scaleY;
    game.targetY = Math.max(WORLD.birdRadius + 14, Math.min(WORLD.height - WORLD.groundHeight - WORLD.birdRadius, y));
    game.active = true;
    game.started = true;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (screen !== "playing") {
        return;
      }

      pointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      setShowReady(false);
      updatePointerTarget(event);
    },
    [screen, updatePointerTarget],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (screen !== "playing" || pointerIdRef.current !== event.pointerId) {
        return;
      }
      updatePointerTarget(event);
    },
    [screen, updatePointerTarget],
  );

  const handlePointerUp = useCallback((event) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    if (gameRef.current) {
      gameRef.current.active = false;
    }
  }, []);

  const chooseSkin = useCallback(
    (skinId) => {
      if (!save.unlockedSkins.includes(skinId)) {
        return;
      }

      persistSave({
        ...save,
        selectedSkin: skinId,
      });
    },
    [persistSave, save],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return undefined;
    }

    ctx.imageSmoothingEnabled = false;

    const drawFrame = (time) => {
      const game = gameRef.current;
      const delta = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.032) : 0;
      lastTimeRef.current = time;

      if (screen === "playing" && game && !game.over) {
        game.elapsed = time;

        if (game.started) {
          const difficulty = getDifficulty(game.score);
          syncHazardsForDifficulty(game, difficulty);
          const followStrength = game.active ? 15 : 5;
          game.birdY += (game.targetY - game.birdY) * Math.min(delta * followStrength, 1);

          if (!game.active) {
            game.targetY = Math.min(WORLD.height - WORLD.groundHeight - WORLD.birdRadius, game.targetY + 44 * delta);
          }

          game.pipes.forEach((pipe) => {
            pipe.x -= difficulty.pipeSpeed * delta;
          });

          game.hazards.forEach((hazard) => {
            hazard.x -= (difficulty.pipeSpeed + hazard.speedOffset) * delta;
          });

          let rightmostX = Math.max(...game.pipes.map((pipe) => pipe.x));
          game.pipes.forEach((pipe) => {
            if (pipe.x + WORLD.pipeWidth < -16) {
              const nextPipe = createPipe(rightmostX + difficulty.pipeSpacing, difficulty);
              pipe.x = nextPipe.x;
              pipe.topHeight = nextPipe.topHeight;
              pipe.gap = nextPipe.gap;
              pipe.scored = false;
              rightmostX = nextPipe.x;
            }

            if (!pipe.scored && pipe.x + WORLD.pipeWidth < WORLD.birdX - WORLD.birdRadius) {
              pipe.scored = true;
              game.score += 1;
              setScore(game.score);
            }
          });

          let rightmostHazardX = Math.max(...game.hazards.map((hazard) => hazard.x));
          game.hazards.forEach((hazard, index) => {
            const size = HAZARD_SIZES[hazard.type];

            if (hazard.x + size.width < -24) {
              Object.assign(
                hazard,
                createHazard(rightmostHazardX + difficulty.hazardSpacing, index + game.score, difficulty),
              );
              rightmostHazardX = hazard.x;
            }
          });

          const hitPipe = game.pipes.some((pipe) => collidesWithPipe(pipe, game.birdY));
          const hitHazard = game.hazards.some((hazard) => collidesWithHazard(hazard, game.birdY, time));
          const hitBounds =
            game.birdY - WORLD.birdRadius <= 0 ||
            game.birdY + WORLD.birdRadius >= WORLD.height - WORLD.groundHeight;

          if (hitPipe || hitHazard || hitBounds) {
            finishGame();
          }
        }

        drawCanvas(ctx, game, selectedSkin, time);
      } else {
        const idleGame = game ?? {
          birdY: WORLD.height / 2,
          pipes: [],
          hazards: [],
        };
        drawCanvas(ctx, idleGame, selectedSkin, time);
      }

      frameRef.current = requestAnimationFrame(drawFrame);
    };

    frameRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [finishGame, screen, selectedSkin]);

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="Flappy Bird Mobile">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={WORLD.width}
          height={WORLD.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className="hud" aria-live="polite">
          <span className="score-pill">{score}</span>
          <span className="skin-pill">
            <SkinPreview skin={selectedSkin} />
            {selectedSkin.name}
          </span>
        </div>

        {screen === "playing" && score > 0 && score % 10 === 0 && (
          <div className="level-banner" aria-live="polite">
            {currentLevel}
          </div>
        )}

        {screen === "playing" && showReady && (
          <div className="get-ready-banner" aria-hidden="true">
            Get Ready
          </div>
        )}

        {screen === "menu" && (
          <div className="overlay menu-overlay">
            <div className="title-stack">
              <p className="eyebrow">mobile</p>
              <h1>Flappy Bird</h1>
              <p className="best-score">Best {save.bestScore}</p>
            </div>
            <div className="menu-actions">
              <button className="primary-button" type="button" onClick={startGame}>
                Play
              </button>
              <button className="secondary-button" type="button" onClick={() => setScreen("wardrobe")}>
                Wardrobe
              </button>
            </div>
          </div>
        )}

        {screen === "dead" && (
          <div className="overlay result-overlay">
            <div className="result-panel">
              <p className="eyebrow">score</p>
              <h2>{score}</h2>
              <p className="best-score">Best {save.bestScore}</p>
              {lastUnlocks.length > 0 && <p className="unlock-note">Unlocked {lastUnlocks.join(", ")}</p>}
              <div className="result-actions">
                <button className="primary-button" type="button" onClick={startGame}>
                  Play Again
                </button>
                <button className="secondary-button" type="button" onClick={() => setScreen("menu")}>
                  Back to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "wardrobe" && (
          <div className="overlay wardrobe-overlay">
            <div className="wardrobe-header">
              <div>
                <p className="eyebrow">wardrobe</p>
                <h2>Skins</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Back to menu" onClick={() => setScreen("menu")}>
                X
              </button>
            </div>
            <div className="skin-grid">
              {SKINS.map((skin) => {
                const unlocked = save.unlockedSkins.includes(skin.id);
                const selected = save.selectedSkin === skin.id;

                return (
                  <button
                    className={`skin-card${selected ? " skin-card--selected" : ""}`}
                    type="button"
                    key={skin.id}
                    disabled={!unlocked}
                    onClick={() => chooseSkin(skin.id)}
                  >
                    <SkinPreview skin={skin} />
                    <span>{skin.name}</span>
                    <small>{unlocked ? (selected ? "Selected" : "Unlocked") : `Score ${skin.unlockScore}`}</small>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
