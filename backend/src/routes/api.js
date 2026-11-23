const express = require('express');
const { validate } = require('../middleware/validate');
const schema = require('../schemas/api');
const { createApiController } = require('../controllers/apiController');

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function createApiRouter(repository, now) {
  const router = express.Router();
  const controller = createApiController(repository, now);
  router.get('/health', asyncRoute(controller.health));
  router.get('/letters', validate(schema.listLetters, 'query'), asyncRoute(controller.listLetters));
  router.get('/letters/:symbol', validate(schema.letterSymbol, 'params'), validate(schema.letterDetailQuery, 'query'), asyncRoute(controller.getLetter));
  router.get('/words', validate(schema.listWords, 'query'), asyncRoute(controller.listWords));
  router.get('/exercise-types', asyncRoute(controller.listExercises));
  router.get('/exercise-types/:id', validate(schema.exerciseId, 'params'), asyncRoute(controller.getExercise));
  router.post('/children', validate(schema.childCreate), asyncRoute(controller.createChild));
  router.get('/children/:id', validate(schema.childId, 'params'), asyncRoute(controller.getChild));
  router.put('/children/:id', validate(schema.childId, 'params'), validate(schema.childUpdate), asyncRoute(controller.updateChild));
  router.put('/children/:id/settings', validate(schema.childId, 'params'), validate(schema.childSettings), asyncRoute(controller.updateChildSettings));
  router.post('/sessions', validate(schema.createSession), asyncRoute(controller.createSession));
  router.get('/sessions', validate(schema.listSessions, 'query'), asyncRoute(controller.listSessions));
  router.get('/sessions/:id', validate(schema.sessionId, 'params'), asyncRoute(controller.getSession));
  router.put('/sessions/:id', validate(schema.sessionId, 'params'), validate(schema.updateSession), asyncRoute(controller.updateSession));
  router.delete('/sessions/:id', validate(schema.sessionId, 'params'), asyncRoute(controller.deleteSession));
  router.get('/dashboard/:childId', validate(schema.dashboardChildId, 'params'), asyncRoute(controller.dashboard));
  router.get('/progress/:childId', validate(schema.dashboardChildId, 'params'), validate(schema.progressQuery, 'query'), asyncRoute(controller.progress));
  router.get('/recommendations/:childId', validate(schema.dashboardChildId, 'params'), validate(schema.listRecommendations, 'query'), asyncRoute(controller.recommendations));
  return router;
}

module.exports = { createApiRouter };
