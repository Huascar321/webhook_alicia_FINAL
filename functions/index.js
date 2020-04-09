// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Dialogflow fulfillment getting started guide:
// https://dialogflow.com/docs/how-tos/getting-started-fulfillment

'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var _ci;

/*admin.initializeApp({
	credential: admin.credential.applicationDefault(),
  	databaseURL: 'ws://proyecto-aliciadw-vpdqdi.firebaseio.com/'
}); */

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome (agent) {
    agent.add(`Hola gente hermosa, probando el webhook, funciona a la perfeccion`);
  }

  function fallback (agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function verificarCarnet(agent){
    _ci = null;
    const carnet = agent.parameters.ci;
    if(carnet.toString().length < 9){
		return admin.database().ref("usuarios").once("value").then((snapshot) => {
		  const value = snapshot.child(carnet.toString()).exists();
          if(value){
            agent.add(`El número de CI ya fue registrado, intente nuevamente`); //AQUI EMPIEZA SU LABURO :D (, ¿Desea modificar algun dato?)
          }
          else{
            _ci = carnet;
          }
		});
    }
    else{
      	agent.add(`El numero de carnet debe tener máximo 8 digitos. Por favor ingrese un CI válido.`);
    }
  }

  function registroDatosPersonales(agent){
    const nombre = agent.parameters.nombre[0];
    const apellidoPaterno = agent.parameters.apellidoPaterno[0];
    const apellidoMaterno = agent.parameters.apellidoMaterno[0];
    const edad = agent.parameters.edad.toString();
    const sexo = agent.parameters.sexo.toString();
    const departamento = agent.parameters.departamento.toString();
    const numero = agent.parameters.numero.toString();
    //const today = new Date();
    //const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    return admin.database().ref('usuarios/'+_ci).set({
    	nombre: nombre,
      	apellidoPaterno: apellidoPaterno,
      	apellidoMaterno: apellidoMaterno,
        edad: edad,
        sexo: sexo,
        departamento: departamento,
      	telefono:numero,
      	ci:_ci,
      	//fechaUltimaModificacion:date
    });
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase inline editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://dialogflow.com/images/api_home_laptop.svg',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://docs.dialogflow.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!'); // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('controlRegistroCI',verificarCarnet);
  intentMap.set('controlRegistroDatos',registroDatosPersonales);
  // intentMap.set('<INTENT_NAME_HERE>', yourFunctionHandler);
  // intentMap.set('<INTENT_NAME_HERE>', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
