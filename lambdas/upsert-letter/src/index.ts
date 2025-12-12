// Replace me with the actual code for your Lambda function
import { Handler } from "aws-lambda";

const handler: Handler = async (event) => {
  console.log("Received event:", event);
  return {
    statusCode: 200,
    body: "Event logged",
  };
};

export default handler;
