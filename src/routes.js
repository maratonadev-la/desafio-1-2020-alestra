const { Router } = require('express');
const AssistantController = require('./controllers/AssistantController');
const SubmissionController = require('./controllers/SubmissionController');

const routes = Router();

routes.post('/api/credentials', async (req, res) => {
  return await AssistantController.changeCredentials(req, res);
});

routes.post('/api/message', async (req, res) => {
  return await AssistantController.sendMessage(req, res);
});

routes.post('/api/session', async (req, res) => {
  return await AssistantController.createSession(req, res);
});

routes.post('/api/submit', async (req, res) => {
  return await SubmissionController.submit(req, res);
});

module.exports = routes;
