@RestResource(urlMapping='/equipmentrequests/*')
global with sharing class EquipmentRequestRestService {

    @HttpGet
    global static List<Equipment_Request__c> getRequests() {

        System.debug('REST METHOD CALLED');

        return [
            SELECT
                Id,
                Name,
                Equipment_Type__c,
                Estimated_Cost__c,
                Status__c,
                CreatedDate
            FROM Equipment_Request__c
            ORDER BY CreatedDate DESC
        ];
    }

    @HttpPost
global static Equipment_Request__c createRequest() {
    RestRequest request = RestContext.request;

    Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
        request.requestBody.toString()
    );

    String equipmentType = (String) body.get('equipmentType');
    String justification = (String) body.get('justification');
    Decimal estimatedCost = Decimal.valueOf(
        String.valueOf(body.get('estimatedCost'))
    );

    if (String.isBlank(equipmentType)) {
        throw new AuraHandledException('equipmentType is required.');
    }

    if (String.isBlank(justification)) {
        throw new AuraHandledException('justification is required.');
    }

    if (estimatedCost == null || estimatedCost <= 0) {
        throw new AuraHandledException('estimatedCost must be greater than 0.');
    }

    Equipment_Request__c newRequest = new Equipment_Request__c(
        Equipment_Type__c = equipmentType,
        Justification__c = justification,
        Estimated_Cost__c = estimatedCost,
        Status__c = 'Draft'
    );

    insert newRequest;

    RestContext.response.statusCode = 201;
    
    return [
        SELECT Id,
               Name,
               Equipment_Type__c,
               Estimated_Cost__c,
               Status__c,
               CreatedDate
        FROM Equipment_Request__c
        WHERE Id = :newRequest.Id
    ];
}
}