@IsTest
private class EquipmentRequestRestServiceTest {

    @TestSetup
    static void createTestData() {
        insert new List<Equipment_Request__c>{
            new Equipment_Request__c(
                Equipment_Type__c = 'Mouse',
                Estimated_Cost__c = 50,
                Justification__c = 'Test mouse request',
                Status__c = 'Approved'
            ),
            new Equipment_Request__c(
                Equipment_Type__c = 'Laptop',
                Estimated_Cost__c = 2000,
                Justification__c = 'Test laptop request',
                Status__c = 'Pending Approval'
            )
        };
    }

    @IsTest
    static void getRequestsReturnsRecords() {
        RestRequest request = new RestRequest();
        request.requestUri =
            '/services/apexrest/equipmentrequests/';
        request.httpMethod = 'GET';

        RestContext.request = request;
        RestContext.response = new RestResponse();

        Test.startTest();
        List<Equipment_Request__c> results =
            EquipmentRequestRestService.getRequests();
        Test.stopTest();

        System.assertEquals(
            2,
            results.size(),
            'The GET endpoint should return the two test requests.'
        );

        System.assertNotEquals(
            null,
            results[0].Id,
            'Returned requests should contain record IDs.'
        );
    }

    @IsTest
    static void createRequestCreatesRecord() {
        RestRequest request = new RestRequest();
        request.requestUri =
            '/services/apexrest/equipmentrequests/';
        request.httpMethod = 'POST';
        request.addHeader('Content-Type', 'application/json');

        request.requestBody = Blob.valueOf(
            JSON.serialize(
                new Map<String, Object>{
                    'equipmentType' => 'Monitor',
                    'estimatedCost' => 500,
                    'justification' => 'Created by REST unit test'
                }
            )
        );

        RestContext.request = request;
        RestContext.response = new RestResponse();

        Test.startTest();
        Equipment_Request__c result =
            EquipmentRequestRestService.createRequest();
        Test.stopTest();

        System.assertNotEquals(
            null,
            result.Id,
            'The POST endpoint should return the created record.'
        );

        Equipment_Request__c savedRequest = [
            SELECT
                Equipment_Type__c,
                Estimated_Cost__c,
                Justification__c,
                Status__c
            FROM Equipment_Request__c
            WHERE Id = :result.Id
        ];

        System.assertEquals(
            'Monitor',
            savedRequest.Equipment_Type__c
        );

        System.assertEquals(
            500,
            savedRequest.Estimated_Cost__c
        );

        System.assertEquals(
            'Created by REST unit test',
            savedRequest.Justification__c
        );

        System.assertEquals(
            'Approved',
            savedRequest.Status__c,
            'Requests below $1,000 should be approved by the record-triggered Flow.'
        );

        System.assertEquals(
            201,
            RestContext.response.statusCode,
            'A successful POST should return HTTP 201.'
        );
    }
}