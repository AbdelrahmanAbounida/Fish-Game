//TODO::
/**
 * 1- convert to ts
 * 2- handle settings
 * 3- animating see in background
 * 4- handle keyboard key
 * 5- score, game over, retry
 * 6- handle voice when fish hit
 * 7- move to nextjs and deploy on vercel
 */

/* ##############################################*/
// canvas setup
/* ##############################################*/
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth * 1;
canvas.height = innerHeight * 1;
let gameScore = 0;
let gameFrame = 0;
var gameEnemies = [];
var gameEnemiesPositions = [];
let colors = ["red", "blue", "yellow"];
var enemySpeed = 4.5;
var seeSurfaceSpeed = 2.5;
var gameBubbles = [];
var bubbleSpeed = 5.5;
/* ##############################################*/
// controller
/* ##############################################*/
// mouse
const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  click: false,
};
let canvasPosition = canvas.getBoundingClientRect();

canvas.addEventListener("mousemove", function (event) {
  mouse.x = event.clientX - canvasPosition.x;
  mouse.y = event.clientY - canvasPosition.y;
});
// voices
function crashSound(source) {
  var sound = document.createElement("AUDIO");
  document.body.appendChild(sound);
  sound.src = source;

  return sound;
}
// images
function createImage(src) {
  let img = new Image();
  img.src = src;
  return img;
}

/* ##############################################*/
// Game Actors
/* ##############################################*/

class Fish {
  constructor() {
    this.position = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };
    this.velocity = {
      x: 3,
      y: 3,
    };
    this.radius = 42;

    this.imgs = {
      right: createImage("assets/sprites/fish/SmallFishRight.png"),
      left: createImage("assets/sprites/fish/SmallFishLeft.png"),
    };

    this.currentSprite = this.imgs.right;

    // lives
    this.lives = 3;
    this.fullLiveImages = [
      createImage("assets/sprites/star.png"),
      createImage("assets/sprites/star.png"),
      createImage("assets/sprites/star.png"),
    ];
    this.middleLiveImages = [
      createImage("assets/sprites/star.png"),
      createImage("assets/sprites/star.png"),
      createImage("assets/sprites/emptyStar.png"),
    ];
    this.oneLiveImages = [
      createImage("assets/sprites/star.png"),
      createImage("assets/sprites/emptyStar.png"),
      createImage("assets/sprites/emptyStar.png"),
    ];

    this.currentLiveImages = this.fullLiveImages;

    this.CropWidth = 256; // 417
    this.CropHeight = 327; //397
    // for sprite animation

    this.maxFrameValue = 5;
    this.frame = 1;

    this.direction = "right";
    this.type = "small";
    this.shifX = 60;
    this.shifY = 57;

    this.smallScale = 0.45;
    this.middleScale = 0.69; // it is smaller than smallScale as it is relative to the image size
    this.bigScale = 0.95;
    this.currentScale = this.smallScale;

    this.BubbleCrashsound = crashSound("assets/pop.ogg");
    this.enemyCrashsound = {
      small: [crashSound("assets/small.ogg"), crashSound("assets/small2.ogg")],
      middle: [
        crashSound("assets/middle.ogg"),
        crashSound("assets/middle2.ogg"),
      ],
      big: [crashSound("assets/big.ogg")],
    };

