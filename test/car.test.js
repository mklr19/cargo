const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cargo',
  password: 'postgres',
  port: 5433,
});

describe('INSERT INTO car', () => {
  let insertedCarId;

  beforeEach(async () => {
    const newCar = {
      carId: 5,
      marke: 'Audi',
      modell: 'A6',
      sitze: 5,
      stauraum: 500,
      maxgewicht: 2000,
      verbrauch: 8,
      tueren: 4,
      farbe: 'schwarz',
      userId: 1,
      sonderfunktion: 'Navigationssystem',
    };

    const insertQuery = `
      INSERT INTO public.car ("carId", marke, modell, sitze, stauraum, maxgewicht, verbrauch, tueren, farbe, "userId", sonderfunktion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING "carId"
    `;

    const { rows } = await pool.query(insertQuery, [
      newCar.carId,
      newCar.marke,
      newCar.modell,
      newCar.sitze,
      newCar.stauraum,
      newCar.maxgewicht,
      newCar.verbrauch,
      newCar.tueren,
      newCar.farbe,
      newCar.userId,
      newCar.sonderfunktion,
    ]);

    insertedCarId = rows[0].carId;
  });

  afterEach(async () => {
    const deleteQuery = `
      DELETE FROM public.car
      WHERE "carId" = $1
    `;

    await pool.query(deleteQuery, [insertedCarId]);
  });

  it('should insert a new car into the database', async () => {
    const expectedCar = {
      carId: 5,
      marke: 'Audi',
      modell: 'A6',
      sitze: 5,
      stauraum: 500,
      maxgewicht: 2000,
      verbrauch: 8,
      tueren: 4,
      farbe: 'schwarz',
      userId: 1,
      sonderfunktion: 'Navigationssystem',
    };

    const { rows } = await pool.query(`
      SELECT * FROM public.car WHERE "carId" = $1
    `, [insertedCarId]);

    expect(rows[0].carId).toBe(expectedCar.carId);
    expect(rows[0].marke).toBe(expectedCar.marke);
  });

  it('should update an existing car in the database', async () => {
    const updatedCarData = {
      carId: insertedCarId,
      marke: 'Volkswagen',
      modell: 'Golf',
      sitze: 5,
      stauraum: 400,
      maxgewicht: 1800,
      verbrauch: 7,
      tueren: 5,
      farbe: 'blau',
      userId: 1,
      sonderfunktion: 'Klimaanlage',
    };

    const updateQuery = `
      UPDATE public.car
      SET marke = $2, modell = $3, sitze = $4, stauraum = $5, maxgewicht = $6,
          verbrauch = $7, tueren = $8, farbe = $9, "userId" = $10, sonderfunktion = $11
      WHERE "carId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
      updatedCarData.carId,
      updatedCarData.marke,
      updatedCarData.modell,
      updatedCarData.sitze,
      updatedCarData.stauraum,
      updatedCarData.maxgewicht,
      updatedCarData.verbrauch,
      updatedCarData.tueren,
      updatedCarData.farbe,
      updatedCarData.userId,
      updatedCarData.sonderfunktion,
    ]);

    expect(rows[0].carId).toBe(updatedCarData.carId);
    expect(rows[0].marke).toBe(updatedCarData.marke);
  });

  it('should delete a car from the database', async () => {
    const deleteQuery = `
      DELETE FROM public.car
      WHERE "carId" = $1
      RETURNING *
    `;

    const { rows } = await pool.query(deleteQuery, [insertedCarId]);

    expect(rows[0].carId).toBe(insertedCarId);
  });

  afterAll(async () => {
    await pool.end();
  });
});
