const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cargo',
  password: 'postgres',
  port: 5432,
});

describe('Search Operations', () => {
  let insertedSearchId;

  // Vor jedem Testfall: Suchanfrage einfügen
  beforeEach(async () => {
    const newSearch = {
      searchId: 1,
      userId: 1,
      startOrt: 'Berlin',
      zielOrt: 'Hamburg',
      startDatum: '2024-07-01',
      personen: 2,
      raum: 3,
      gewicht: 500,
      erstellDatum: '2024-06-30',
      status: 'active',
    };

    const insertQuery = `
      INSERT INTO public.searchs ("searchId", "userId", "startOrt", "zielOrt", "startDatum", personen, raum, gewicht, "erstellDatum", status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING "searchId"
    `;

    const { rows } = await pool.query(insertQuery, [
      newSearch.searchId,
      newSearch.userId,
      newSearch.startOrt,
      newSearch.zielOrt,
      newSearch.startDatum,
      newSearch.personen,
      newSearch.raum,
      newSearch.gewicht,
      newSearch.erstellDatum,
      newSearch.status,
    ]);

    insertedSearchId = rows[0].searchId;
  });

  afterEach(async () => {
    const deleteQuery = `
      DELETE FROM public.searchs
      WHERE "searchId" = $1
    `;

    await pool.query(deleteQuery, [insertedSearchId]);
  });

  it('should insert a new search into the database', async () => {
    const expectedSearch = {
      searchId: 1,
      userId: 1,
      startOrt: 'Berlin',
      zielOrt: 'Hamburg',
      startDatum: '2024-07-01',
      personen: '2',
      raum: '3',
      gewicht: '500',
      erstellDatum: '2024-06-30',
      status: 'active',
    };

    const { rows } = await pool.query(`
      SELECT * FROM public.searchs WHERE "searchId" = $1
    `, [insertedSearchId]);

    expect(rows[0].searchId).toBe(expectedSearch.searchId.toString());
    expect(rows[0].userId).toBe(expectedSearch.userId.toString());
    expect(rows[0].startOrt).toBe(expectedSearch.startOrt);
    expect(rows[0].zielOrt).toBe(expectedSearch.zielOrt);
    expect(rows[0].startDatum).toBe(expectedSearch.startDatum);
    expect(rows[0].personen).toBe(expectedSearch.personen);
    expect(rows[0].raum).toBe(expectedSearch.raum);
    expect(rows[0].gewicht).toBe(expectedSearch.gewicht);
    expect(rows[0].erstellDatum).toBe(expectedSearch.erstellDatum);
    expect(rows[0].status).toBe(expectedSearch.status);
  });


  afterAll(async () => {
    await pool.end();
  });
});
