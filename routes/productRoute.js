//router config

const productRouter = require("express").Router();

// getting controllers for product

const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");

// file upload config for multer

const { upload } = require("../utils/fileUpload");

/*****************create new product*******************/

productRouter.post("/api/products", upload.single("image"), createProduct);

/*******************update product*********************/

productRouter.patch("/api/products/:id", upload.single("image"), updateProduct);

/*****************get all product**********************/

productRouter.get("/api/products", getProducts);

/*****************get single product*******************/

productRouter.get("/api/products/:id", getProduct);

/******************delete product**********************/

productRouter.delete("/api/products/:id", deleteProduct);

module.exports = productRouter;