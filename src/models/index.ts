import { Op, Dialect } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Sequelize } from 'sequelize-typescript';
import { Event } from './event.js';
import { TShirt } from './tshirt.js';
import { User } from './user.js';
import * as fs from 'fs/promises';

const env = process.env.NODE_ENV || 'development';
const config = {
  database: 'coolestproject',
  username: 'coolestproject',
  password: 'Se84KCCCJlnfkdfv'
};
const filename = fileURLToPath(import.meta.url);
const dir = dirname(filename)
const configOptions = {
  dialect: 'mysql' as Dialect,
  port: 3306,
};
const sequelize = new Sequelize(config.database, config.username, config.password, configOptions);

sequelize.addModels([Event, TShirt, User]);

// create default scope for current event
const currentEvent = {id:4};//await Event.findOne({ where: { eventBeginDate: { [Op.lt]: new Date() }, eventEndDate: { [Op.gt]: new Date() } } });
if(currentEvent){
  Event.addScope('defaultScope', { where: { id: currentEvent.id } });
  TShirt.addScope('defaultScope', { where: { eventId: currentEvent.id } });
  User.addScope('defaultScope', { where: { eventId: currentEvent.id } });
}

// loop over directory
const files = await fs.readdir(dir);
for (const file of files) {
  if(file === 'event.js' || file === 'index.js'){
    continue;
  }
  console.log(file)
}

export { Event, User, TShirt };
