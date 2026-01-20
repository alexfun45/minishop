import {Event} from '../models/index.ts'

export default async function LogEvent(eventName: string, data: string){
  const eventData = {event_name: eventName, data: data};
  await Event.create(eventData);
}