    // size limit
    (this.smallSize = 70), (this.middleSize = 170); // 50, 200 points (score)
  }

  drawLives() {
    for (let i = 0; i < 3; i++) {
      ctx.drawImage(
        this.currentLiveImages[i], //  image itself
        390 + 65 * i, // positionX of this image in the main sprite png
        10, // positionY of this image in the main sprite png
        50,
        50
      );
    }
  }

  draw() {
    /*  
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.position.x,this.position.y,this.radius,0,Math.PI*2);
        ctx.fill();
        ctx.closePath();   
        */
    this.drawLives();
    ctx.drawImage(
      this.currentSprite, //  image itself
      this.CropWidth * this.frame, // positionX of this image in the main sprite png
      0, // positionY of this image in the main sprite png
      this.CropWidth, // width of this image in the main sprite png
      this.CropHeight, // Height of this image in the main sprite png
      this.position.x - this.shifX, // positionX for drawing this image
      this.position.y - this.shifY, // positionY for drawing this image
      this.CropWidth * this.currentScale, // Scale of this image in width
      this.CropHeight * this.currentScale // Scale of this image in height
    );
  }
  update() {
    // update position according to mouse position
    const dx = this.position.x - mouse.x;
    const dy = this.position.y - mouse.y;
    if (mouse.x != this.position.x) {
      this.position.x -= dx / this.velocity.x;
    }
    if (mouse.y != this.position.y) {
      this.position.y -= dy / this.velocity.y;
    }
    // update direction
    this.direction = dx >= 0 ? "left" : "right";

    // update type
    this.type =
      gameScore < this.smallSize
        ? "small"
        : gameScore < this.middleSize
        ? "middle"
        : "big";
    // update scale
    this.currentScale =
      gameScore < this.smallSize
        ? this.smallScale
        : gameScore < this.middleSize
        ? this.middleScale
        : this.bigScale;
    // update shiftX,Y
    this.shifY =
      gameScore < this.smallSize ? 55 : gameScore < this.middleSize ? 90 : 120;
    this.shifX =
      gameScore < this.smallSize ? 60 : gameScore < this.middleSize ? 90 : 125;
    this.radius =
      gameScore < this.smallSize ? 42 : gameScore < this.middleSize ? 65 : 85;

    // update image direction
    if (this.direction == "right") {
      this.currentSprite = this.imgs.right;
    } else {
      this.currentSprite = this.imgs.left;
    }

    // update live stars
    this.currentLiveImages =
      this.lives == 3
        ? this.fullLiveImages
        : this.lives == 2
        ? this.middleLiveImages
        : this.oneLiveImages;

    if (gameFrame % 5 == 0) {
      if (this.frame < this.maxFrameValue) {
        this.frame++;
      } else {
        this.frame = 0;
      }
    }
  }
  crash(gameobject, objectPos) {
    var dx = Math.abs(this.position.x - gameobject.position.x);
    var dy = Math.abs(this.position.y - gameobject.position.y);
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.radius + gameobject.currentRadius) {
      if (gameobject instanceof Bubble) {
        this.BubbleCrashsound.play();
        gameBubbles.splice(objectPos, 1);
        gameScore++;
      }
      if (gameobject instanceof Enemy) {
        switch (gameobject.type) {
          case 0: // big enemy
            /* ###### GameOver ############# */
            if (this.type == "small" || this.type == "middle") {
              if (this.lives == 1) {
                gameOver();
              } else {
                this.lives--;
                gameEnemies.splice(objectPos, 1);
              }
            }
            // eat enemy
            else {
              this.enemyCrashsound.big[0].play();
              gameScore += 7;
              gameEnemies.splice(objectPos, 1);
            }
            break;
          case 1: // middle enemy
            /* ###### GameOver ############# */
            if (this.type == "small") {
              if (this.lives == 1) {
                gameOver();
              } else {
                gameEnemies.splice(objectPos, 1);
                this.lives--;
              }
            }
            // eat enemy
            else {
              this.enemyCrashsound.middle[Math.floor(Math.random() * 2)].play();
              gameScore += 5;
              gameEnemies.splice(objectPos, 1);
            }
            break;

          case 2: // eat enemy
            this.enemyCrashsound.small[Math.floor(Math.random() * 2)].play();
            gameScore += 3;
            gameEnemies.splice(objectPos, 1);
            break; // small enemy
        }
      }
    }
  }
}
/* ##############################################*/
// Enemy Class
/* ##############################################*/
class Enemy {
  constructor() {
    this.position = {
      x: canvas.width * 0.99,
      y: Math.random() * canvas.height,
    };
    this.speed = enemySpeed;
    this.radius = {
      small: 39,
      middle: 60,
      big: 80,
    };

    // image assets
    //############################################################################
    this.rightImgs = [
      createImage("assets/sprites/enemy/purpleRight.png"),
      createImage("assets/sprites/enemy/redRight.png"),
      createImage("assets/sprites/enemy/yellowRight.png"),
    ];
    this.leftImgs = [
      createImage("assets/sprites/enemy/purpleLeft.png"),
      createImage("assets/sprites/enemy/redLeft.png"),
      createImage("assets/sprites/enemy/yellowLeft.png"),
    ];

    this.type = Math.floor(Math.random() * 3); // 0: big, 1: middle, 2: small
    this.currentImage = this.leftImgs[this.type];
    this.currentSprite = this.currentImage;

    this.CropWidth = 418;
    this.CropHeight = 397;
    this.frame = 1; // for sprite animation
    this.frameX = 0;
    this.frameY = 0;

    //scale
    this.smallScale = 0.17;
    this.middleScale = 0.3; // it is smaller than smallScale as it is relative to the image size
    this.bigScale = 0.4;

    // update some parameters according to the fish size, ex: big, middle,small
    this.currentScale =
      this.type == 0
        ? this.bigScale
        : this.type == 1
        ? this.middleScale
        : this.smallScale;
    this.currentRadius =
      this.type == 0
        ? this.radius.big
        : this.type == 1
        ? this.radius.middle
        : this.radius.small;
    this.shifX = this.type == 0 ? 65 : this.type == 1 ? 55 : 30;
    this.shifY = this.type == 0 ? 80 : this.type == 1 ? 60 : 35;
    // ############################################################################
  }

