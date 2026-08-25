const express = require('express');
const router = express.Router();
const { getOverview, getProductsAnalytics, getClientsAnalytics, getSalesAnalytics } = require('../services/intelligenceService');

async function send(res, fn, query, label) {
  try { res.json(await fn(query)); }
  catch(error){ console.error(`[DASH ${label}]`,error.message); res.status(500).json({message:`No se pudo cargar ${label} de Casa Margot`,detail:error.message}); }
}
router.get('/overview', (req,res)=>send(res,getOverview,req.query,'intelligence'));
router.get('/products', (req,res)=>send(res,getProductsAnalytics,req.query,'productos'));
router.get('/clients', (req,res)=>send(res,getClientsAnalytics,req.query,'clientes'));
router.get('/sales', (req,res)=>send(res,getSalesAnalytics,req.query,'ventas'));
module.exports=router;
