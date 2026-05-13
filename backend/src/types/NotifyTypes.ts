
const notify = ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const; 

export type NotifiesType = (typeof notify)[number];

export interface Notifiers {
  [notify_type: string]: NotifiesType
}

export const isNotify = (x: any): x is NotifiesType => notify.includes(x);

