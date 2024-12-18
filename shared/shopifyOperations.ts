import { log } from 'console';
import { makeGraphQLQuery } from './makeGraphQLQuery';
import makeIPMessage from './makeIPMessage';

export async function getOrdersTags(orderIds: string[]): Promise<string[]> {
  const orderTagPromises = orderIds.map((id) => {
    const query = `#graphql
      query Order($id: ID!) {
        order(id: $id) {
          tags
        }
      }`;
    return makeGraphQLQuery<{ order: { tags: string[] } }>(query, { id });
  });

  const tagQueryResults = await Promise.all(orderTagPromises);
  const tags: string[] = [];
  tagQueryResults.forEach(({ data }) => {
    if (data?.order?.tags) {
      tags.push(...data.order.tags);
    }
  });

  return tags;
}

export async function getOrderTags(orderId: string): Promise<string[]> {
  const query = `#graphql
    query Order($id: ID!) {
      order(id: $id) {
        tags
      }
    }`;
  const { data, errors } = await makeGraphQLQuery<{
    order: { tags: string[] };
  }>(query, { id: orderId });

  if (errors) {
    const errorMessages = errors.map((e) => e.message).join(', ');
    throw new Error(`Failed to fetch order details: ${errorMessages}`);
  }

  return data?.order?.tags || [];
}

interface OrderInfo {
  tags: string[];
  orderNumber: string;
  total: string;
  customerId: string;
}

export async function getOrderInfo(orderId: string): Promise<OrderInfo> {
  const query = `#graphql
    query Order($id: ID!) {
      order(id: $id) {
        name
        totalPriceSet {
            shopMoney {
                amount
            }
        }
        tags
        customer {
            id
        }
      }
    }`;
  const { data } = await makeGraphQLQuery<{
    order: {
      tags: string[];
      name: string;
      totalPriceSet: {
        shopMoney: { amount: string };
      };
      customer: { id: string };
    };
  }>(query, { id: orderId });

  if (data?.order) {
    const { tags, name, totalPriceSet, customer } = data?.order;
    return {
      tags,
      orderNumber: name,
      total: totalPriceSet.shopMoney.amount,
      customerId: customer?.id,
    };
  }
  throw new Error(`Order ${orderId} not found`);
}

export async function updateOrderTags({
  value,
  orderId,
}: {
  value: string;
  orderId: string;
}): Promise<void> {
  const currentTags = await getOrderTags(orderId);

  if (currentTags.length > 0) {
    const removeTagsMutation = `#graphql
      mutation RemoveTags($id: ID!, $tags: [String!]!) {
        tagsRemove(id: $id, tags: $tags) {
          userErrors {
            field
            message
          }
        }
      }`;
    await makeGraphQLQuery(removeTagsMutation, {
      id: orderId,
      tags: currentTags,
    });
  }

  const addTagsMutation = `#graphql
    mutation AddTags($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        userErrors {
          field
          message
        }
        node {
          id
        }
      }
    }`;
  await makeGraphQLQuery(addTagsMutation, {
    id: orderId,
    tags: [value],
  });
}

export async function updateOrdersTags({
  value,
  orderIds,
}: {
  value: string;
  orderIds: string[];
}): Promise<void> {
  console.log(
    'Starting updateOrdersTags with value:',
    value,
    'and orderIds:',
    orderIds
  );

  const currentTags = await getOrdersTags(orderIds);
  console.log('Current tags for the orders:', currentTags);

  if (currentTags.length > 0) {
    console.log('Removing current tags from orders...');
    const removeTagsPromises = orderIds.map((id) => {
      const removeTagsMutation = `#graphql
          mutation RemoveTags($id: ID!, $tags: [String!]!) {
            tagsRemove(id: $id, tags: $tags) {
              userErrors {
                field
                message
              }
            }
          }`;
      console.log(`Removing tags for order ${id}:`, currentTags);
      return makeGraphQLQuery(removeTagsMutation, {
        id,
        tags: currentTags,
      });
    });

    try {
      const removeTagsResults = await Promise.all(removeTagsPromises);
      console.log('Remove tags results:', removeTagsResults);
    } catch (error) {
      console.error('Error removing tags:', error);
    }
  }

  console.log('Adding new tags to orders...');
  const addTagsPromises = orderIds.map((id) => {
    const addTagsMutation = `#graphql
        mutation AddTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) {
            userErrors {
              field
              message
            }
            node {
              id
            }
          }
        }`;
    console.log(`Adding tag '${value}' to order ${id}`);
    return makeGraphQLQuery(addTagsMutation, {
      id,
      tags: [value],
    });
  });

  try {
    const addTagsResults = await Promise.all(addTagsPromises);
    console.log('Add tags results:', addTagsResults);
  } catch (error) {
    console.error('Error adding tags:', error);
  }

  console.log('Tags successfully updated for all orders.');
}

export async function getCustomerPhone(customerId: string) {
  const query = `#graphql
  query GetCustomerPhone($customerId: ID!) {
    customer(id: $customerId) {
        phone
  }
  }`;
  const { data, errors } = await makeGraphQLQuery<{
    customer: { phone: string };
  }>(query, { customerId });

  if (errors) {
    const errorMessages = errors.map((e) => e.message).join(', ');
    throw new Error(`Failed to fetch order details: ${errorMessages}`);
  }
  const phone = data?.customer?.phone;
  if (!phone) return null;
  return phone.slice(-12);
}

export async function addOrderNote({
  orderId,
  note,
}: {
  orderId: string;
  note: string;
}) {
  if (!orderId) {
    throw new Error(`Order ID is required but was not provided`);
  }
  const updatedNote = note + (await makeIPMessage());

  const mutation = `#graphql
        mutation updateOrderNote($input: OrderInput!) {
            orderUpdate(input: $input) {
                order {
                    id
                    note
                }
                userErrors {
                    field
                    message
                }
            }
        }
      `;

  const { data, errors } = await makeGraphQLQuery<{
    orderUpdate: {
      order: { id: string; note: string };
      userErrors: { field: string; message: string }[];
    };
  }>(mutation, {
    input: {
      id: orderId,
      note: updatedNote,
    },
  });
  if (errors) {
    const errorMessages = errors.map((e) => e.message).join(', ');
    throw new Error(`Failed to update order note: ${errorMessages}`);
  }

  if (data?.orderUpdate?.userErrors?.length) {
    const userErrorMessages = data.orderUpdate.userErrors
      .map((e) => `${e.field}: ${e.message}`)
      .join(', ');
    throw new Error(`Failed to update order note: ${userErrorMessages}`);
  }
  return data?.orderUpdate?.order?.note || '';
}
