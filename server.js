const express = require('express');
const path = require('path');
const bodyParser = require('body-parser'); // Zum Parsen der Formulardaten
const pool = require('./db'); // Stelle sicher, dass du eine db.js-Datei hast, die deine Datenbankkonfiguration enth�lt
const app = express();
const port = 3005;

// Middleware, um URL-kodierte Daten zu parsen (wichtig f�r POST-Anfragen)
app.use(bodyParser.urlencoded({ extended: true }));

// Statische Dateien bedienen
app.use(express.static(path.join(__dirname, 'public')));


// Route f�r die Startseite (Login-Seite)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/Login.html'));
});

// Route f�r den GET-Request der Login-Seite
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/Login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/dashboard.html'));
});

let angemeldeterBenutzer = null;

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query(
            'SELECT * FROM public."user" WHERE benutzername = $1 AND passwort = $2',
            [username, password]
        );
        if (user.rows.length > 0) {
            angemeldeterBenutzer = username; // Benutzername speichern
            res.status(200).send('Login erfolgreich');
        } else {
            res.status(401).send('Login fehlgeschlagen: Falscher Benutzername oder Passwort.');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/register', async (req, res) => {
    const { bname, vname, nname, email, password, phone, birthdayDay, birthdayMonth, birthdayYear } = req.body;

    try {
        const newUser = await pool.query(
            `INSERT INTO public."user" (benutzername, vorname, nachname, email, passwort, handynummer, tag, monat, jahr, bewertung)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [bname, vname, nname, email, password, phone, birthdayDay, birthdayMonth, birthdayYear, 0]
        );

        res.redirect('/registration-success.html');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



app.get('/getUserData', async (req, res) => {
    //const benutzername = 'testtest'; // Der Benutzername, nach dem gesucht wird
    if (angemeldeterBenutzer) {
        try {
            const user = await pool.query(
                'SELECT benutzername, email, handynummer, tag, monat, jahr, bewertung FROM public."user" WHERE benutzername = $1',
                [angemeldeterBenutzer]
            );
            if (user.rows.length > 0) {
                res.json(user.rows[0]);
            } else {
                res.status(404).send('Benutzer nicht gefunden');
            }
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    } else {
        res.status(404).send('Kein Benutzer angemeldet');
    }
});

app.get('/getVehicles', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(404).send('Kein Benutzer angemeldet');
    }

    try {
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            const vehicles = await pool.query(
                'SELECT * FROM public.car WHERE "userId" = $1',
                [userId]
            );

            res.json(vehicles.rows);
        } else {
            res.status(404).send('Benutzer nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/addVehicle', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { brand, modell, color, consumption, seats, doors, trunkspace, gewicht } = req.body;

    try {
        // Ermitteln der userId des angemeldeten Benutzers
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            // Einf�gen des neuen Fahrzeugs in die Datenbank
            await pool.query(
                'INSERT INTO public.car (marke, modell, farbe, verbrauch, sitze, tueren, stauraum, maxgewicht, "userId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [brand, modell, color, consumption, seats, doors, trunkspace, gewicht, userId]
            );

            res.redirect('/vehicles.html'); // Umleitung zur�ck zur Fahrzeugverwaltungsseite
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Hinzuf�gen des Fahrzeugs');
    }
});


app.delete('/deleteVehicle/:carId', async (req, res) => {
    const carId = req.params.carId;

    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        // �berpr�fen, ob das Fahrzeug dem angemeldeten Benutzer geh�rt
        const vehicle = await pool.query(
            'SELECT * FROM public.car WHERE "carId" = $1 AND "userId" = (SELECT "userId" FROM public."user" WHERE benutzername = $2)',
            [carId, angemeldeterBenutzer]
        );

        if (vehicle.rows.length > 0) {
            // Fahrzeug l�schen
            await pool.query(
                'DELETE FROM public.car WHERE "carId" = $1',
                [carId]
            );

            res.status(200).send('Fahrzeug erfolgreich gel�scht');
        } else {
            res.status(404).send('Fahrzeug nicht gefunden oder geh�rt nicht zum Benutzer');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim L�schen des Fahrzeugs');
    }
});



// Server starten
app.listen(port, '0.0.0.0', () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

