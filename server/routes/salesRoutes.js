const express = require('express');
const {
  getDashboardData,
  getSalesAnalytics,
  getSalesData,
  getCategories
} = require('../services/sheetService');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const data = await getDashboardData({
      year: req.query.year,
      month: req.query.month,
      category: req.query.category || 'TODOS'
    });

    res.json(data);
  } catch (error) {
    console.error('[sales/dashboard]', error);
    res.status(500).json({
      message: 'Could not load dashboard data',
      error: error.message
    });
  }
});


router.get('/ventas', async (req, res) => {
  try {
    const data = await getSalesAnalytics({
      year: req.query.year,
      month: req.query.month,
      category: req.query.category || 'TODOS'
    });

    res.json(data);
  } catch (error) {
    console.error('[sales/ventas]', error);
    res.status(500).json({
      message: 'Could not load sales analytics',
      error: error.message
    });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error('[sales/categories]', error);
    res.status(500).json({
      message: 'Could not load categories',
      error: error.message
    });
  }
});

router.get('/raw-sales', async (_req, res) => {
  try {
    const salesRows = await getSalesData();
    res.json(salesRows);
  } catch (error) {
    console.error('[sales/raw-sales]', error);
    res.status(500).json({
      message: 'Could not load sales rows',
      error: error.message
    });
  }
});

module.exports = router;
