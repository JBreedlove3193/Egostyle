// ---------------------------------------------
// 1) Region Configurations
// ---------------------------------------------
const regionConfigs = [
  {
    key: 'Farmstead',
    name: 'Farmstead',
    tileGen: (x,y) => (Math.random()<0.02 ? 2 : 0), // 0=soil,1=road,2=crop
    colors: { 0:0xA0522D, 1:0x8B4513, 2:0x228B22 },
    adj: { north:'EastRiverlands', east:'Silvermine', south:null, west:null },
    npcs: [ { x:10,y:8,name:'Tool Shed' } ],
    quests: [ { npc:'Tool Shed', text:'Bring me 5 wood.' } ]
  },
  {
    key: 'EastRiverlands',
    name: 'East Riverlands',
    tileGen: (x,y)=> (y===15||x===20?1:0),
    colors:{0:0x32CD32,1:0x8B4513},
    adj:{ north:'NorthWoods', east:'FairbridgeTown', south:'Farmstead', west:null },
    npcs:[{x:5,y:5,name:'Boat Captain'}],
    quests:[{ npc:'Boat Captain', text:'Fetch me 3 fish.' }]
  },
  {
    key:'FairbridgeTown',
    name:'Fairbridge Town',
    tileGen:(x,y)=> (y>10&&y<12?1:0),
    colors:{0:0xC0C0C0,1:0x808080},
    adj:{ north:'MountainPass', east:'SunsetOrchard', south:'Silvermine', west:'EastRiverlands' },
    npcs:[
      {x:10,y:8,name:'Mayor Dunn'},
      {x:14,y:8,name:'Maribel'}
    ],
    quests:[
      { npc:'Mayor Dunn', text:'Find the lost locket.' },
      { npc:'Maribel',   text:'Collect 5 berries.' }
    ]
  },
  {
    key:'Silvermine',
    name:'Silvermine Entrance',
    tileGen:(x,y)=>(x<5||y<5?0:1),
    colors:{0:0x696969,1:0x2F4F4F},
    adj:{ north:'FairbridgeTown', east:'DryDunes', south:null, west:'Farmstead' },
    npcs:[],
    quests:[]
  },
  {
    key:'MountainPass',
    name:'Mountain Pass',
    tileGen:(x,y)=>(x<3||x>22?1:0),
    colors:{0:0xA9A9A9,1:0x696969},
    adj:{ north:'CrystalCaverns', east:'SunsetOrchard', south:'FairbridgeTown', west:null },
    npcs:[{x:12,y:5,name:'Hermit'}],
    quests:[{ npc:'Hermit', text:'Bring me 5 gems.' }]
  },
  {
    key:'CrystalCaverns',
    name:'Crystal Caverns',
    tileGen:(x,y)=>(Math.random()<0.03?3:0), // 3=crystal
    colors:{0:0x191970,3:0x00CED1},
    adj:{ north:null, east:null, south:'MountainPass', west:null },
    npcs:[],
    quests:[]
  },
  {
    key:'SunsetOrchard',
    name:'Sunset Orchard',
    tileGen:(x,y)=>(x%5===0?4:0), // 4=tree
    colors:{0:0xDEB887,4:0xFF8C00},
    adj:{ north:null, east:null, south:null, west:'FairbridgeTown' },
    npcs:[{x:8,y:8,name:'Orchard Keeper'}],
    quests:[{ npc:'Orchard Keeper', text:'Harvest 10 apples.' }]
  },
  {
    key:'NorthWoods',
    name:'North Farbridge Woods',
    tileGen:(x,y)=>0,
    colors:{0:0x228B22},
    adj:{ north:null, east:null, south:'EastRiverlands', west:null },
    npcs:[{x:5,y:10,name:'Herbalist'}],
    quests:[{ npc:'Herbalist', text:'Collect 5 mushrooms.' }]
  },
  {
    key:'DryDunes',
    name:'Dry Sands Dunes',
    tileGen:(x,y)=>1,
    colors:{1:0xEDC9AF},
    adj:{ north:null, east:null, south:null, west:'Silvermine' },
    npcs:[],
    quests:[]
  }
];

