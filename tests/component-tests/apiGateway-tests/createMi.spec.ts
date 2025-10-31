import {test, expect} from '@playwright/test';
import { getRestApiGatewayBaseUrl } from "../../helpers/awsGatewayHelper";
import { MI_ENDPOINT } from '../../constants/api_constants';
import { createHeaderWithNoCorrelationId, createHeaderWithNoRequestId, createInvalidRequestHeaders, createValidRequestHeaders } from '../../constants/request_headers';
import { miInValidRequest, miValidRequest } from './testCases/createMi';
import { time } from 'console';
import { error400ResponseBody, error404ResponseBody, RequestId500Error } from '../../helpers/commonTypes';

let baseUrl: string;

test.beforeAll(async () => {
  baseUrl = await getRestApiGatewayBaseUrl();
});

test.describe('API Gateway Tests to Verify Mi Endpoint', () => {
    test(`Post /mi returns 200 when a valid request is passed`, async ({ request }) => {

      const headers = createValidRequestHeaders();
      const body = miValidRequest();

      const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
          headers: headers,
          data: body
      });

        const res = await response.json();
        expect(response.status()).toBe(201);
        expect(res.data.attributes).toMatchObject({
            groupId: 'group123',
            lineItem: 'envelope-business-standard',
            quantity: 10,
            specificationId: 'Test-Spec-Id',
            stockRemaining: 100,
            timestamp: body.data.attributes.timestamp,
        });
        expect(res.data.type).toBe('ManagementInformation');
  });

    test(`Post /mi returns 400 when a invalid request is passed`, async ({ request }) => {
        const headers = createValidRequestHeaders();
        const body = miInValidRequest();

        const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
            headers: headers,
            data: body
        });

        const res = await response.json();
        expect(response.status()).toBe(400);
        expect(res).toMatchObject(error400ResponseBody());
    });

    test(`Post /mi returns 403 when a invalid request is passed`, async ({ request }) => {
        const headers = createInvalidRequestHeaders();
        const body = miValidRequest();

        const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
            headers: headers,
            data: body
        });

        const res = await response.json();
        expect(response.status()).toBe(403);
        expect(res).toMatchObject({
          Message : 'User is not authorized to access this resource with an explicit deny in an identity-based policy' }
        );
    });

    test(`Post /mi returns 500 when a correlationId is not passed`, async ({ request }) => {
        const headers = createHeaderWithNoCorrelationId();
        const body = miValidRequest();

        const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
            headers: headers,
            data: body
        });

        const res = await response.json();
        expect(response.status()).toBe(500);
        expect(res.errors[0].detail).toBe("The request headers don't contain the APIM correlation id");
    });

    test(`Post /mi returns 500 when a x-request-id is not passed`, async ({ request }) => {
        const headers = createHeaderWithNoRequestId();
        const body = miValidRequest();

        const response = await request.post(`${baseUrl}/${MI_ENDPOINT}`, {
            headers: headers,
            data: body
        });

        const res = await response.json();
        expect(response.status()).toBe(500);
        expect(res).toMatchObject(RequestId500Error());
    });


});
