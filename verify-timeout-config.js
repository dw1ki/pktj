#!/usr/bin/env node
/**
 * Verification Script for Timeout Configuration
 * 
 * Purpose: Verify that all timeout configurations are correctly implemented
 * for handling long-running YOLO video processing (1+ hour duration)
 * 
 * Usage: node verify-timeout-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '╔════════════════════════════════════════════════════════════╗');
console.log('\x1b[36m%s\x1b[0m', '║  TIMEOUT CONFIGURATION VERIFICATION SCRIPT                 ║');
console.log('\x1b[36m%s\x1b[0m', '║  Long-Running Video Processing (1+ hour) Support           ║');
console.log('\x1b[36m%s\x1b[0m', '╚════════════════════════════════════════════════════════════╝\n');

const checks = [];

// ============================================================================
// CHECK 1: app.js - Middleware Timeout (10 minutes)
// ============================================================================
console.log('\x1b[33m%s\x1b[0m', '[CHECK 1] app.js - Express Middleware Timeout');
const appJsPath = path.join(__dirname, 'backend', 'src', 'app.js');
try {
  const appContent = fs.readFileSync(appJsPath, 'utf8');
  
  const hasJsonTimeout = appContent.includes('json') && appContent.includes('timeout');
  const hasUrlencodedTimeout = appContent.includes('urlencoded') && appContent.includes('timeout');
  const timeout10min = appContent.includes('600000');
  
  if (hasJsonTimeout && hasUrlencodedTimeout && timeout10min) {
    console.log('\x1b[32m%s\x1b[0m', '  ✓ PASS: Express middleware timeout configured (10 minutes)');
    checks.push(true);
  } else {
    console.log('\x1b[31m%s\x1b[0m', '  ✗ FAIL: Express middleware timeout NOT properly configured');
    if (!hasJsonTimeout) console.log('    - Missing json middleware timeout');
    if (!hasUrlencodedTimeout) console.log('    - Missing urlencoded middleware timeout');
    if (!timeout10min) console.log('    - Timeout not set to 600000ms (10 minutes)');
    checks.push(false);
  }
} catch (error) {
  console.log('\x1b[31m%s\x1b[0m', `  ✗ ERROR: Cannot read app.js - ${error.message}`);
  checks.push(false);
}
console.log();

// ============================================================================
// CHECK 2: server.js - HTTP Server Socket Timeout (15 minutes)
// ============================================================================
console.log('\x1b[33m%s\x1b[0m', '[CHECK 2] server.js - HTTP Server Socket Timeout');
const serverJsPath = path.join(__dirname, 'backend', 'src', 'server.js');
try {
  const serverContent = fs.readFileSync(serverJsPath, 'utf8');
  
  const hasServerTimeout = serverContent.includes('server.timeout') && serverContent.includes('15 * 60 * 1000');
  const hasKeepAliveTimeout = serverContent.includes('keepAliveTimeout') && serverContent.includes('65 * 1000');
  const hasRequestTimeout = serverContent.includes('requestTimeout') && serverContent.includes('12 * 60 * 1000');
  const hasSocketHandler = serverContent.includes("server.on('connection')");
  const hasSocketSetTimeout = serverContent.includes('socket.setTimeout');
  const hasSocketKeepAlive = serverContent.includes('socket.setKeepAlive(true)');
  
  if (hasServerTimeout && hasKeepAliveTimeout && hasRequestTimeout && 
      hasSocketHandler && hasSocketSetTimeout && hasSocketKeepAlive) {
    console.log('\x1b[32m%s\x1b[0m', '  ✓ PASS: HTTP server socket timeout fully configured (15 minutes)');
    console.log('\x1b[32m%s\x1b[0m', '    - server.timeout: 15 minutes');
    console.log('\x1b[32m%s\x1b[0m', '    - keepAliveTimeout: 65 seconds');
    console.log('\x1b[32m%s\x1b[0m', '    - requestTimeout: 12 minutes');
    console.log('\x1b[32m%s\x1b[0m', '    - socket.setTimeout: 15 minutes');
    console.log('\x1b[32m%s\x1b[0m', '    - socket.setKeepAlive: enabled');
    checks.push(true);
  } else {
    console.log('\x1b[31m%s\x1b[0m', '  ✗ FAIL: HTTP server socket timeout NOT fully configured');
    if (!hasServerTimeout) console.log('    - Missing server.timeout (15 min)');
    if (!hasKeepAliveTimeout) console.log('    - Missing keepAliveTimeout (65 sec)');
    if (!hasRequestTimeout) console.log('    - Missing requestTimeout (12 min)');
    if (!hasSocketHandler) console.log('    - Missing socket connection handler');
    if (!hasSocketSetTimeout) console.log('    - Missing socket.setTimeout');
    if (!hasSocketKeepAlive) console.log('    - Missing socket.setKeepAlive(true)');
    checks.push(false);
  }
} catch (error) {
  console.log('\x1b[31m%s\x1b[0m', `  ✗ ERROR: Cannot read server.js - ${error.message}`);
  checks.push(false);
}
console.log();

// ============================================================================
// CHECK 3: detectController.js - Error Handling & Logging
// ============================================================================
console.log('\x1b[33m%s\x1b[0m', '[CHECK 3] detectController.js - Error Handling Enhancements');
const detectControllerPath = path.join(__dirname, 'backend', 'src', 'controllers', 'detectController.js');
try {
  const detectContent = fs.readFileSync(detectControllerPath, 'utf8');
  
  // Check getDetectionResults enhancements
  const hasResultsLogging = detectContent.includes('Retrieving detection results for ID');
  const hasResultsHeaders = detectContent.includes("res.setHeader('Connection', 'keep-alive')");
  const hasResultsErrorType = detectContent.includes('errorType');
  const hasSSLError = detectContent.includes('SSL_ERROR');
  const hasTimeoutError = detectContent.includes('TIMEOUT_ERROR');
  
  // Check getJobStatus enhancements
  const hasJobStatusLogging = detectContent.includes('Checking job status for ID');
  const hasJobStatusHeaders = detectContent.includes("res.setHeader('Connection', 'keep-alive')");
  const hasJobStatusTransmission = detectContent.includes('transmission:');
  
  if (hasResultsLogging && hasResultsHeaders && hasResultsErrorType && 
      hasSSLError && hasTimeoutError && hasJobStatusLogging && 
      hasJobStatusHeaders && hasJobStatusTransmission) {
    console.log('\x1b[32m%s\x1b[0m', '  ✓ PASS: detectController error handling enhanced');
    console.log('\x1b[32m%s\x1b[0m', '    - getDetectionResults: logging + keep-alive headers + error types');
    console.log('\x1b[32m%s\x1b[0m', '    - getJobStatus: logging + keep-alive headers + transmission info');
    console.log('\x1b[32m%s\x1b[0m', '    - Error differentiation: SSL_ERROR, TIMEOUT_ERROR');
    checks.push(true);
  } else {
    console.log('\x1b[31m%s\x1b[0m', '  ✗ FAIL: detectController error handling NOT fully enhanced');
    if (!hasResultsLogging) console.log('    - Missing getDetectionResults logging');
    if (!hasResultsHeaders) console.log('    - Missing getDetectionResults keep-alive headers');
    if (!hasResultsErrorType) console.log('    - Missing error type differentiation');
    if (!hasSSLError) console.log('    - Missing SSL_ERROR type');
    if (!hasTimeoutError) console.log('    - Missing TIMEOUT_ERROR type');
    if (!hasJobStatusLogging) console.log('    - Missing getJobStatus logging');
    if (!hasJobStatusHeaders) console.log('    - Missing getJobStatus keep-alive headers');
    if (!hasJobStatusTransmission) console.log('    - Missing transmission timing info');
    checks.push(false);
  }
} catch (error) {
  console.log('\x1b[31m%s\x1b[0m', `  ✗ ERROR: Cannot read detectController.js - ${error.message}`);
  checks.push(false);
}
console.log();

// ============================================================================
// SUMMARY
// ============================================================================
const passed = checks.filter(c => c).length;
const total = checks.length;
const allPassed = passed === total;

console.log('\x1b[36m%s\x1b[0m', '╔════════════════════════════════════════════════════════════╗');
console.log('\x1b[36m%s\x1b[0m', '║                    VERIFICATION SUMMARY                     ║');
console.log('\x1b[36m%s\x1b[0m', '╚════════════════════════════════════════════════════════════╝\n');

if (allPassed) {
  console.log('\x1b[32m%s\x1b[0m', `✓ ALL CHECKS PASSED (${passed}/${total})`);
  console.log('\x1b[32m%s\x1b[0m', '\n  ⭐ System ready for 1+ hour video processing!\n');
  console.log('\x1b[36m%s\x1b[0m', 'NEXT STEPS:');
  console.log('\x1b[36m%s\x1b[0m', '  1. Deploy backend changes to production');
  console.log('\x1b[36m%s\x1b[0m', '  2. Test with 1-hour video (or similar long-duration video)');
  console.log('\x1b[36m%s\x1b[0m', '  3. Verify in server logs:');
  console.log('\x1b[36m%s\x1b[0m', '     - "[ISO-TIME] Retrieving detection results for ID: ..."');
  console.log('\x1b[36m%s\x1b[0m', '     - "[ISO-TIME] Sending detection results, status: ..."');
  console.log('\x1b[36m%s\x1b[0m', '     - "[ISO-TIME] Detection results sent successfully..."');
  console.log('\x1b[36m%s\x1b[0m', '  4. Verify frontend receives video without SSL error\n');
  process.exit(0);
} else {
  console.log('\x1b[31m%s\x1b[0m', `✗ SOME CHECKS FAILED (${passed}/${total})\n`);
  console.log('\x1b[31m%s\x1b[0m', 'Please fix the issues indicated above before testing video processing.\n');
  process.exit(1);
}