// ---------------------------------------------
// 2) Season Manager
// ---------------------------------------------
class SeasonManager {
  constructor(scene){
    this.scene = scene;
    this.seasons = ['Spring','Summer','Fall','Winter'];
    this.current = 0;
    // full‐screen overlay:
    this.overlay = scene.add.rectangle(0,0,scene.cameras.main.width,scene.cameras.main.height,0xffffff,0)
      .setOrigin(0,0).setDepth(100);
    this.updateOverlay();
    // rotate every 60s:
    scene.time.addEvent({
      delay: 60000,
      callback: ()=>{ this.current = (this.current+1)%4; this.updateOverlay(); },
      loop: true
    });
  }
  updateOverlay(){
    const tint = [0xFFC0CB,0x000000,0xFFA500,0xFFFFFF];
    const alpha=[0.2,0.0,0.2,0.4];
    this.overlay.fillColor = tint[this.current];
    this.overlay.alpha     = alpha[this.current];
  }
}

// ---------------------------------------------
// 3) Quest Manager (stub)
// ---------------------------------------------
class QuestManager {
  constructor(scene){
    this.scene = scene;
    this.quests = scene.regionConfig.quests;
  }
  talkTo(npcName){
    const q = this.quests.find(q=>q.npc===npcName);
    if(q){
      this.scene.add.text(20, 550, `Quest: ${q.text}`, { font: '16px monospace', fill:'#fff' })
        .setDepth(200).setScrollFactor(0)
        .setAlpha(0)
        .fadeIn = this.scene.tweens.add({
          targets:this.scene.children.getLast(true),
          alpha:1, duration:500, yoyo:true, hold:2000
        });
    }
  }
}

// ---------------------------------------------
// 4) Generic Map Scene
// ---------------------------------------------
class MapScene extends Phaser.Scene {
  constructor(cfg){
    super({ key: cfg.key });
    this.regionConfig = cfg;
  }

  preload(){
    // none—using Graphics
  }

  create(){
    const { width, height } = this.cameras.main;
    this.tileSize = 32;
    this.cols = Math.floor(width/this.tileSize);
    this.rows = Math.floor(height/this.tileSize);
    // draw map once to a texture
    const rt = this.add.renderTexture(0,0,width,height).setOrigin(0);
    for(let y=0;y<this.rows;y++){
      for(let x=0;x<this.cols;x++){
        const t = this.regionConfig.tileGen(x,y);
        const c = this.regionConfig.colors[t]||0x000000;
        rt.fill(c,1,x*this.tileSize,y*this.tileSize,this.tileSize,this.tileSize);
      }
    }

    // player
    this.player = this.physics.add.sprite(
      this.cols/2*this.tileSize + this.tileSize/2,
      this.rows/2*this.tileSize + this.tileSize/2,
      null
    ).setDisplaySize(this.tileSize-4,this.tileSize-4)
     .setTint(0x0000FF);

    // NPCs
    this.npcs = this.regionConfig.npcs.map(d=>{
      let spr = this.add.rectangle(
        d.x*this.tileSize+this.tileSize/2,
        d.y*this.tileSize+this.tileSize/2,
        this.tileSize-4,this.tileSize-4,0xFFFF00
      );
      spr.name = d.name;
      return spr;
    });

    // input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', ()=>{
      // talk if near an NPC
      this.npcs.forEach(npc=>{
        if(Phaser.Math.Distance.Between(
          npc.x,npc.y,this.player.x,this.player.y
        )<this.tileSize){
          this.questManager.talkTo(npc.name);
        }
      });
    });

    // camera follow
    this.cameras.main.startFollow(this.player,true);

    // Season & Quests
    this.seasonManager = new SeasonManager(this);
    this.questManager  = new QuestManager(this);
  }

  update(){
    let speed = 100;
    this.player.setVelocity(0);
    if(this.cursors.left.isDown)  this.player.setVelocityX(-speed);
    if(this.cursors.right.isDown) this.player.setVelocityX( speed);
    if(this.cursors.up.isDown)    this.player.setVelocityY(-speed);
    if(this.cursors.down.isDown)  this.player.setVelocityY( speed);

    // Region transitions
    const x = this.player.x, y = this.player.y;
    if(x<0||x>this.cols*this.tileSize||y<0||y>this.rows*this.tileSize){
      const dir = x<0?'west': x>this.cols*this.tileSize?'east':
                  y<0?'north': y>this.rows*this.tileSize?'south':null;
      const next = this.regionConfig.adj[dir];
      if(next){
        this.scene.start(next);
        return;
      }
    }
  }
}

// ---------------------------------------------
// 5) Bootstrapping all scenes
// ---------------------------------------------
window.regionScenes = regionConfigs.map(cfg=> new MapScene(cfg));
