
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// =====================================
// USTAWIENIA
// =====================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8799a4);
scene.fog = new THREE.Fog(0x8799a4, 100, 350);

const camera = new THREE.PerspectiveCamera(
    75, innerWidth / innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// ŚWIATŁO
scene.add(new THREE.HemisphereLight(0xffffff, 0x555544, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(50, 100, 40);
sun.castShadow = true;
scene.add(sun);

// =====================================
// BLOKI I MAPA
// =====================================

function block(x, y, z, w, h, d, color) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color })
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    return mesh;
}

// PODŁOGA
block(0, -0.5, 0, 250, 1, 250, 0x60645b);

// GRANICE
block(0, 5, -125, 250, 10, 2, 0x555555);
block(0, 5, 125, 250, 10, 2, 0x555555);
block(-125, 5, 0, 2, 10, 250, 0x555555);
block(125, 5, 0, 2, 10, 250, 0x555555);

// MAGAZYNY
block(-45, 7, -45, 45, 14, 35, 0x777b7e);
block(45, 7, 40, 50, 14, 40, 0x686b70);
block(0, 6, 80, 35, 12, 20, 0x777b70);

// DACHY
block(-45, 14, -45, 46, 1, 36, 0x333a42);
block(45, 14, 40, 51, 1, 41, 0x333a42);

// SKRZYNIE
for (let i = 0; i < 35; i++) {
    block(
        Math.random() * 190 - 95,
        1,
        Math.random() * 190 - 95,
        3, 2, 3,
        0x98612f
    );
}

// =====================================
// GRACZ
// =====================================

const player = new THREE.Object3D();
scene.add(player);

player.position.set(0, 2, 100);
player.add(camera);

let yaw = 0;
let pitch = 0;
let velocityY = 0;
let onGround = true;

const keys = {};

window.addEventListener('keydown', e => {
    keys[e.code] = true;

    if (e.code === 'Space') {
        e.preventDefault();

        if (onGround) {
            velocityY = 8;
            onGround = false;
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

window.addEventListener('blur', () => {
    for (const key in keys) keys[key] = false;
});

// MYSZ
document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== renderer.domElement) return;

    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    pitch = THREE.MathUtils.clamp(pitch, -1.5, 1.5);

    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);
});

// MENU
const start = document.getElementById('start');

document.getElementById('play').onclick = () => {
    renderer.domElement.requestPointerLock();
};

document.addEventListener('pointerlockchange', () => {
    start.style.display =
        document.pointerLockElement === renderer.domElement
        ? 'none' : 'flex';
});

// =====================================
// PISTOLET W RĘCE
// =====================================

const gun = new THREE.Group();

const metal = new THREE.MeshStandardMaterial({
    color: 0x252525,
    metalness: 0.85,
    roughness: 0.25
});

const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0x55331e
});

// KORPUS
const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 0.65),
    metal
);

body.position.z = -0.2;
gun.add(body);

// LUFА
const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.35, 12),
    metal
);

barrel.rotation.x = Math.PI / 2;
barrel.position.set(0, 0.04, -0.55);
gun.add(barrel);

// RĘKOJEŚĆ
const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.32, 0.18),
    handleMaterial
);

handle.position.set(0, -0.23, -0.05);
gun.add(handle);

// SPUST
const trigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.09, 0.07),
    metal
);

trigger.position.set(0, -0.12, -0.2);
gun.add(trigger);

// PISTOLET DO KAMERY
camera.add(gun);
gun.position.set(0.38, -0.32, -0.65);

// BŁYSK Z LUFY
const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 12),
    new THREE.MeshBasicMaterial({
        color: 0xffaa22,
        transparent: true,
        opacity: 0
    })
);

flash.position.set(0, 0.04, -0.78);
gun.add(flash);

// ŚWIATŁO BŁYSKU
const flashLight = new THREE.PointLight(0xff8c22, 0, 5);
flashLight.position.copy(flash.position);
gun.add(flashLight);

let recoil = 0;
let flashTime = 0;

// =====================================
// STATYSTYKI
// =====================================

let hp = 100;
let ammo = 30;
let kills = 0;

function updateHUD() {
    document.getElementById('hp').textContent = hp;
    document.getElementById('ammo').textContent = ammo;
    document.getElementById('kills').textContent = kills;
}

// =====================================
// NPC
// =====================================

const npcs = [];

function spawnNPC() {
    const npc = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1.7, 0.7),
        new THREE.MeshStandardMaterial({ color: 0xa52b22 })
    );

    body.position.y = 1;
    npc.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xd6a47d })
    );

    head.position.y = 2;
    npc.add(head);

    npc.position.set(
        Math.random() * 160 - 80,
        0,
        Math.random() * 160 - 80
    );

    scene.add(npc);

    npcs.push({
        mesh: npc,
        hp: 100,
        dir: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 2,
        lastShot: 0,
        shootDelay: 1.5 + Math.random() * 2
    });
}

for (let i = 0; i < 12; i++) {
    spawnNPC();
}

// =====================================
// POCISKI NPC
// =====================================

const npcBullets = [];

