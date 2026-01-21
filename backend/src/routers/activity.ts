import { Router } from 'express'
import {getActivities} from '../utils/LogEvents.ts'

const activityRouter = Router();
activityRouter.get('/activity/', getActivities);
export default activityRouter;