import { Sequelize } from 'sequelize';
import {DB_NAME,DB_USERNAME,DB_PASSWORD,DB_HOST,DB_CONNECTION} from './config.js';

export const sequelize = new Sequelize(
    DB_NAME,
    DB_USERNAME,
    DB_PASSWORD,
    {
        host: DB_HOST,
        dialect: DB_CONNECTION
    }
);