const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cargo',
  password: 'postgres',
  port: 5433,
});

describe('User Operations', () => {
  let insertedUserId;

  beforeEach(async () => {
    const newUser = {
      userId: 1000,
      vorname: 'Max',
      nachname: 'Mustermann',
      email: 'max.mustermann@example.com',
      passwort: 'password123',
      handynummer: 123456789,
      tag: 1,
      monat: 1,
      jahr: 1990,
      bewertung: 0,
      benutzername: 'maxmuster',
      geld: 100.00,
      attribute: { premium: true },
      notiz: 'Testnotiz',
      bild: Buffer.from([0x1, 0x2, 0x3, 0x4]),
    };

    const insertQuery = `
      INSERT INTO public."user" ("userId", vorname, nachname, email, passwort, handynummer, tag, monat, jahr, bewertung, benutzername, geld, attribute, notiz, bild)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING "userId"
    `;

    const { rows } = await pool.query(insertQuery, [
      newUser.userId,
      newUser.vorname,
      newUser.nachname,
      newUser.email,
      newUser.passwort,
      newUser.handynummer,
      newUser.tag,
      newUser.monat,
      newUser.jahr,
      newUser.bewertung,
      newUser.benutzername,
      newUser.geld,
      newUser.attribute,
      newUser.notiz,
      newUser.bild,
    ]);

    insertedUserId = rows[0].userId;
  });

  afterEach(async () => {
    const deleteQuery = `
      DELETE FROM public."user"
      WHERE "userId" = $1
    `;

    await pool.query(deleteQuery, [insertedUserId]);
  });

  it('should insert a new user into the database', async () => {
    const expectedUser = {
      userId: 1000,
      vorname: 'Max',
      nachname: 'Mustermann',
      email: 'max.mustermann@example.com',
      passwort: 'password123',
      handynummer: 123456789,
      tag: 1,
      monat: 1,
      jahr: 1990,
      bewertung: 0,
      benutzername: 'maxmuster',
      geld: 100.00,
      attribute: { premium: true },
      notiz: 'Testnotiz',
      bild: Buffer.from([0x1, 0x2, 0x3, 0x4]),
    };

    const { rows } = await pool.query(`
      SELECT * FROM public."user" WHERE "userId" = $1
    `, [insertedUserId]);

    expect(rows[0].userId).toBe(expectedUser.userId);
    expect(rows[0].vorname).toBe(expectedUser.vorname);
  });

  it('should update an existing user in the database', async () => {
    const updatedUserData = {
      userId: insertedUserId,
      vorname: 'Maximilian',
      nachname: 'Mustermann',
      email: 'max.mustermann@example.com',
      passwort: 'newpassword456',
      handynummer: 987654321,
      tag: 1,
      monat: 1,
      jahr: 1990,
      bewertung: 0,
      benutzername: 'maxmuster',
      geld: 150.00,
      attribute: { premium: false },
      notiz: 'Neue Notiz',
      bild: Buffer.from([0x5, 0x6, 0x7, 0x8]),
    };

    const updateQuery = `
      UPDATE public."user"
      SET vorname = $2, nachname = $3, email = $4, passwort = $5, handynummer = $6,
          tag = $7, monat = $8, jahr = $9, bewertung = $10, benutzername = $11,
          geld = $12, attribute = $13, notiz = $14, bild = $15
      WHERE "userId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
      updatedUserData.userId,
      updatedUserData.vorname,
      updatedUserData.nachname,
      updatedUserData.email,
      updatedUserData.passwort,
      updatedUserData.handynummer,
      updatedUserData.tag,
      updatedUserData.monat,
      updatedUserData.jahr,
      updatedUserData.bewertung,
      updatedUserData.benutzername,
      updatedUserData.geld,
      updatedUserData.attribute,
      updatedUserData.notiz,
      updatedUserData.bild,
    ]);

    expect(rows[0].userId).toBe(updatedUserData.userId);
    expect(rows[0].vorname).toBe(updatedUserData.vorname);
  });

  it('should delete a user from the database', async () => {
    const deleteQuery = `
      DELETE FROM public."user"
      WHERE "userId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(deleteQuery, [insertedUserId]);

    expect(rows.length).toBe(1); 
    expect(rows[0].userId).toBe(insertedUserId); 
  });

  it('should retrieve a user from the database', async () => {
    const { rows } = await pool.query(`
      SELECT * FROM public."user" WHERE "userId" = $1
    `, [insertedUserId]);

    expect(rows.length).toBe(1); 
    expect(rows[0].userId).toBe(insertedUserId); 
  });

  it('should update password of an existing user in the database', async () => {
    const newPassword = 'newpassword456';

    const updatePasswordQuery = `
      UPDATE public."user"
      SET passwort = $2
      WHERE "userId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(updatePasswordQuery, [insertedUserId, newPassword]);

    expect(rows.length).toBe(1); 
    expect(rows[0].userId).toBe(insertedUserId); 
    expect(rows[0].passwort).toBe(newPassword); 
  });

  it('should update rating of an existing user in the database', async () => {
    const newRating = '4';

    const updateRatingQuery = `
      UPDATE public."user"
      SET bewertung = $2
      WHERE "userId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(updateRatingQuery, [insertedUserId, newRating]);

    expect(rows.length).toBe(1); 
    expect(rows[0].userId).toBe(insertedUserId); 
    expect(rows[0].bewertung).toBe(newRating);
  });

  it('should check if a user exists in the database', async () => {

    const userExistsQuery = `
      SELECT EXISTS (SELECT 1 FROM public."user" WHERE "userId" = $1)
    `;

    const { rows } = await pool.query(userExistsQuery, [insertedUserId]);

    expect(rows[0].exists).toBe(true); 
  });



  afterAll(async () => {
    await pool.end(); 
  });
});
