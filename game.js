// Initialisiere Kaboom
kaboom({
    width: 960,
    height: 600,
    background: [135, 206, 235],
    root: document.getElementById("game"),
    global: true,
    scale: 1
});

// Lade Assets
loadRoot('https://i.imgur.com/')
loadSprite("hero", "yZIb8O2.png");
loadSprite("ground", "vWJWmvb.png");
loadSprite("enemy", "Ei1VnX8.png");
loadSprite("powerup", "I7xSp7w.png");
loadSprite("fireball", "c6JFi5Z.png");

// Schießen (nur wenn fireball-Kraft aktiv)
function setupShooting(player) {
    onKeyPress("f", () => {
        if (POWERS.fireball) {
            add([
                sprite("fireball"),
                pos(player.pos.x + 24, player.pos.y + 8),
                area(),
                move(RIGHT, 600),
                offscreen({ destroy: true }),
                "fireball"
            ]);
        }
    });
    // Feuerball trifft Gegner
    onCollide("fireball", "enemy", (fireball, enemy) => {
        destroy(fireball);
        destroy(enemy);
    });
}

// Spielzustände
let POWERS = {
    doubleJump: false,
    superSpeed: false,
    flight: false,
    shield: false,
    fireball: false
};

// Spielstatistik
let GAME_STATE = {
    score: 0,
    lives: 3
};

// Szene erstellen
scene("game", () => {
    // Schwerkraft definieren
    setGravity(2000);

    // Level erstellen
    const BLOCK_SIZE = 40;
    
    // Grundlegendes Level-Layout
    const levelLayout = [
        "                                        ",
        "                P   ==    P             ",
        "                                        ",
        "         ==      P      ==     P      ",
        "                           =========    ",
        "    P               ==         P        ",
        "               ==         P             ",
        "         ==            P      ==        ",
        "    P         P         P               ",
        "=================    ==================="
    ];

    // Level aus Layout generieren
    for (let row = 0; row < levelLayout.length; row++) {
        for (let col = 0; col < levelLayout[row].length; col++) {
            const char = levelLayout[row][col];
            const posX = col * BLOCK_SIZE;
            const posY = row * BLOCK_SIZE;

            if (char === "=") {
                add([
                    sprite("ground"),
                    pos(posX, posY),
                    area(),
                    body({ isStatic: true }),
                    "ground"
                ]);
            }
            if (char === "P") {
                add([
                    sprite("powerup"),
                    pos(posX, posY),
                    area(),
                    "powerup"
                ]);
            }
        }
    }

    // Spieler erstellen
    const player = add([
        sprite("hero"),
        pos(100, 300),
        area(),
        body(),
        // Custom properties (do not duplicate Kaboom built-ins)
        {
            speed: 400,
            doubleJumpAvailable: false
        }
    ]);
    // jumpForce und isJumping separat definieren, um Konflikte mit Kaboom zu vermeiden
    player.jumpForce = 800;
    // Entferne isJumping komplett, da Kaboom intern eine Komponente mit diesem Namen verwendet

    // Shooting-Mechanik initialisieren
    setupShooting(player);

    // Steuerung
    onKeyDown("left", () => {
        player.move(-player.speed * (POWERS.superSpeed ? 1.5 : 1), 0);
    });

    onKeyDown("right", () => {
        player.move(player.speed * (POWERS.superSpeed ? 1.5 : 1), 0);
    });

    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(player.jumpForce);
            // Entfernt: player.isJumping = true; // Kaboom hat intern eine Komponente mit diesem Namen
            player.doubleJumpAvailable = POWERS.doubleJump;
        } else if (player.doubleJumpAvailable) {
            player.jump(player.jumpForce * 0.8);
            player.doubleJumpAvailable = false;
        } else if (POWERS.flight) {
            player.jump(player.jumpForce * 0.5);
        }
    });

    // Kollisionen
    player.onCollide("powerup", (p) => {
        destroy(p);
        // Zufällige neue Kraft freischalten
        const availablePowers = Object.keys(POWERS).filter(power => !POWERS[power]);
        if (availablePowers.length > 0) {
            const newPower = availablePowers[Math.floor(Math.random() * availablePowers.length)];
            POWERS[newPower] = true;
            add([
                text("Neue Kraft: " + newPower + "!"),
                pos(width() / 2, height() / 2),
                { anchor: "center" },
                lifespan(1)
            ]);
        } else {
            // Wenn alle Kräfte gesammelt, zeige Gewinn-Nachricht und beende das Spiel
            add([
                text("Alle Kräfte gesammelt! Du hast gewonnen!"),
                pos(width() / 2, height() / 2),
                { anchor: "center" },
                lifespan(3)
            ]);
            wait(3, () => {
                go("win");
            });
        }
    });

    // Kamera folgt dem Spieler
    player.onUpdate(() => {
        camPos(player.pos);
        // ACHTUNG: isJumping darf nirgends als Funktion verwendet werden!
    });
});

// Gewinn-Szene
scene("win", () => {
    add([
        text("Glückwunsch! Du hast alle Kräfte gesammelt!"),
        pos(width() / 2, height() / 2),
        { anchor: "center" }
    ]);
    add([
        text("Drücke Leertaste für einen Neustart."),
        pos(width() / 2, height() / 2 + 40),
        { anchor: "center" }
    ]);
    onKeyPress("space", () => {
        // Setze alle Kräfte zurück
        Object.keys(POWERS).forEach(k => POWERS[k] = false);
        go("game");
    });
});

// Starte das Spiel
go("game");
