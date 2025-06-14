let nameTags = {};
const socket = io();

let scene, camera, renderer, myCube;
const players = {};

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.y = 5;
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  myCube = new THREE.Mesh(cubeGeo, cubeMat);
  scene.add(myCube);

  socket.on("currentPlayers", (data) => {
    for (let id in data) {
      if (id !== socket.id) addOtherPlayer(id, data[id]);
    }
  });

  socket.on("newPlayer", ({ id, position }) => addOtherPlayer(id, position));
  socket.on("playerMoved", ({ id, position }) => {
    if (players[id]) {
      players[id].position.set(position.x, position.y, position.z);
    }
  });
  socket.on("playerDisconnected", (id) => {
    if (players[id]) {
      scene.remove(players[id]);
      delete players[id];
    }
  });

  window.addEventListener("keydown", movePlayer);
}

function addOtherPlayer(id, position) {
  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(position.x, position.y, position.z);
  players[id] = cube;
  scene.add(cube);
}

function movePlayer(event) {
  const speed = 0.5;
  switch (event.key) {
    case "ArrowUp":
      myCube.position.z -= speed;
      break;
    case "ArrowDown":
      myCube.position.z += speed;
      break;
    case "ArrowLeft":
      myCube.position.x -= speed;
      break;
    case "ArrowRight":
      myCube.position.x += speed;
      break;
  }
  socket.emit("move", {
    x: myCube.position.x,
    y: myCube.position.y,
    z: myCube.position.z,
  });
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function addOtherPlayer(id, position) {
  // Create a 3D cube for the player
  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(position.x, position.y, position.z);
  players[id] = cube;
  scene.add(cube);

  // Create the name tag for the player
  const nameTag = document.createElement('div');
  nameTag.className = 'name-tag';
  nameTag.textContent = "Player " + id; // Default name
  document.body.appendChild(nameTag);

  nameTags[id] = { tag: nameTag, position: position }; // Store name tag and position

  // Make name tag editable on click
  nameTag.addEventListener('click', () => {
    const newName = prompt("Enter your new name:", nameTag.textContent);
    if (newName) {
      nameTag.textContent = newName;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  // Update name tag positions based on player cubes
  for (let id in players) {
    const player = players[id];
    const nameTag = nameTags[id].tag;
    
    // Position the name tag above the cube
    const screenPosition = player.position.clone().project(camera);
    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = -(screenPosition.y * 0.5 + 0.5) * window.innerHeight;
    nameTag.style.left = `${x}px`;
    nameTag.style.top = `${y}px`;
  }

  renderer.render(scene, camera);
}

socket.on("updateName", ({ id, name }) => {
  if (nameTags[id]) {
    nameTags[id].tag.textContent = name;
  }
});
