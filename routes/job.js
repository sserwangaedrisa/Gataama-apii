const express = require("express");
const router = express.Router();
const jobController = require("../controllers/job");
const verifyToken = require("../middleware/auth");
const { isCountryAdmin, isAdmin } = require("../middleware/role");
router.get(
  "/", jobController.getJobs)
  router.get(
    "/main", jobController.getJobsMain)
router.get("/:id", jobController.getJobById);

router.post(
  "/",
  verifyToken,
  isCountryAdmin,
  jobController.createJob
);
router.post(
  "/main",
  verifyToken,
  isAdmin,
  jobController.createJobForMain
);

router.put(
  "/:id",
  verifyToken,
  isCountryAdmin,
  jobController.updateJob
);
router.put(
  "/main/:id",
  verifyToken,
  isAdmin,
  jobController.updateMainJob
);

router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  jobController.deleteJob
);

module.exports = router;
