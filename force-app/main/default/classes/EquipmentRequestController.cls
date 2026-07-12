public with sharing class EquipmentRequestController {

    @AuraEnabled(cacheable=true)
    public static List<Equipment_Request__c> getRecentRequests() {
        return [
            SELECT Id, Name, Equipment_Type__c, Status__c, Estimated_Cost__c, CreatedDate
            FROM Equipment_Request__c
            ORDER BY CreatedDate DESC
            LIMIT 10
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Integer getApprovedCount() {
        return [
            SELECT COUNT()
            FROM Equipment_Request__c
            WHERE Status__c = 'Approved'
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Integer getPendingCount() {
        return [
            SELECT COUNT()
            FROM Equipment_Request__c
            WHERE Status__c = 'Pending Approval'
        ];
    }

   @AuraEnabled
public static Id createRequest(String equipmentType, Decimal estimatedCost, String justification) {

    if (String.isBlank(equipmentType)) {
        throw new AuraHandledException('Equipment Type is required.');
    }

    if (estimatedCost == null || estimatedCost <= 0) {
        throw new AuraHandledException('Estimated Cost must be greater than 0.');
    }

    if (String.isBlank(justification)) {
        throw new AuraHandledException('Justification is required.');
    }

    Equipment_Request__c req = new Equipment_Request__c(
        Equipment_Type__c = equipmentType,
        Estimated_Cost__c = estimatedCost,
        Justification__c = justification,
        Status__c = 'Draft'
    );

    insert req;
    return req.Id;
}

}