  // horizontal motion
  move() {
    // update frames
    if (gameFrame % 5 == 0) {
      this.frame = this.frame < 11 ? this.frame + 1 : 0;
      this.frameX =
        this.frame == 3 || this.frame == 7 || this.frame == 11
          ? 0
          : this.frameX + 1;
      this.frameY = this.frame < 3 ? 0 : this.frame < 7 ? 1 : 2;
    }

    // update position
    if (this.position.x > -4) this.position.x -= this.speed;
  }

  draw() {
    ctx.drawImage(
      this.currentSprite, //  image itself
      this.CropWidth * this.frameX, // positionX of this image in the main sprite png
      this.CropHeight * this.frameY, // positionY of this image in the main sprite png
      this.CropWidth, // width of this image in the main sprite png
      this.CropHeight, // Height of this image in the main sprite png
      this.position.x - this.shifX, // positionX for drawing this image
      this.position.y - this.shifY, // positionY for drawing this image
      this.CropWidth * this.currentScale, // Scale of this image in width
      this.CropHeight * this.currentScale // Scale of this image in height
    );
  }
}

/* ##############################################*/
// Bubble Class
/* ##############################################*/

class Bubble {
  constructor(color) {
    this.position = {
      x: Math.random() * canvas.width,
      y: canvas.height,
    };
    this.speed = enemySpeed + 1;
    this.currentRadius = 40;
    this.color = color;
    this.img = createImage(
      "assets/sprites/bubble/bubble_pop_two/buble_pop_two_01.png"
    );
  }
  // vertical motion
  move() {
    if (this.position.y > -2) this.position.y -= this.speed;
  }

  draw() {
    ctx.drawImage(
      this.img,
      this.position.x - 60,
      this.position.y - 60,
      this.currentRadius * 3,
      this.currentRadius * 3
    );
  }
}

/* ##############################################*/
// Game initialization
/* ##############################################*/

var fish;
function init() {
  enemySpeed = 4.5;
  fish = new Fish();
  gameEnemies = [];
  gameBubbles = [];
  gameScore = 0;
}
init();

/* ##############################################*/
// Enemy, Bubble Generation
/* ##############################################*/

function generateEnemies() {
  // update enemy speed
  if (gameFrame % 700 == 0) {
    enemySpeed += 0.2;
  }

  // generate new enemies , if the number of enemies in the screen is less than 9
  var num_enemies_on_screen = 9;
  if (gameFrame % 50 == 0 && gameEnemies.length < num_enemies_on_screen) {
    var enemey = new Enemy();
    gameEnemies.push(enemey);
    gameEnemiesPositions.push(enemey.position.y);
  }

  // draw and move enemies
  for (let i = 0; i < gameEnemies.length; i++) {
    if (gameEnemies[i].position.x > -3) {
      gameEnemies[i].move();
      gameEnemies[i].draw();
      fish.crash(gameEnemies[i], i);
    } else {
      gameEnemies.splice(i, 1);
    }
  }
}

function generateBubbles() {
  // update speed
  if (gameFrame % 3000 == 0) {
    bubbleSpeed += Math.random() * 0.5;
  }
  // generate new bubbles , if the number of enemies in the screen is less than 13
  var num_enemies_on_screen = 7;

  if (gameBubbles.length < num_enemies_on_screen) {
    var bubble = new Bubble("#e7dddf ");
    gameBubbles.push(bubble);
  }

  // draw and move bubbles
  for (let i = 0; i < gameBubbles.length; i++) {
    if (gameBubbles[i].position.y > -1) {
      gameBubbles[i].move();
      gameBubbles[i].draw();
      fish.crash(gameBubbles[i], i);
    } else {
      gameBubbles.splice(i, 1);
    }
  }
}

