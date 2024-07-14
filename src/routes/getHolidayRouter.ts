import { refreshTokenMiddleware } from "../middelware/tokenMiddleware";
import {getAllForms, getLeaveById, getLeave} from "../controller/holidayController";
import { Router } from "express";


const router = Router();
router.use(refreshTokenMiddleware);

router.post('/forms',getLeave);
//router.get('/getAllForms',getAllForms);
router.get('/:id', getLeaveById);

export default router;