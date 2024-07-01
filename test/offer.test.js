const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cargo',
  password: 'postgres',
  port: 5433,
});

describe('Offers Operations', () => {
  let insertedOfferId;

  beforeEach(async () => {
    const newOffer = {
      offerId: 1,
      userId: 1,
      carId: 18,
      startOrt: 'Startort',
      zielOrt: 'Zielort',
      startZeit: '2024-07-01 08:00:00',
      sitze: 4,
      stauraum: 500,
      preisperson: 25.00,
      status: 'aktiv',
      erstellungsDatum: '2024-06-30',
      maxgewicht: 1000,
      preisraum: 50.00,
      preisgewicht: 0.10,
    };

    const insertQuery = `
      INSERT INTO public.offers ("offerId", "userId", "carId", "startOrt", "zielOrt", "startZeit", sitze, stauraum, preisperson, status, "erstellungsDatum", maxgewicht, preisraum, preisgewicht)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING "offerId"
    `;

    const { rows } = await pool.query(insertQuery, [
      newOffer.offerId,
      newOffer.userId,
      newOffer.carId,
      newOffer.startOrt,
      newOffer.zielOrt,
      newOffer.startZeit,
      newOffer.sitze,
      newOffer.stauraum,
      newOffer.preisperson,
      newOffer.status,
      newOffer.erstellungsDatum,
      newOffer.maxgewicht,
      newOffer.preisraum,
      newOffer.preisgewicht,
    ]);

    insertedOfferId = rows[0].offerId;
  });

  afterEach(async () => {
    const deleteQuery = `
      DELETE FROM public.offers
      WHERE "offerId" = $1
    `;

    await pool.query(deleteQuery, [insertedOfferId]);
  });

  it('should insert a new offer into the database', async () => {
    const expectedOffer = {
      offerId: 1,
      userId: 1,
      carId: 18,
      startOrt: 'Startort',
      zielOrt: 'Zielort',
      startZeit: '2024-07-01 08:00:00',
      sitze: 4,
      stauraum: 500,
      preisperson: 25.00,
      status: 'aktiv',
      erstellungsDatum: '2024-06-30',
      maxgewicht: 1000,
      preisraum: 50.00,
      preisgewicht: 0.10,
    };

    const { rows } = await pool.query(`
      SELECT * FROM public.offers WHERE "offerId" = $1
    `, [insertedOfferId]);

    expect(rows[0].offerId).toBe(expectedOffer.offerId.toString());
    expect(rows[0].userId).toBe(expectedOffer.userId.toString());
  });

  it('should retrieve an offer from the database', async () => {
    const { rows } = await pool.query(`
      SELECT * FROM public.offers WHERE "offerId" = $1
    `, [insertedOfferId]);

    expect(rows.length).toBe(1); 
  });

  it('should delete an offer from the database', async () => {
    const deleteQuery = `
      DELETE FROM public.offers
      WHERE "offerId" = $1
    `;

    await pool.query(deleteQuery, [insertedOfferId]);

    const { rows } = await pool.query(`
      SELECT * FROM public.offers WHERE "offerId" = $1
    `, [insertedOfferId]);

    expect(rows.length).toBe(0); 
  });

  afterAll(async () => {
    await pool.end();
  });
});
