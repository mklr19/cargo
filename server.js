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
            `INSERT INTO public."user" (benutzername, vorname, nachname, email, passwort, handynummer, tag, monat, jahr, bewertung, geld)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [bname, vname, nname, email, password, phone, birthdayDay, birthdayMonth, birthdayYear, 0, 0]
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
                'SELECT benutzername, email, handynummer, tag, monat, jahr, bewertung, geld FROM public."user" WHERE benutzername = $1',
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

// Endpunkt zum Hinzuf�gen von Geld zum Benutzerkonto
app.post('/addMoney', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { amount } = req.body;

    try {
        // Ermitteln des aktuellen Guthabens des Benutzers
        const userResult = await pool.query(
            'SELECT geld FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            let currentBalance = parseFloat(userResult.rows[0].geld);
            const newBalance = currentBalance + parseFloat(amount);

            // Aktualisieren des Guthabens des Benutzers
            await pool.query(
                'UPDATE public."user" SET geld = $1 WHERE benutzername = $2',
                [newBalance, angemeldeterBenutzer]
            );

            res.status(200).send('Geld erfolgreich hinzugef�gt');
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Hinzuf�gen von Geld');
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

    const { brand, modell, color, consumption, seats, doors, trunkspace, gewicht, sonder } = req.body;

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
                'INSERT INTO public.car (marke, modell, farbe, verbrauch, sitze, tueren, stauraum, maxgewicht, sonderfunktion,  "userId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [brand, modell, color, consumption, seats, doors, trunkspace, gewicht, sonder, userId]
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


app.post('/addSearch', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { startOrt, zielOrt, startDatum, personen, raum, gewicht } = req.body;
    const status = 'offen';
    const erstellDatum = new Date().toISOString().slice(0, 10);

    try {
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            await pool.query(
                'INSERT INTO public.searchs ("userId", "startOrt", "zielOrt", "startDatum", personen, raum, gewicht, "erstellDatum", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [userId, startOrt, zielOrt, startDatum, personen, raum, gewicht, erstellDatum, status]
            );

            res.status(200).send('Suchanfrage erfolgreich erstellt');
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Erstellen der Suchanfrage');
    }
});

app.get('/getSearchRequests', async (req, res) => {
    try {
        const searchRequests = await pool.query(
            'SELECT s."startOrt", s."zielOrt", s."startDatum", s.personen, s.raum, s.gewicht, u.benutzername ' +
            'FROM public.searchs s ' +
            'JOIN public."user" u ON s."userId" = u."userId"'
        );

        res.json(searchRequests.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/addOffer', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { startOrt, zielOrt, startZeit, preisperson, preisraum, preisgewicht, sitze, stauraum, mgewi, carId } = req.body;
    const status = "offen";
    const erstellungsDatum = new Date().toISOString().slice(0, 10);

    try {
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            await pool.query(
                'INSERT INTO public.offers ("userId", "carId", "startOrt", "zielOrt", "startZeit", sitze, stauraum, preisperson, status, "erstellungsDatum", maxgewicht, preisraum,preisgewicht) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                [userId, carId, startOrt, zielOrt, startZeit, sitze, stauraum, preisperson, status, erstellungsDatum, mgewi, preisraum, preisgewicht]
            );

            res.status(200).send('Angebot erfolgreich erstellt');
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Erstellen des Angebots');
    }
});


app.get('/getAllOffers', async (req, res) => {
    try {
        const offers = await pool.query(
            'SELECT o."offerId", o."startOrt", o."zielOrt", o."startZeit", o.preisperson, o.sitze, o.stauraum, o.maxgewicht,o.preisraum,o.preisgewicht, u.benutzername ' +
            'FROM public.offers o ' +
            'INNER JOIN public."user" u ON o."userId" = u."userId"'
        );
        res.json(offers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



app.get('/getFilteredOffers', async (req, res) => {
    const { startOrt, zielOrt, filterDatum } = req.query;

    try {
        let query = 'SELECT o."offerId", o."startOrt", o."zielOrt", o."startZeit", o.preisperson, o.sitze, o.stauraum, o.maxgewicht, o.preisraum, o.preisgewicht, u.benutzername ' +
            'FROM public.offers o ' +
            'INNER JOIN public."user" u ON o."userId" = u."userId" WHERE 1=1';
        let queryParams = [];

        if (startOrt) {
            queryParams.push(startOrt);
            query += ` AND o."startOrt" = $${queryParams.length}`;
        }

        if (zielOrt) {
            queryParams.push(zielOrt);
            query += ` AND o."zielOrt" = $${queryParams.length}`;
        }

        if (filterDatum) {
            queryParams.push(filterDatum);
            query += ` AND o."startZeit"::date = $${queryParams.length}`;
        }

        const filteredOffers = await pool.query(query, queryParams);
        res.json(filteredOffers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});





app.get('/getOfferDetails', async (req, res) => {
    const { offerId } = req.query;
    try {
        const offerDetails = await pool.query(
            'SELECT o.*, u.benutzername FROM public.offers o ' +
            'JOIN public."user" u ON o."userId" = u."userId" ' +
            'WHERE "offerId" = $1',
            [offerId]
        );
        if (offerDetails.rows.length > 0) {
            res.json(offerDetails.rows[0]);
        } else {
            res.status(404).send('Angebot nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


app.post('/bookOffer', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { offerId, persons, storageSpace, weight } = req.body;
    const bookingDate = new Date().toISOString().slice(0, 10);

    try {
        const userResult = await pool.query(
            'SELECT "userId", geld FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;
            let userBalance = userResult.rows[0].geld;

            const offerResult = await pool.query(
                'SELECT "userId", preisperson, preisraum, preisgewicht, sitze, stauraum, maxgewicht FROM public.offers WHERE "offerId" = $1',
                [offerId]
            );

            if (offerResult.rows.length > 0) {
                const { preisperson, preisraum, preisgewicht, sitze, stauraum, maxgewicht } = offerResult.rows[0];
                const totalPrice = (persons * preisperson) + (storageSpace * preisraum) + (weight * preisgewicht);

                if (totalPrice > userBalance) {
                    return res.status(400).send('Nicht genug Guthaben f�r diese Buchung');
                }



                await pool.query(
                    'INSERT INTO public.booking ("offerId", "userId", personen, raum, gewicht, buchungsdatum, preis) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [offerId, userId, persons, storageSpace, weight, bookingDate, totalPrice]
                );

                await pool.query(
                    `UPDATE public.offers 
                     SET sitze = sitze - $1, 
                         stauraum = stauraum - $2, 
                         maxgewicht = maxgewicht - $3 
                     WHERE "offerId" = $4`,
                    [persons, storageSpace, weight, offerId]
                );

                const newBalance = userBalance - totalPrice;
                await pool.query(
                    'UPDATE public."user" SET geld = $1 WHERE "userId" = $2',
                    [newBalance, userId]
                );

                // Ermitteln der Benutzer-ID des Anbieters
                const providerId = offerResult.rows[0].userId; // Angenommen, die Spalte 'userId' in 'offers' enth�lt die Benutzer-ID des Anbieters

                // Aktualisieren Sie das Guthaben des Anbieters
                await pool.query(
                    'UPDATE public."user" SET geld = geld + $1 WHERE "userId" = $2',
                    [totalPrice, providerId]
                );
                res.status(200).send('Buchung erfolgreich');
            } else {
                res.status(404).send('Angebot nicht gefunden');
            }
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler bei der Buchung');
    }
});



app.get('/getCurrentOffers', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            const currentOffers = await pool.query(
                'SELECT * FROM public.offers WHERE "userId" = $1 AND status = $2',
                [userId, 'offen']
            );

            res.json(currentOffers.rows);
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.get('/getCurrentBookings', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            const bookings = await pool.query(
                'SELECT b.*, o."startOrt", o."zielOrt" FROM public.booking b ' +
                'JOIN public.offers o ON b."offerId" = o."offerId" ' +
                'WHERE b."userId" = $1',
                [userId]
            );

            res.json(bookings.rows);
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});




app.get('/getUserBalance', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(404).send('Kein Benutzer angemeldet');
    }

    try {
        const user = await pool.query(
            'SELECT geld FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (user.rows.length > 0) {
            res.json(user.rows[0]);
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});



// Server starten
app.listen(port, '0.0.0.0', () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
