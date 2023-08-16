import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole } from "../../utils/express.js";

const userRouter = Router()

userRouter.get("/login", callController(controller.login))

export default userRouter