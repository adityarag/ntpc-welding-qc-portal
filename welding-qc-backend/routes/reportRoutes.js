const express = require('express');
const router = express.Router();
const {
  getOfferSheetReport,
  getJointsReport,
  getRtEvaluationReport,
  getPwhtProgressReport,
  getSupervisorPerformanceReport,
  getWelderPerformanceReport,
  getJointLifecycleReport,
  getPendingWorkReport,
  getFailureAnalysisReport,
  getAreaSystemReport,
  getProductivityReport,
  getVerifierActivityReport,
  getProjectSummaryReport
} = require('../controllers/reportController');

const { verifyToken } = require('../middleware/authMiddleware');

// All report routes require a valid token
router.use(verifyToken);

// A - Offer Sheet Master Log
router.get('/offer-sheets', getOfferSheetReport);
router.get('/offers', getOfferSheetReport);

// B - Joints Master Log
router.get('/joints', getJointsReport);

// C - RT Evaluation Summary
router.get('/rt-evaluation', getRtEvaluationReport);
router.get('/rt', getRtEvaluationReport);

// D - PWHT Progress Report
router.get('/pwht-progress', getPwhtProgressReport);
router.get('/pwht', getPwhtProgressReport);

// E - Supervisor Performance
router.get('/supervisor-performance', getSupervisorPerformanceReport);

// F - Welder Performance
router.get('/welder-performance', getWelderPerformanceReport);

// G - Joint Lifecycle Tracking
router.get('/joint-lifecycle', getJointLifecycleReport);

// H - Pending Work Report
router.get('/pending-work', getPendingWorkReport);

// I - Failure Analysis
router.get('/failure-analysis', getFailureAnalysisReport);

// J - Area System Report
router.get('/area-system', getAreaSystemReport);

// K - Productivity Report (query: ?period=daily&days=30)
router.get('/productivity', getProductivityReport);

// L - Verifier Activity
router.get('/verifier-activity', getVerifierActivityReport);

// M - Final Project Summary
router.get('/project-summary', getProjectSummaryReport);

module.exports = router;
