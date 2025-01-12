import type { RouteHandler } from 'gadget-server';
import { sendRequestNP } from '../../utilities/sendRequestNP';

const route: RouteHandler<{
  Body: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    paymentMethod: string;
    documentData: object;
  };
}> = async ({ request, reply }) => {
  const { firstName, lastName, phone, email, documentData, paymentMethod } =
    request.body;

  if (!documentData || !firstName || !lastName || !phone || !paymentMethod) {
    return await reply.status(400).send({ error: 'All fields are required' });
  }

  const createCounterpartyPayload = {
    modelName: 'CounterpartyGeneral',
    calledMethod: 'save',
    methodProperties: {
      FirstName: firstName,
      LastName: lastName,
      Phone: phone,
      Email: email,
      CounterpartyType: 'PrivatePerson',
      CounterpartyProperty: 'Recipient',
    },
  };

  try {
    const responseCounterPartyCreated = await sendRequestNP(
      createCounterpartyPayload
    );
    console.log(
      '🚀 ~ responseCounterPartyCreated:',
      JSON.stringify(responseCounterPartyCreated)
    );

    const payload = {
      modelName: 'InternetDocument',
      calledMethod: 'save',
      methodProperties: {
        ...documentData,
        Recipient: responseCounterPartyCreated.data[0].Ref,
        ContactRecipient:
          responseCounterPartyCreated.data[0].ContactPerson.data[0].Ref,
        DateTime: new Date().toLocaleDateString('uk-UA'),
      },
    };
    console.log('🚀 ~InternetDocument payload:', payload);
    const response = await sendRequestNP(payload);
    await reply.send(response);
  } catch (error: any) {
    await reply.status(500).send({ error: error.message });
  }
};

export default route;
