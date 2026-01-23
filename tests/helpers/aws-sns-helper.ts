import { SNSClient } from "@aws-sdk/client-sns";
import { AWS_REGION } from "tests/constants/api-constants";

export const snsClient = new SNSClient({ region: AWS_REGION });
