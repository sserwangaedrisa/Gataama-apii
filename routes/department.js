const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/department");
const verifyToken = require("../middleware/auth");
const { isCountryAdmin } = require("../middleware/role");
const upload = require("../middleware/image-upload");
router.get(
  "/:countryId/post/:id", departmentController.getDepartmentById)
router.get("/:countryId", departmentController.getDepartmentsByCountry);
router.post(
  "/:countryId",
  verifyToken,
  isCountryAdmin,
  upload.single("image"),
  departmentController.createDepartment
);

router.put(
  "/:countryId/departments/:departmentId",
  verifyToken,
  isCountryAdmin,
  upload.single("image"),
  departmentController.updateDepartment
);
router.delete(
  "/:countryId/departments/:departmentId",
  verifyToken,
  isCountryAdmin,
  departmentController.deleteDepartment
);

module.exports = router;
