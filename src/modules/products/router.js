import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const productsRouter = Router()

productsRouter.get("/info/:code", callController(controller.queryCode))
productsRouter.get("/qr/:code", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))
productsRouter.get("/marcas", isAuth, checkPermissions(["imprimir-etiquetas"]),  callController(controller.queryMarcas))
productsRouter.get("/byMarca/:code", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.productsByMarca))



export default productsRouter