const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cargo',
  password: 'postgres',
  port: 5433,
});

describe('Search Offer Operations', () => {
  let insertedSearchOfferId;

  beforeEach(async () => {
    // Vor jedem Testfall: Eintrag für searchoffer einfügen
    const newSearchOffer = {
      searchofferId: 1,
      searchOfferUserId: 3,
      searchsId: 4,
      datum: '2024-07-01',
      preis: 50.00,
      status: 'active',
    };

    const insertQuery = `
      INSERT INTO public.searchoffer ("searchofferId", "searchOfferUserId", "searchsId", datum, preis, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "searchofferId"
    `;

    const { rows } = await pool.query(insertQuery, [
      newSearchOffer.searchofferId,
      newSearchOffer.searchOfferUserId,
      newSearchOffer.searchsId,
      newSearchOffer.datum,
      newSearchOffer.preis,
      newSearchOffer.status,
    ]);

    insertedSearchOfferId = rows[0].searchofferId;
  });

  afterEach(async () => {
    // Nach jedem Testfall: searchoffer löschen
    const deleteQuery = `
      DELETE FROM public.searchoffer
      WHERE "searchofferId" = $1
    `;

    await pool.query(deleteQuery, [insertedSearchOfferId]);
  });

  it('should insert a new search offer into the database', async () => {
    // Testfall: Überprüfung des Einfügens eines neuen Suchangebots
    const expectedSearchOffer = {
      searchofferId: 1,
      searchOfferUserId: 3,
      searchsId: 4,
      datum: '2024-07-01',
      preis: '50.00',
      status: 'active',
    };

    const { rows } = await pool.query(`
      SELECT * FROM public.searchoffer WHERE "searchofferId" = $1
    `, [insertedSearchOfferId]);

    expect(rows[0].searchofferId).toBe(expectedSearchOffer.searchofferId.toString());
    expect(rows[0].searchOfferUserId).toBe(expectedSearchOffer.searchOfferUserId.toString());
    expect(rows[0].searchsId).toBe(expectedSearchOffer.searchsId.toString());
    expect(rows[0].datum).toBe(expectedSearchOffer.datum);
    expect(rows[0].preis).toBe(expectedSearchOffer.preis);
    expect(rows[0].status).toBe(expectedSearchOffer.status);
  });

  it('should update an existing search offer in the database', async () => {
    const updatedSearchOfferData = {
      searchofferId: insertedSearchOfferId,
      searchOfferUserId: 3,
      searchsId: 4,
      datum: '2024-07-02',
      preis: '60.00',
      status: 'inactive',
    };

    const updateQuery = `
      UPDATE public.searchoffer
      SET "searchOfferUserId" = $2, "searchsId" = $3, datum = $4, preis = $5, status = $6
      WHERE "searchofferId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
      updatedSearchOfferData.searchofferId,
      updatedSearchOfferData.searchOfferUserId,
      updatedSearchOfferData.searchsId,
      updatedSearchOfferData.datum,
      updatedSearchOfferData.preis,
      updatedSearchOfferData.status,
    ]);

    expect(rows[0].searchofferId).toBe(updatedSearchOfferData.searchofferId.toString());
    expect(rows[0].datum).toBe(updatedSearchOfferData.datum);
    expect(rows[0].preis).toBe(updatedSearchOfferData.preis.toString());
    expect(rows[0].status).toBe(updatedSearchOfferData.status);
  });

  it('should delete a search offer from the database', async () => {
    const deleteQuery = `
      DELETE FROM public.searchoffer
      WHERE "searchofferId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(deleteQuery, [insertedSearchOfferId]);

    expect(rows[0].searchofferId).toBe(insertedSearchOfferId);
  });

  it('should not insert a search offer with invalid data types', async () => {
    const invalidSearchOffer = {
      searchofferId: 'invalidId', 
      searchOfferUserId: 3,
      searchsId: 4,
      datum: '2024-07-01',
      preis: 50.00,
      status: 'active',
    };

    let errorCaught = false;
    try {
      const insertQuery = `
        INSERT INTO public.searchoffer ("searchofferId", "searchOfferUserId", "searchsId", datum, preis, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "searchofferId"
      `;

      await pool.query(insertQuery, [
        invalidSearchOffer.searchofferId,
        invalidSearchOffer.searchOfferUserId,
        invalidSearchOffer.searchsId,
        invalidSearchOffer.datum,
        invalidSearchOffer.preis,
        invalidSearchOffer.status,
      ]);
    } catch (err) {
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);
  });



  afterAll(async () => {
    await pool.end();
  });
});
