import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const productsRouter = Router()

productsRouter.get("/info/:code", callController(controller.queryCode))
productsRouter.get("/qr/:code", isAuth,  callController(controller.generateQR))
productsRouter.get("/marcas", isAuth,  callController(controller.queryMarcas))


export default productsRouter