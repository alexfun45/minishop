import type {Optional} from 'sequelize';
import {DataTypes, Model} from 'sequelize'
import sequelize from '../config/database.ts';

interface EventAttribute{
  id: number;
  data: string;
  event_name: string;
  created_at: string;
}

interface EventCreationAttribute extends Optional<EventAttribute,
 'id' | 'created_at'>{}

class Event extends Model<EventAttribute, EventCreationAttribute> implements EventAttribute{
  declare id: number;
  declare data: string;
  declare event_name: string;
  declare created_at: string;
}

Event.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data: {
    type: DataTypes.STRING(256),
    allowNull: false,
  },
  event_name:{
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true
  }
 }, 
 {sequelize,
   tableName: 'events',
   timestamps: true,
   underscored: true});
 
export {Event}

