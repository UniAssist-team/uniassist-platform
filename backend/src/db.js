import knex from "knex";
import config from "./db.config.js";

const db = knex(config);

export default db;
