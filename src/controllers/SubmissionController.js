const { getCredentials } = require('./AssistantController');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  submit: async (req, res) => {
    let response;
    if (req.body.password !== process.env.DEPLOYMENT_PASSWORD) {
      response = {
        err: true,
        msg:
          'La contraseña ingresada no es válida. Si has olvidado tu contraseña, elimina tu aplicación en la lista de recursos de IBM Cloud y vuelva a realizar el despliegue.'
      };
    } else {
      const credentialsResponse = getCredentials();
      if (credentialsResponse.err === true) {
        response = credentialsResponse;
      } else {
        const submissionResponse = await axios.post(
          'https://submission.maratona.dev/api/v1/desafios/dalestra',
          {
            ...credentialsResponse.credentials,
            email: process.env.USER_EMAIL
          }
        );
        let msg;
        switch (submissionResponse.data.code) {
          case 200:
            msg = `Haz clic en el enlace enviado a tu correo electrónico (${process.env.USER_EMAIL}) para completar el envío.`;
            break;
          case 502:
            msg = 'Ya has alcanzado el límite de envíos.';
            break;
          case 504:
            msg = `No se encontró al usuario con el correo electrónico ${process.env.USER_EMAIL}. Para cambiar el correo electrónico, elimina tu aplicación en la lista de recursos de IBM Cloud y vuelve a realizar el despliegue.`;
            break;
          case 503:
            msg =
              'Las credenciales están incorrectas. Cámbialas haciendo clic en el botón de configuración de arriba.';
            break;
          case 500:
          case 501:
          default:
            msg =
              'Hubo un error durante tu envío. Vuelve a desplegar la aplicación. Si el problema persiste, comunícate con un supervisor.';
            break;
        }
        if (submissionResponse.data.code === 200) {
          response = {
            err: false,
            msg
          };
        } else {
          response = {
            err: true,
            msg
          };
        }
      }
    }
    return res.json(response);
  }
};
