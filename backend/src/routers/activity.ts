import { Router } from 'express'
import {getActivities} from '../utils/LogEvents.js'

const activityRouter = Router();
activityRouter.get('/activity/', getActivities);
export default activityRouter;