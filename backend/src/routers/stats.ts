import { Router } from 'express'
import {statsController} from '../controllers/statsController.js'

const categoryRouter = Router();

categoryRouter.use('/stats', statsController.getAdvancedStats);

export default categoryRouter;