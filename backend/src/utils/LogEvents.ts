import {Event} from '../models/index.ts'
import type { Request, Response } from 'express';

export default async function LogEvent(eventName: string, data: string){
  const eventData = {event_name: eventName, data: data};
  await Event.create(eventData);
}

export async function getActivities(req: Request, res: Response){
  try{  
    const limit: number = 5;
    const activities = await Event.findAll({
      order: [['created_at', 'DESC']],
      limit,
    });
    res.json({
      success: true,
      data: activities
    });
  } catch(error){
    console.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
  }
}
