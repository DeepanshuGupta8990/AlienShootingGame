class Player{
    constructor(game){
      this.game = game;
      this.width = 100;
      this.height = 100;
      this.x = this.game.width*0.5;
      this.y = this.game.height - this.height;
      this.speed = 5;
    }
    draw(ctx){
        ctx.fillRect(this.x,this.y,this.width,this.height);

    }
    update(){
      if(this.game.keys.includes('ArrowRight')){
        this.x += this.speed;
      }
      else if(this.game.keys.includes('ArrowLeft')){
        this.x += -this.speed;
      }
      else if(this.game.keys.includes('ArrowUp')){
        this.y += -this.speed;
      }
      else if(this.game.keys.includes('ArrowDown')){
        this.y += this.speed;
      }

      //boundries
      if(this.x < -this.width*0.5){
        this.x = -this.width*0.5;
      }
      else if(this.x  > this.game.width - this.width*0.5){
        this.x = this.game.width - this.width*0.5;
      }
      
      if(this.y < 0){
        this.y = 0;
      }
      else if(this.y + this.height > this.game.height){
        this.y = this.game.height - this.height;
      }

    }
    shoot(){
        const projectile = this.game.getProjectile();
        if(projectile){
            projectile.start(this.x+this.width*0.5,this.y)
        }
    }
}

class Projectile{
    constructor(){
      this.width = 4;
      this.height = 20;
      this.x = 0;
      this.y = 0;
      this.speed = 20;
      this.free = true;
    }
    draw(ctx){
        if(!this.free){
          ctx.fillRect(this.x,this.y,this.width,this.height)
        }
    }
    update(){
        if(!this.free){
          this.y += -this.speed
        }
        if(this.y < -this.height){
            this.reset();
        }
    }
    start(x,y){
     this.x = x-this.width*0.5;
     this.y = y;
     this.free = false;
    }
    reset(){
     this.free = true;
    }
}

class Enemy{
    constructor(game,positionX,positionY){
      this.game = game;
      this.width = this.game.enemySize;
      this.height =  this.game.enemySize;
      this.x = 0;
      this.y = 0;
      this.positionX = positionX;
      this.positionY = positionY;
      this.markedForDeletion = false;
      
    }
    draw(ctx){
      ctx.strokeRect(this.x,this.y,this.width,this.height);
    }
    update(x,y){
      this.x = x + this.positionX;
      this.y = y + this.positionY;

      //check collision with projectiles
      this.game.projectilesPool.forEach((projectile)=>{
       if(!projectile.free && this.game.checkCollision(this,projectile)){
        this.markedForDeletion = true;
        projectile.reset();
        this.game.score++; 
       }
      })
      //lose condition
      if(this.y + this.height >= this.game.height){
          this.game.gameOver = true;
          this.markedForDeletion = true;
      }
    }
}

class Wave{
  constructor(game){
    this.game = game;
    this.width = this.game.colums * this.game.enemySize;
    this.height = this.game.rows * this.game.enemySize;
    this.x = 0;
    this.y = -this.height;
    this.speedX = 3;
    this.speedY = 0;
    this.enemies = [];
    this.nextWaveTrigger = false;
    this.create();

  }
  render(ctx){
    // ctx.strokeRect(this.x,this.y,this.width,this.height);
    if(this.y<0){
      this.y += 5;
    }
    this.speedY = 0;
    if(this.x<0 || this.x > this.game.width-this.width){
      this.speedX = -this.speedX
      this.speedY = this.game.enemySize;
    }
    this.x += this.speedX;
    this.y += this.speedY;
    this.enemies.forEach((enemy)=>{
      enemy.update(this.x,this.y);
      enemy.draw(ctx);
    })
   this.enemies = this.enemies.filter((enemy)=>{
    return (!enemy.markedForDeletion)
   })
  }
  create(){
    for(let y=0; y<this.game.rows; y++){
      for(let x=0; x < this.game.colums; x++){
       let enemyX = x*this.game.enemySize;
       let enemyY = y*this.game.enemySize;
       this.enemies.push(new Enemy(this.game,enemyX,enemyY));
      }
    }
  }
}

class Game{
    constructor(canvas){
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.keys = [];
      this.player = new Player(this);

      this.projectilesPool = [];
      this.numberOfProjectiles = 10;
      this.createProjectiles();
     
      this.colums = 2;
      this.rows = 2;
      this.enemySize = 60;

      this.wave = [];
      this.wave.push(new Wave(this));
      this.wavecount = 1;

      this.score = 0;
      this.gameOver = false;


      //event listeners
      window.addEventListener('keydown',(e)=>{
        const index = this.keys.indexOf(e.key);
        if(index === -1){
            this.keys.push(e.key);
        }
        if(e.key === ' '){
            this.player.shoot();
        }
      })
      window.addEventListener("keyup",(e)=>{
        const index = this.keys.indexOf(e.key);
        if(index > -1){
            this.keys.splice(index,1);
        }
      })
    }
    render(ctx){
      this.drawStatusText(ctx);
        this.player.draw(ctx);
        this.player.update();
        this.projectilesPool.forEach((projectile)=>{
            projectile.update();
            projectile.draw(ctx)
        })
      this.wave.forEach((wave)=>{
        wave.render(ctx);
        if(wave.enemies.length < 1 && !wave.nextWaveTrigger && !this.gameOver){
          this.newWave();
          this.wavecount++;
          wave.nextWaveTrigger = true;
        }
      })
    }
    createProjectiles(){
        for(let i=0; i<this.numberOfProjectiles; i++){
            this.projectilesPool.push(new Projectile());
        }
    }
    getProjectile(){
        for(let i=0; i<this.numberOfProjectiles; i++){
            if(this.projectilesPool[i].free){
                return this.projectilesPool[i];
            }
        }
    }
    checkCollision(a,b){
       return(a.x + a.width > b.x &&
          a.x < b.x + b.width &&
          a.y + a.height > b.y && 
          a.y < b.y + b.height)
    }
    drawStatusText(ctx){
      ctx.font = "50px Arial";
     ctx.fillText(`Score: ${this.score}`,20,40);
     ctx.fillText(`WaveCount: ${this.wavecount}`,20,80);
     if(this.gameOver){
      ctx.save();
        ctx.fillStyle = "red";
        ctx.font = "50px Arial";
        ctx.fillText("Game Over!",this.width/2 -150,this.height/2);
        ctx.fillText(`Score: ${this.score}`,this.width/2 - 150,this.height/2 + 50);
        ctx.restore();
     }
    }
    newWave(){
      if(Math.random() < 0.5 && this.colums * this.enemySize < this.width * 0.8){
        this.colums++;
      }else if(this.rows * this.colums * this.enemySize < this.width * 0.8){
        this.rows++;
      }
      this.wave.push(new Wave(this));
    }
}

window.addEventListener('load',()=>{
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 720;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;

    const game = new Game(canvas);
    game.render(ctx);

    function animate(){
        ctx.clearRect(0,0,canvas.width, canvas.height);
        game.render(ctx);
        requestAnimationFrame(animate);
    }
    animate();
})