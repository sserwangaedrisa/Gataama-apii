const express = require("express");
const router = express.Router();
const countryController = require("../controllers/country");
const verifyToken = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");

router.post("/", verifyToken, isAdmin, countryController.createCountry);
router.get("/", countryController.getAllCountries);
router.get("/:id", countryController.getCountryById);
router.put("/:id", verifyToken, isAdmin, countryController.updateCountry);
router.delete("/remove-admin/:id", verifyToken, isAdmin, countryController.removeCountryAdmin);
router.delete("/:id", verifyToken, isAdmin, countryController.deleteCountry);

module.exports = router;