function generateSeeSurface() {
  var seeSurfaceBackGround = {
    img: createImage("assets/sprites/background1.png"),
    x1: 0,
    x2: canvas.width,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  };
  if (gameFrame % 2500 == 0) seeSurfaceSpeed += 0.5;

  seeSurfaceBackGround.x1 -= seeSurfaceSpeed;
  seeSurfaceBackGround.x2 -= seeSurfaceSpeed;
  if (seeSurfaceBackGround.x1 < -canvas.width) seeSurfaceBackGround.x1 = 0;
  if (seeSurfaceBackGround.x2 < 0) seeSurfaceBackGround.x2 = canvas.width;
}

var SeaBedBackGround = {
  imgs: [
    createImage("assets/sprites/seabed2.webp"),
    createImage("assets/sprites/seabed2.webp"),
    createImage("assets/sprites/seabed2.webp"),
    createImage("assets/sprites/seabed2.webp"),
  ],
  x1: 0,
  x2: canvas.width,
  y: 0,
  width: canvas.width,
  height: canvas.height,
};
function generateSeaBedBackGround() {
  SeaBedBackGround.x1 -= seeSurfaceSpeed;
  SeaBedBackGround.x2 -= seeSurfaceSpeed;

  if (SeaBedBackGround.x1 <= -canvas.width) {
    SeaBedBackGround.x1 = SeaBedBackGround.x2 + canvas.width - 1;
  }
  if (SeaBedBackGround.x2 <= -canvas.width) {
    SeaBedBackGround.x2 = SeaBedBackGround.x1 + canvas.width - 1;
  }

  // Draw the first image normally
  ctx.drawImage(
    SeaBedBackGround.imgs[0],
    SeaBedBackGround.x1,
    SeaBedBackGround.y,
    SeaBedBackGround.width,
    SeaBedBackGround.height
  );

  // Save the current context state
  ctx.save();

  // Flip and draw the second image
  ctx.scale(-1, 1); // Flip horizontally
  ctx.drawImage(
    SeaBedBackGround.imgs[1],
    -SeaBedBackGround.x2 - SeaBedBackGround.width + 1, // Adjust x position for flipped image
    SeaBedBackGround.y,
    SeaBedBackGround.width,
    SeaBedBackGround.height
  );

  // Restore the context to its original state
  ctx.restore();
}

function drawText() {
  ctx.fillStyle = "black";
  ctx.font = "50px Georgia";
  ctx.fillText(`gameScore: ${gameScore}`, 10, 50);
}

/* ##############################################*/
// Main Game Functions
/* ##############################################*/

var canvasBlock = document.getElementById("mainCanvas");
var startGameBlock = document.getElementById("startGame");
var gameOverBlock = document.getElementById("gameOver");
var gameBody = document.getElementById("gameBody");

function animate() {
  // update fish status
  gameFrame++;
  fish.update();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  generateSeaBedBackGround();
  generateSeeSurface();
  // update enemies status
  generateEnemies();
  generateBubbles();
  fish.draw();
  drawText();
  requestAnimationFrame(animate);
}

function startGame() {
  startGameBlock.style.display = "none";
  canvasBlock.style.display = "block";
  gameOverBlock.style.display = "none";

  gameBody.classList.remove("bg-dark");
  gameBody.classList.add("bg-light");

  init();
  animate();
}
function startAgain() {
  startGameBlock.style.display = "none";
  canvasBlock.style.display = "block";
  gameOverBlock.style.display = "none";

  gameBody.classList.remove("bg-dark");
  gameBody.classList.add("bg-light");
  init();
}

function gameOver() {
  startGameBlock.style.display = "none";
  canvasBlock.style.display = "none";
  gameOverBlock.style.display = "block";

  gameBody.classList.remove("bg-light");
  gameBody.classList.add("bg-dark");
}

function settingGame() {
  console.log("settings");
}

function quitGame() {
  console.log("quit Game");
}

// make mouse position relative to window size
window.addEventListener("resize", function () {
  canvasPosition = canvas.getBoundingClientRect();
});
