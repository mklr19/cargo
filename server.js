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
    const { bname, vname, nname, email, password, phone, birthday } = req.body;

    // Datum in einzelne Komponenten zerlegen, falls benötigt
    const [year, month, day] = birthday.split('-');

    try {
        const newUser = await pool.query(
            `INSERT INTO public."user" (benutzername, vorname, nachname, email, passwort, handynummer, tag, monat, jahr, bewertung, geld)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [bname, vname, nname, email, password, phone, day, month, year, 0, 0]
        );

        res.redirect('/registration-success.html');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


app.get('/getUserData', async (req, res) => {
    if (angemeldeterBenutzer) {
        try {
            const user = await pool.query(
                'SELECT benutzername, vorname, nachname, email, handynummer, tag, monat, jahr, bewertung, geld, attribute, notiz FROM public."user" WHERE benutzername = $1',
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

app.post('/saveNote', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        const { note } = req.body;
        //console.log('Speichern der Notiz:', note); // Zum Debuggen
        await pool.query(
            'UPDATE public."user" SET notiz = $1 WHERE benutzername = $2',
            [note, angemeldeterBenutzer]
        );
        res.status(200).send('Notiz erfolgreich gespeichert');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Speichern der Notiz');
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
        // Extrahiere Filterparameter aus der Query-String
        const { startOrt, zielOrt, startDatum, personen, gewicht } = req.query;

        // Grundlegende SQL-Abfrage
        let sql = 'SELECT s."searchId", s."startOrt", s."zielOrt", s."startDatum", s.personen, s.raum, s.gewicht, u.benutzername FROM public.searchs s JOIN public."user" u ON s."userId" = u."userId" WHERE 1=1';

        // Dynamisch Filterbedingungen hinzufügen, wenn Filterparameter vorhanden sind
        if (startOrt) {
            sql += ' AND s."startOrt" = $1';
        }
        if (zielOrt) {
            sql += ' AND s."zielOrt" = $2';
        }
        if (startDatum) {
            sql += ' AND s."startDatum" = $3';
        }
        if (personen) {
            sql += ' AND s.personen = $4';
        }
        if (gewicht) {
            sql += ' AND s.gewicht = $5';
        }

        // Führe die Abfrage aus
        const searchRequests = await pool.query(sql, [startOrt, zielOrt, startDatum, personen, gewicht].filter(Boolean)); // .filter(Boolean) entfernt undefined Werte

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
            'INNER JOIN public."user" u ON o."userId" = u."userId" ' +
            'WHERE o.status = \'offen\''
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
            'INNER JOIN public."user" u ON o."userId" = u."userId" WHERE 1=1 AND o.status = \'offen\'';
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

app.get('/getPastOffers', async (req, res) => {
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
                [userId, 'Fertig']
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
                'WHERE b."userId" = $1 AND o."status" = $2',
                [userId, 'offen']
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


app.get('/getPastBookings', async (req, res) => {
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
                'WHERE b."userId" = $1 AND o."status" = $2',
                [userId, 'Fertig']
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



app.get('/getBookingDetails', async (req, res) => {
    const { bookingId } = req.query;

    try {
        const bookingDetails = await pool.query(
            `SELECT b.*, o."startOrt", o."zielOrt", o."startZeit", u."benutzername", u."userId" 
FROM public.booking b 
JOIN public.offers o ON b."offerId" = o."offerId" 
JOIN public."user" u ON o."userId" = u."userId"
WHERE b."bookingId" = $1;`,
            [bookingId]
        );

        if (bookingDetails.rows.length > 0) {
            res.json(bookingDetails.rows[0]);
        } else {
            res.status(404).send('Buchung nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler beim Abrufen der Buchungsdetails');
    }
});


app.delete('/cancelBooking', async (req, res) => {
    const { bookingId } = req.query;

    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        await pool.query(
            'DELETE FROM public.booking WHERE "bookingId" = $1',
            [bookingId]
        );
        res.status(200).send('Buchung erfolgreich storniert');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Stornieren der Buchung');
    }
});

app.get('/getBookingsForOffer', async (req, res) => {
    const { offerId } = req.query;

    try {
        const bookings = await pool.query(
            'SELECT b.*, u.benutzername FROM public.booking b ' +
            'JOIN public."user" u ON b."userId" = u."userId" ' +
            'WHERE b."offerId" = $1',
            [offerId]
        );

        res.json(bookings.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});




app.get('/getUserProfile', async (req, res) => {
    const { username } = req.query;

    try {
        const userProfile = await pool.query(
            'SELECT vorname, nachname, email, handynummer, tag, monat, jahr, bewertung, benutzername, geld, attribute, notiz FROM public."user" WHERE benutzername = $1',
            [username]
        );

        if (userProfile.rows.length > 0) {
            const user = userProfile.rows[0];
            const formattedUser = {
                vorname: user.vorname,
                nachname: user.nachname,
                email: user.email,
                handynummer: user.handynummer,
                geburtsdatum: `${user.tag}.${user.monat}.${user.jahr}`,
                bewertung: user.bewertung,
                benutzername: user.benutzername,
                geld: user.geld,
                attribute: user.attribute,
                notiz : user.notiz
            };
            res.json(formattedUser);
        } else {
            res.status(404).send('Benutzerprofil nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});




//Bilder anzeigen
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // Beschränkt die Größe auf 5 MB

app.post('/uploadProfileImage', upload.single('profileImage'), async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        if (!req.file) {
            throw new Error('Kein Bild hochgeladen');
        }

        const image = req.file.buffer;
        await pool.query(
            'UPDATE public."user" SET bild = $1 WHERE benutzername = $2',
            [image, angemeldeterBenutzer]
        );

        res.send('Profilbild erfolgreich hochgeladen');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Hochladen des Profilbildes');
    }
});


app.get('/getProfileImage', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        const result = await pool.query(
            'SELECT bild FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (result.rows.length > 0 && result.rows[0].bild) {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': result.rows[0].bild.length
            });
            res.end(result.rows[0].bild);
        } else {
            res.status(404).send('Bild nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});


app.get('/getExternProfileImage', async (req, res) => {
    const { username } = req.query;

    try {
        const result = await pool.query(
            'SELECT bild FROM public."user" WHERE benutzername = $1',
            [username]
        );

        if (result.rows.length > 0 && result.rows[0].bild) {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': result.rows[0].bild.length
            });
            res.end(result.rows[0].bild);
        } else {
            res.status(404).send('Bild nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});



app.get('/getSearchDetails', async (req, res) => {
    const { searchId } = req.query;

    try {
        const searchDetails = await pool.query(
            `SELECT s.*, u.benutzername 
             FROM public.searchs s
             JOIN public."user" u ON s."userId" = u."userId" 
             WHERE s."searchId" = $1`,
            [searchId]
        );

        if (searchDetails.rows.length > 0) {
            res.json(searchDetails.rows[0]);
        } else {
            res.status(404).send('Suchanfrage nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});

app.post('/submitSearchOffer', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { searchId, price } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].userId;

            await pool.query(
                'INSERT INTO public.searchoffer ("searchOfferUserId", "searchsId", datum, preis, status) VALUES ($1, $2, $3, $4, $5)',
                [userId, searchId, new Date().toISOString().slice(0, 10), price, 'offen']
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


app.get('/getCurrentSearchRequests', async (req, res) => {
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

            const searchRequests = await pool.query(
                'SELECT * FROM public.searchs WHERE "userId" = $1 AND status = $2',
                [userId, 'offen'] // oder den Status, den Sie verwenden, um aktive Suchanfragen zu identifizieren
            );

            res.json(searchRequests.rows);
        } else {
            res.status(404).send('Benutzerkonto nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Abrufen der aktuellen Suchanfragen');
    }
});



// Beispielroute für das Abrufen von Details einer Suchanfrage
app.get('/getSearchDetails', async (req, res) => {
    const { searchId } = req.query;

    try {
        const searchDetails = await pool.query(
            'SELECT * FROM public.searchs WHERE "searchId" = $1',
            [searchId]
        );
        if (searchDetails.rows.length > 0) {
            res.json(searchDetails.rows[0]);
        } else {
            res.status(404).send('Suchanfrage nicht gefunden');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Abrufen der Suchanfragedetails');
    }
});

app.get('/getOffersForSearch', async (req, res) => {
    const { searchId } = req.query;

    try {
        const offers = await pool.query(
            'SELECT so.*, u.benutzername FROM public.searchoffer so JOIN public."user" u ON so."searchOfferUserId" = u."userId" WHERE so."searchsId" = $1 AND so."status" != $2',
            [searchId, 'Abgelehnt']
        );
        res.json(offers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Abrufen der Angebote für die Suchanfrage');
    }
});




app.use(express.urlencoded({ extended: true })); // Für das Parsen von URL-kodierten Daten

app.post('/sendMessage', async (req, res) => {
    const { receiverUsername, messageText } = req.body;
    const senderUsername = angemeldeterBenutzer; // Angenommen, diese Variable hält den Benutzernamen des angemeldeten Benutzers

    try {
        // Ermittle die userId des Senders basierend auf dem angemeldeten Benutzer
        const senderResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [senderUsername]
        );
        if (senderResult.rows.length === 0) throw new Error('Sender nicht gefunden');
        const senderId = senderResult.rows[0].userId;

        // Ermittle die userId des Empfängers
        const receiverResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [receiverUsername]
        );
        if (receiverResult.rows.length === 0) throw new Error('Empfänger nicht gefunden');
        const receiverId = receiverResult.rows[0].userId;

        // Aktuelle Zeit für die Nachricht
        const zeit = new Date().toISOString();

        // Füge die Nachricht in die Datenbank ein
        await pool.query(
            'INSERT INTO public.chat (sender, receiver, text, zeit) VALUES ($1, $2, $3, $4)',
            [senderId, receiverId, messageText, zeit]
        );
        res.status(200).send('Nachricht erfolgreich gesendet');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Senden der Nachricht');
    }
});




app.get('/getChatUsers', async (req, res) => {
    try {
        // Zuerst die userId des angemeldeten Benutzers ermitteln
        const userResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );
        if (userResult.rows.length === 0) throw new Error('Benutzer nicht gefunden');
        const userId = userResult.rows[0].userId;

        // Ermittle alle Chatpartner
        const partnersResult = await pool.query(`
            SELECT DISTINCT u."userId", u.benutzername
            FROM public.chat c
            JOIN public."user" u ON u."userId" = c.sender OR u."userId" = c.receiver
            WHERE (c.sender = $1 OR c.receiver = $1) AND u."userId" != $1
            ORDER BY u.benutzername;
        `, [userId]);

        res.json(partnersResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Serverfehler beim Abrufen der Chat-Partner');
    }
});


app.get('/getMessages/:partnerUserId', async (req, res) => {
    const { partnerUserId } = req.params;
    // Zuerst die userId des angemeldeten Benutzers ermitteln
    const userResult = await pool.query(
        'SELECT "userId" FROM public."user" WHERE benutzername = $1',
        [angemeldeterBenutzer]
    );
    if (userResult.rows.length === 0) throw new Error('Benutzer nicht gefunden');
    const userId = userResult.rows[0].userId;
    try {
        const messages = await pool.query(
            `SELECT chat.*, u1.benutzername AS senderName, u2.benutzername AS receiverName
            FROM public.chat
            JOIN public."user" u1 ON chat.sender = u1."userId"
            JOIN public."user" u2 ON chat.receiver = u2."userId"
            WHERE (chat.sender = $1 AND chat.receiver = $2) OR (chat.sender = $2 AND chat.receiver = $1)
            ORDER BY chat.zeit ASC`, [userId, partnerUserId]
        );
        res.json(messages.rows.map(msg => ({
            ...msg,
            isSender: msg.sender === userId
        })));
    } catch (err) {
        console.error(err);
        res.status(500).send('Fehler beim Abrufen der Nachrichten');
    }
});


app.post('/sendmessageChat', async (req, res) => {
    const { receiverUserId, messageText } = req.body;
    const senderUsername = angemeldeterBenutzer; // Oder wie auch immer du den angemeldeten Benutzer ermittelst

    try {
        // Ermittle die userId des Senders basierend auf dem angemeldeten Benutzer
        const senderResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [senderUsername]
        );
        if (senderResult.rows.length === 0) throw new Error('Sender nicht gefunden');
        const senderId = senderResult.rows[0].userId;

        const receiverId = receiverUserId

        // Aktuelle Zeit für die Nachricht
        const zeit = new Date().toISOString();

        // Füge die Nachricht in die Datenbank ein
        await pool.query(
            'INSERT INTO public.chat (sender, receiver, text, zeit) VALUES ($1, $2, $3, $4)',
            [senderId, receiverId, messageText, zeit]
        );
        res.status(200).send('Nachricht erfolgreich gesendet');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Senden der Nachricht');
    }
});

app.post('/sendMessageUsingUsername', async (req, res) => {
    const { receiverUsername, messageText } = req.body;
    const senderUsername = angemeldeterBenutzer; // Angenommen, diese Variable hält den Benutzernamen des angemeldeten Benutzers
    console.log('Empfangener receiverUsername:', receiverUsername); // Hinzugefügt für Debugging-Zwecke
    console.log('Empfangener messageText:', messageText); // Hinzugefügt für Debugging-Zwecke

    try {
        // Ermittle die userId des Senders
        const senderResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [senderUsername]
        );
        if (senderResult.rows.length === 0) throw new Error('Sender nicht gefunden');
        const senderId = senderResult.rows[0].userId;

        // Ermittle die userId des Empfängers
        const receiverResult = await pool.query(
            'SELECT "userId" FROM public."user" WHERE benutzername = $1',
            [receiverUsername]
        );
        if (receiverResult.rows.length === 0) throw new Error('Empfänger nicht gefunden');
        const receiverId = receiverResult.rows[0].userId;
        const zeit = new Date().toISOString();
        // Füge die Nachricht in die Datenbank ein
        await pool.query(
            'INSERT INTO public.chat (sender, receiver, text, zeit) VALUES ($1, $2, $3, $4)',
            [senderId, receiverId, messageText, zeit]
        );

        res.status(200).send('Nachricht erfolgreich gesendet');
    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
        res.status(500).send('Fehler beim Senden der Nachricht');
    }
});


app.post('/endOffer', async (req, res) => {
    const { offerId } = req.query; // Angebot-ID aus der Query-Parameter erhalten
    const status = "Fertig"; // Neuer Status

    try {
        // Aktualisiere den Status des Angebots in der Datenbank
        await pool.query(
            'UPDATE public.offers SET status = $1 WHERE "offerId" = $2',
            [status, offerId]
        );

        res.status(200).send('Fahrt erfolgreich beendet.');
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Angebotsstatus:', error);
        res.status(500).send('Fehler beim Beenden der Fahrt.');
    }
});

app.post('/submitRating', async (req, res) => {
    const { komplett, punktlich, abmachung, fracht, mood, bookingid } = req.body;

    try {
        // Zuerst die offerId basierend auf bookingId abrufen
        const offerRes = await pool.query('SELECT "offerId" FROM public.booking WHERE "bookingId" = $1', [bookingid]);
        if (offerRes.rows.length === 0) {
            return res.status(404).send('Buchung nicht gefunden.');
        }
        const offerId = offerRes.rows[0].offerId;

        // Dann die fahrerid (Fahrer-ID) basierend auf offerId abrufen
        const userRes = await pool.query('SELECT "userId" FROM public.offers WHERE "offerId" = $1', [offerId]);
        if (userRes.rows.length === 0) {
            return res.status(404).send('Angebot nicht gefunden.');
        }
        const fahrerId = userRes.rows[0].userId;

        // Jetzt die Bewertung mit der Fahrer-ID in die Tabelle bewertungfahrer einfügen
        await pool.query(
            'INSERT INTO public.bewertungfahrer (komplett, punktlich, abmachung, fracht, mood, fahrerid) VALUES ($1, $2, $3, $4, $5, $6)',
            [komplett, punktlich, abmachung, fracht, mood, fahrerId]
        );

        res.status(200).send('Bewertung erfolgreich abgegeben.');
    } catch (error) {
        console.error('Fehler beim Speichern der Bewertung:', error);
        res.status(500).send('Fehler beim Speichern der Bewertung');
    }
});


app.use(express.json()); // Fügt die Fähigkeit hinzu, JSON zu parsen
app.post('/submitMitfahrerRating', async (req, res) => {
    const { komplett, punktlich, mood, abmachung, benutzername } = req.body;

    try {
        // Ermittle die userId basierend auf dem Benutzernamen
        const userRes = await pool.query('SELECT "userId" FROM public."user" WHERE benutzername = $1', [benutzername]);
        if (userRes.rows.length === 0) {
            return res.status(404).send('Benutzer nicht gefunden.');
        }
        const mitfahrerId = userRes.rows[0].userId;

        await pool.query(
            'INSERT INTO public.bewertungmitfahrer (komplett, punktlich, mood, abmachung, mitfahrerid) VALUES ($1, $2, $3, $4, $5)',
            [komplett, punktlich, mood, abmachung, mitfahrerId]
        );

        res.status(200).send('Bewertung erfolgreich abgegeben.');
    } catch (error) {
        console.error('Fehler beim Speichern der Bewertung:', error);
        res.status(500).send('Fehler beim Speichern der Bewertung');
    }
});


app.get('/getAverageMitfahrerRatings', async (req, res) => {
    const { benutzername } = req.query;
    


    try {
        const userRes = await pool.query('SELECT "userId" FROM public."user" WHERE benutzername = $1', [benutzername]);
        if (userRes.rows.length === 0) {
            return res.status(404).send('Benutzer nicht gefunden.');
        }
        const mitfahrerId = userRes.rows[0].userId;

        const ratingsRes = await pool.query(`
            SELECT 
                AVG(komplett) AS komplett, 
                AVG(punktlich) AS punktlich, 
                AVG(mood) AS mood, 
                AVG(abmachung) AS abmachung 
            FROM public.bewertungmitfahrer 
            WHERE mitfahrerid = $1`, [mitfahrerId]);
        

        res.json(ratingsRes.rows[0]);
    } catch (error) {
        console.error('Fehler beim Abrufen der Durchschnittsbewertungen:', error);
        res.status(500).send('Serverfehler');
    }
});

app.get('/getAverageFahrerRatings', async (req, res) => {
    const { benutzername } = req.query;

    try {
        // Benutzer-ID basierend auf dem Benutzernamen abrufen
        const userRes = await pool.query('SELECT "userId" FROM public."user" WHERE benutzername = $1', [benutzername]);
        if (userRes.rows.length === 0) {
            return res.status(404).send('Benutzer nicht gefunden.');
        }
        const fahrerId = userRes.rows[0].userId;

        // Durchschnittsbewertungen für den Fahrer abrufen
        const ratingsRes = await pool.query(`
            SELECT 
                AVG(komplett) AS komplett, 
                AVG(fracht) AS fracht, 
                AVG(punktlich) AS punktlich, 
                AVG(mood) AS mood, 
                AVG(abmachung) AS abmachung 
            FROM public.bewertungfahrer 
            WHERE fahrerid = $1`, [fahrerId]);

        if (ratingsRes.rows.length > 0) {
            res.json(ratingsRes.rows[0]);
        } else {
            res.json({ komplett: 0, punktlich: 0, mood: 0, abmachung: 0, fracht: 0 }); // Standardwerte, falls keine Bewertungen vorhanden sind
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Durchschnittsbewertungen als Fahrer:', error);
        res.status(500).send('Serverfehler');
    }
});

app.post('/updateUserAttributes', async (req, res) => {
    const { attributes } = req.body;
    const userResult = await pool.query(
        'SELECT "userId" FROM public."user" WHERE benutzername = $1',
        [angemeldeterBenutzer]
    );
    if (userResult.rows.length === 0) throw new Error('Benutzer nicht gefunden');
    const userId = userResult.rows[0].userId;

try {
    await pool.query(
        `UPDATE public."user" SET attribute = $1 WHERE "userId" = $2`,
        [attributes, userId]
    );
    res.send('Eigenschaften erfolgreich aktualisiert');
} catch (error) {
    console.error('Fehler beim Aktualisieren der Eigenschaften:', error);
    res.status(500).send('Serverfehler beim Aktualisieren der Eigenschaften');
}
});

app.post('/updateUserProfile', async (req, res) => {
    const { vorname, nachname, email, handynummer } = req.body;
    // Angenommen, du hast eine Benutzer-ID aus der Session oder einem Token
    const userResult = await pool.query(
        'SELECT "userId" FROM public."user" WHERE benutzername = $1',
        [angemeldeterBenutzer]
    );
    if (userResult.rows.length === 0) throw new Error('Benutzer nicht gefunden');
    const userId = userResult.rows[0].userId;

    try {
        // Datenbank-Update-Operation
        await pool.query(
            `UPDATE public."user" SET vorname = $1, nachname = $2, email = $3, handynummer = $4 WHERE "userId" = $5`,
            [vorname, nachname, email, handynummer, userId]
        );
        res.send('Profil erfolgreich aktualisiert');
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Profils:', error);
        res.status(500).send('Serverfehler');
    }
});


app.post('/withdrawMoney', async (req, res) => {
    const { withdrawAmount } = req.body; // Der Auszahlungsbetrag, der vom Formular gesendet wird

    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    try {
        // Hole die Nutzer-ID und das aktuelle Guthaben
        const userResult = await pool.query(
            'SELECT "userId", geld FROM public."user" WHERE benutzername = $1',
            [angemeldeterBenutzer]
        );

        if (userResult.rows.length > 0) {
            const { userId, geld } = userResult.rows[0];
            const newBalance = Math.max(0, geld - withdrawAmount); // Stelle sicher, dass das neue Guthaben nicht unter 0 fällt

            // Aktualisiere das Guthaben des Nutzers
            await pool.query(
                'UPDATE public."user" SET geld = $1 WHERE "userId" = $2',
                [newBalance, userId]
            );

            res.send('Guthaben erfolgreich aktualisiert');
        } else {
            res.status(404).send('Nutzer nicht gefunden');
        }
    } catch (err) {
        console.error('Fehler:', err);
        res.status(500).send('Serverfehler');
    }
});


app.put('/updateVehicle/:carId', async (req, res) => {
    if (!angemeldeterBenutzer) {
        return res.status(401).send('Bitte zuerst anmelden');
    }

    const { carId } = req.params;
    const { brand, modell, color, consumption, seats, doors, trunkspace, gewicht, sonder } = req.body;

    try {
        await pool.query(
            'UPDATE public.car SET marke = $1, modell = $2, farbe = $3, verbrauch = $4, sitze = $5, tueren = $6, stauraum = $7, maxgewicht = $8, sonderfunktion = $9 WHERE "carId" = $10',
            [brand, modell, color, consumption, seats, doors, trunkspace, gewicht, sonder, carId]
        );

        res.send('Fahrzeugdaten erfolgreich aktualisiert');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Fehler beim Aktualisieren des Fahrzeugs');
    }
});


app.post('/updateOfferStatus', async (req, res) => {
    const { searchofferId, status } = req.body;
    try {
        // Akzeptiere das Angebot und setze alle anderen auf "Abgelehnt"
        if(status === 'Akzeptiert') {
            // Finde die zugehörige Suchanfrage-ID
            const search = await pool.query('SELECT "searchsId" FROM public.searchoffer WHERE "searchofferId" = $1', [searchofferId]);
            const searchId = search.rows[0].searchsId;

            // Setze alle Angebote auf "Abgelehnt"
            await pool.query('UPDATE public.searchoffer SET status = \'Abgelehnt\' WHERE "searchsId" = $1', [searchId]);

            // Setze das ausgewählte Angebot auf "Akzeptiert"
            await pool.query('UPDATE public.searchoffer SET status = $2 WHERE "searchofferId" = $1', [searchofferId, status]);
        } else if(status === 'Abgelehnt') {
            // Setze das ausgewählte Angebot auf "Abgelehnt"
            await pool.query('UPDATE public.searchoffer SET status = $2 WHERE "searchofferId" = $1', [searchofferId, status]);
        }
        res.json({success: true});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});




// Server starten
app.listen(port, '0.0.0.0', () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});