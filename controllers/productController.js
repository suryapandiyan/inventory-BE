const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");

// cloudinary config
const {
  CLOUD_NAME,
  CLOUD_API_KEY,
  CLOUD_API_SECRET,
  JWT_SECRET,
} = require("../utils/config");

cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
  secure: true,
});

//getting token

const getTokenFrom = (req) => {
  const authorization = req.get("authorization");

  if (authorization && authorization.startsWith("bearer ")) {
    return authorization.replace("bearer ", "");
  }
};

// Create Prouct
const createProduct = async (req, res) => {
  try {
    //verify user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    //getting data from FE

    const { name, itemCode, category, quantity, price, description } = req.body;

    //   Validation
    if (!name || !category || !quantity || !price || !description) {
      return res.status(401).json({ message: "Please fill all fields" });
    }

    // Handle Image upload
    let fileData = {};

    if (req.file) {
      // Save image to cloudinary
      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {
          folder: "inventoryApp",
          resource_type: "image",
        });
      } catch (error) {
        res.status(500);
        throw new Error("Image could not be uploaded");
      }

      fileData = {
        fileName: req.file.originalname,
        filePath: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2),
      };
    }

    // Create Product
    const product = await Product.create({
      user: decodedToken.id,
      name,
      itemCode,
      category,
      quantity,
      price,
      description,
      image: fileData,
    });

    //sending response data to FE

    res.status(201).json({ message: "Item added Successfully" });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get all Products
const getProducts = async (req, res) => {
  try {
    //verify user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    const products = await Product.find({ user: decodedToken.id }).sort(
      "-createdAt"
    );

    //sending response data to FE

    res.status(200).json(products);
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    //verify user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "not authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    const product = await Product.findById(req.params.id);

    //sending response data to FE

    res.status(200).json(product);
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    //verfiy user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    const product = await Product.findById(req.params.id);

    // if product doesnt exist
    if (!product) {
      return res.status(401).json({ message: "Product not found" });
    }

    await product.remove();

    const updatedProductList = await Product.find({ user: decodedToken.id });

    //sending response data to FE

    res.status(200).json({ updatedProductList });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    //verify user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    const { name, category, quantity, price, description } = req.body;

    const { id } = req.params;

    const product = await Product.findById(id);

    // if product doesnt exist
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    // Match product to its user
    if (product.user.toString() !== decodedToken.id) {
      return res.status(401).json({ message: "User not Authorized" });
    }

    // Handle Image upload
    let fileData = {};

    if (req.file) {
      // Save image to cloudinary
      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {
          folder: "inventoryApp",
          resource_type: "image",
        });
      } catch (error) {
        res.status(500);
        throw new Error("Image could not be uploaded");
      }

      fileData = {
        fileName: req.file.originalname,
        filePath: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2),
      };
    }

    // Update Product
    await Product.findByIdAndUpdate(
      { _id: id },
      {
        name,
        category,
        quantity,
        price,
        description,
        image: Object.keys(fileData).length === 0 ? product?.image : fileData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    //sending response data to FE

    res.status(200).json("Item updated Successfully");
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};