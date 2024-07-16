import { refreshTokenMiddleware } from "../middelware/tokenMiddleware";
import {getAllHoliday, getLeaveById, getLeave} from "../controller/holidayController";
import { Router } from "express";


const router = Router();
router.use(refreshTokenMiddleware);

router.post('/forms',getLeave);
router.get('/getAllHoliday',getAllHoliday);
router.get('/:id', getLeaveById);

export default router;