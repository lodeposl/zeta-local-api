import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const ticketsRouter = Router()

ticketsRouter.get("/facturas", callController(controller.facturas))
ticketsRouter.post("/facturas", callController(controller.procesar))
export default ticketsRouter