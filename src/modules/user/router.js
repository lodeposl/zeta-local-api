import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole } from "../../utils/express.js";

const userRouter = Router()

userRouter.post("/login", callController(controller.login))
userRouter.post("/passwordChange", isAuth, callController(controller.passwordChange))
userRouter.post("/createUser", isAuth, checkRole(["admin"]), callController(controller.createUser))
userRouter.post("/deleteUser", isAuth, checkRole(["admin"]), callController(controller.deleteUser))
userRouter.post("/permissions", isAuth,checkRole(["admin"]), callController(controller.permissions))
userRouter.get("/", isAuth,checkRole(["admin"]), callController(controller.getUsersList))
userRouter.get("/permissions", isAuth,checkRole(["admin"]), callController(controller.getPermissions))



export default userRouter