const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cargo',
  password: 'postgres',
  port: 5432,
});

describe('Booking Operations', () => {
  let insertedBookingId;

  beforeEach(async () => {
    const newBooking = {
      bookingId: 1,
      offerId: 17, 
      userId: 1,
      personen: 2,
      raum: 3,
      gewicht: 500,
      buchungsdatum: '2024-07-01',
      preis: 50.00,
    };

    const insertQuery = `
      INSERT INTO public.booking ("bookingId", "offerId", "userId", personen, raum, gewicht, buchungsdatum, preis)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "bookingId"
    `;

    const { rows } = await pool.query(insertQuery, [
      newBooking.bookingId,
      newBooking.offerId,
      newBooking.userId,
      newBooking.personen,
      newBooking.raum,
      newBooking.gewicht,
      newBooking.buchungsdatum,
      newBooking.preis,
    ]);

    insertedBookingId = rows[0].bookingId;
  });

  afterEach(async () => {
    const deleteQuery = `
      DELETE FROM public.booking
      WHERE "bookingId" = $1
    `;

    await pool.query(deleteQuery, [insertedBookingId]);
  });

  it('should insert a new booking into the database', async () => {
    const expectedBooking = {
      bookingId: 1,
      offerId: 17,
      userId: 1,
      personen: 2,
      raum: 3,
      gewicht: 500,
      buchungsdatum: '2024-07-01',
      preis: 50.00,
    };

    const { rows } = await pool.query(`
      SELECT * FROM public.booking WHERE "bookingId" = $1
    `, [insertedBookingId]);

    expect(rows[0].bookingId.toString()).toEqual(expectedBooking.bookingId.toString());
    expect(rows[0].offerId).toBe(expectedBooking.offerId.toString());
  });


  afterAll(async () => {
    await pool.end();
  });
});
