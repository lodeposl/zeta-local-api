import { Router } from "express";
import controller from "./controller.js";
import { callController } from "../../utils/express.js";

const userRouter = Router()

userRouter.get("/:id?", callController(controller.login))

export default userRouter