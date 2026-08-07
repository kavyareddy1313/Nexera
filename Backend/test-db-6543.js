import { Sequelize } from 'sequelize';

const url = 'postgresql://postgres.bullzggohfthvhelxkog:Kill$8885604939@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sequelize = new Sequelize(url, { dialect: 'postgres' });

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