function npcShoot(npc) {
    const projectile = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff4422 })
    );

    projectile.position.copy(npc.mesh.position);
    projectile.position.y += 1.5;

    const target = camera.getWorldPosition(
        new THREE.Vector3()
    );

    const direction = target.sub(projectile.position).normalize();

    scene.add(projectile);

    npcBullets.push({
        mesh: projectile,
        direction,
        life: 3
    });
}

// =====================================
// AKTUALIZACJA POCISKÓW NPC
// =====================================

function updateNPCBullets(dt) {
    const playerPosition = camera.getWorldPosition(
        new THREE.Vector3()
    );

    for (let i = npcBullets.length - 1; i >= 0; i--) {
        const bullet = npcBullets[i];

        bullet.mesh.position.addScaledVector(
            bullet.direction,
            25 * dt
        );

        bullet.life -= dt;

        const distance = bullet.mesh.position.distanceTo(
            playerPosition
        );

        if (distance < 1.2) {
            hp = Math.max(0, hp - 10);
            updateHUD();

            scene.remove(bullet.mesh);
            npcBullets.splice(i, 1);

            continue;
        }

        if (bullet.life <= 0) {
            scene.remove(bullet.mesh);
            npcBullets.splice(i, 1);
        }
    }
}

// =====================================
// STRZELANIE GRACZA
// =====================================

const raycaster = new THREE.Raycaster();

function shoot() {
    if (document.pointerLockElement !== renderer.domElement) return;
    if (ammo <= 0) return;

    ammo--;
    recoil = 0.12;

    // BŁYSK
    flashTime = 0.09;
    flash.material.opacity = 1;
    flashLight.intensity = 8;

    updateHUD();

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );

    const objects = npcs.flatMap(n => n.mesh.children);
    const hits = raycaster.intersectObjects(objects);

    if (hits.length > 0) {
        const npc = npcs.find(n =>
            n.mesh.children.includes(hits[0].object)
        );

        if (npc) {
            npc.hp -= 50;

            if (npc.hp <= 0) {
                scene.remove(npc.mesh);
                npcs.splice(npcs.indexOf(npc), 1);

                kills++;
                updateHUD();
                spawnNPC();
            }
        }
    }
}

document.addEventListener('mousedown', e => {
    if (e.button === 0) shoot();
});

// PRZEŁADOWANIE
window.addEventListener('keydown', e => {
    if (e.code === 'KeyR' && ammo < 30) {
        ammo = 30;
        updateHUD();
    }
});

// =====================================
// RUCH NPC
// =====================================

function updateNPCs(dt, now) {
    for (const npc of npcs) {
        npc.dir += Math.sin(
            now * 0.001 + npc.mesh.position.x
        ) * dt * 0.4;

        npc.mesh.position.x +=
            Math.sin(npc.dir) * npc.speed * dt;

        npc.mesh.position.z +=
            Math.cos(npc.dir) * npc.speed * dt;

        npc.mesh.position.x = THREE.MathUtils.clamp(
            npc.mesh.position.x, -115, 115
        );

        npc.mesh.position.z = THREE.MathUtils.clamp(
            npc.mesh.position.z, -115, 115
        );

        npc.mesh.rotation.y = npc.dir;

        // STRZELANIE NPC
        const distance = npc.mesh.position.distanceTo(
            player.position
        );

        if (
            distance < 45 &&
            now - npc.lastShot > npc.shootDelay * 1000
        ) {
            npcShoot(npc);
            npc.lastShot = now;
        }
    }
}

// =====================================
// RUCH GRACZA
// =====================================

function updatePlayer(dt) {
    const forward =
        (keys['KeyW'] ? 1 : 0) -
        (keys['KeyS'] ? 1 : 0);

    const side =
        (keys['KeyD'] ? 1 : 0) -
        (keys['KeyA'] ? 1 : 0);

    const direction = new THREE.Vector3(
        side, 0, -forward
    );

    if (direction.lengthSq() > 0) {
        direction.normalize();

        direction.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            yaw
        );

        player.position.x += direction.x * 12 * dt;
        player.position.z += direction.z * 12 * dt;
    }

    velocityY -= 20 * dt;
    player.position.y += velocityY * dt;

    if (player.position.y <= 2) {
        player.position.y = 2;
        velocityY = 0;
        onGround = true;
    }

    player.position.x = THREE.MathUtils.clamp(
        player.position.x, -120, 120
    );

    player.position.z = THREE.MathUtils.clamp(
        player.position.z, -120, 120
    );
}

// =====================================
// ANIMACJA BRONI
// =====================================

function updateGun(dt) {
    recoil = THREE.MathUtils.lerp(recoil, 0, 12 * dt);

    gun.position.z = -0.65 + recoil;
    gun.rotation.x = -0.05 - recoil * 0.5;

    if (flashTime > 0) {
        flashTime -= dt;
        flash.material.opacity = 1;
        flashLight.intensity = 8;
    } else {
        flash.material.opacity = 0;
        flashLight.intensity = 0;
    }
}

// =====================================
// GŁÓWNA PĘTLA
// =====================================

let last = performance.now();

function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    updatePlayer(dt);
    updateNPCs(dt, now);
    updateNPCBullets(dt);
    updateGun(dt);
    updateHUD();

    renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// =====================================
// OKNO
// =====================================

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
});

console.log('MAGAZYN FPS - GRA URUCHOMIONA!');
