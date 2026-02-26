# PulmoSense v2 - Fixes and Development Tasks

## Issues to Fix:
1. [x] Add `.hidden` class to CSS for onboarding modal
2. [x] Fix chart SVG - remove unnecessary `points` attribute setting
3. [x] Fix condition chip selection (toggle functionality in settings)
4. [x] Add proper error handling for navigation
5. [x] Test all functionality

## Features to Enhance:
- [x] Auto-close onboarding for demo mode
- [x] Ensure all animations work correctly

## Lung Capacity Functions (COMPLETED):
- [x] Add CSS styles for lung capacity components
- [x] Add JavaScript lung capacity functions:
  - [x] FEV1 (Forced Expiratory Volume in 1 second) calculation
  - [x] FVC (Forced Vital Capacity) calculation
  - [x] FEV1/FVC ratio calculation
  - [x] Predicted lung capacity based on age/gender/height
  - [x] Spirometry chart visualization
  - [x] Lung capacity test simulation
- [x] Add HTML components to dashboard:
  - [x] Lung Capacity Metrics card
  - [x] Spirometry chart section
  - [x] Lung capacity test interface

## Testing Results:
- [x] Server running on http://localhost:3000
- [x] Frontend HTML serving correctly (48045 bytes)
- [x] API /api/lung-capacity/current working
- [x] API /api/aqi working
- [x] API /api/recommendations working
