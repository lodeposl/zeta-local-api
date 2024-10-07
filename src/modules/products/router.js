import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const productsRouter = Router()

productsRouter.get("/info/:code", callController(controller.queryCode))
productsRouter.get("/qr/:code", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))
productsRouter.get("/marcas/:includeNoStock", isAuth, checkPermissions(["imprimir-etiquetas"]),  callController(controller.queryMarcas))
productsRouter.get("/byMarca/:code/:includeNoStock", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.productsByMarca))
productsRouter.get("/bySearch/:brand/:search",  callController(controller.productsBySearch))
productsRouter.post("/print",  callController(controller.print))
productsRouter.post("/redirect",  callController(controller.redirect))



export default productsRouter