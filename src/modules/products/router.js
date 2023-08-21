import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const productsRouter = Router()

productsRouter.get("/:code", callController(controller.queryCode))
productsRouter.get("/qr/:code", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))

export default productsRouter