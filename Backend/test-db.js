import { Sequelize } from 'sequelize';

const url = 'postgresql://postgres:Kill$8885604939@db.bullzggohfthvhelxkog.supabase.co:5432/postgres';
const sequelize = new Sequelize(url, {
  dialect: 'postgres',
});

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  } finally {
    await sequelize.close();
  }
}
test();
