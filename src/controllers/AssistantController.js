const AssistantV1 = require('ibm-watson/assistant/v1');
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

require('dotenv').config();

const initialCredentials = {
  apikey: process.env.WA_APIKEY,
  url: process.env.WA_URL,
  assistantId: process.env.WA_ASSISTANT_ID,
  skill: process.env.WA_SKILL_ID
};

const sendMessage = async (msg, sessionId, model, credentials) => {
  let response;
  try {
    const assistantResponse = await model.message({
      assistantId: credentials.assistantId,
      sessionId,
      input: {
        message_type: 'text',
        text: msg
      }
    });
    response = {
      err: false,
      result: assistantResponse.result
    };
  } catch (err) {
    console.error(err);
    response = {
      err: true,
      msg: 'Hubo un error al llamar al servicio.'
    };
  }
  return response;
};

const changeModel = async (newCredentials) => {
  if (
    !newCredentials.apikey ||
    !newCredentials.url ||
    !newCredentials.assistantId ||
    !newCredentials.skill
  ) {
    console.error(
      'Change model error - the following credentials are not valid:',
      newCredentials
    );
    return {
      err: true,
      msg: 'Las credenciales ingresadas no son válidas. Inténtalo de nuevo.'
    };
  } else {
    let response;
    try {
      const assistant = new AssistantV1({
        version: '2020-04-01',
        authenticator: new IamAuthenticator({
          apikey: newCredentials.apikey
        }),
        url: newCredentials.url
      });

      await assistant.message({
        workspaceId: newCredentials.skill,
        input: { text: 'Hola' }
      });

      const newModel = new AssistantV2({
        version: '2020-04-01',
        authenticator: new IamAuthenticator({
          apikey: newCredentials.apikey
        }),
        url: newCredentials.url
      });
      const newSession = await newModel.createSession({
        assistantId: newCredentials.assistantId
      });
      response = {
        err: false,
        model: newModel,
        credentials: newCredentials,
        session: newSession.result.session_id
      };
    } catch {
      response = {
        err: true,
        msg: 'Las credenciales ingresadas no son válidas. Inténtalo de nuevo.'
      };
    }
    return response;
  }
};

let currentModel = null,
  currentSession = null,
  currentCredentials = null,
  valid = false;

changeModel(initialCredentials)
  .then((res) => {
    if (res.err === true) {
      console.log(res);
      console.error('ERROR - invalid initial credentials provided.');
    } else {
      currentModel = res.model;
      currentCredentials = res.credentials;
      currentSession = res.session;
      valid = true;
    }
  })
  .catch((err) => {
    console.log(err);
    console.error('ERROR - invalid initial credentials provided.');
  });

module.exports = {
  changeCredentials: async (req, res) => {
    let response;
    if (req.body.password !== process.env.DEPLOYMENT_PASSWORD) {
      response = {
        err: true,
        msg:
          'La contraseña ingresada no es válida. Si has olvidado tu contraseña, elimina tu aplicación en la lista de recursos de IBM Cloud y vuelva a realizar el despliegue.'
      };
    } else {
      const newModel = await changeModel(req.body);
      if (newModel.err === true) {
        response = newModel;
      } else {
        currentModel = newModel.model;
        currentCredentials = newModel.credentials;
        currentSession = newModel.session;
        valid = true;
        response = {
          err: false,
          msg: 'Asistente modificado con éxito.'
        };
      }
    }
    return res.json(response);
  },
  getCredentials: () => {
    let response;
    if (valid === true) {
      response = {
        err: false,
        credentials: {
          ...currentCredentials
        }
      };
    } else {
      response = {
        err: true,
        msg:
          'Las credenciales del asistente no son válidas. Cámbielas haciendo clic en el botón de configuración de arriba.'
      };
    }
    return response;
  },
  createSession: async (_, res) => {
    let response;
    if (valid === true) {
      const newSession = await changeModel(currentCredentials);
      if (newSession.err === true) {
        response = newSession;
      } else {
        currentSession = newSession.session;
        response = {
          err: false,
          msg: 'Sesión creada con éxito.'
        };
      }
    } else {
      response = {
        err: true,
        msg:
          'Las credenciales del asistente no son válidas. Cámbielas haciendo clic en el botón de configuración de arriba.'
      };
    }
    return res.json(response);
  },
  sendMessage: async (req, res) => {
    let response;
    if (valid === true) {
      response = await sendMessage(
        req.body.msg,
        currentSession,
        currentModel,
        currentCredentials
      );
    } else {
      response = {
        err: true,
        msg:
          'Las credenciales del asistente no son válidas. Cámbielas haciendo clic en el botón de configuración de arriba.'
      };
    }
    return res.json(response);
  }
};
