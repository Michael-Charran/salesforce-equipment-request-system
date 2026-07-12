import { LightningElement, wire } from 'lwc';
import getRecentRequests from '@salesforce/apex/EquipmentRequestController.getRecentRequests';
import getApprovedCount from '@salesforce/apex/EquipmentRequestController.getApprovedCount';
import getPendingCount from '@salesforce/apex/EquipmentRequestController.getPendingCount';
import createRequest from '@salesforce/apex/EquipmentRequestController.createRequest';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import EQUIPMENT_REQUEST_OBJECT from '@salesforce/schema/Equipment_Request__c';
import EQUIPMENT_TYPE_FIELD from '@salesforce/schema/Equipment_Request__c.Equipment_Type__c';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import LightningConfirm from 'lightning/confirm';

export default class EquipmentDashboard extends NavigationMixin(LightningElement) {

    // form fields
    equipmentType;
    estimatedCost;
    justification;

    // wire data
    requests;
    wiredRequestsResult;

    approvedCount;
    pendingCount;
    recordTypeId;
    equipmentOptions = [];

    showModal = false;
    selectedRecordId;


    columns = [
    {
        label: 'Request',
        fieldName: 'Name',
        type: 'text'
    },
    {
        label: 'Equipment',
        fieldName: 'Equipment_Type__c',
        type: 'text'
    },
    {
        label: 'Cost',
        fieldName: 'Estimated_Cost__c',
        type: 'currency'
    },
    {
        label: 'Status',
        fieldName: 'Status__c',
        type: 'text'
    },
    {
        label: 'Created',
        fieldName: 'CreatedDate',
        type: 'date'
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
    { label: 'View', name: 'view' },
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }]
    }
    }
];

    @wire(getRecentRequests)
    wiredRequests(result) {
        this.wiredRequestsResult = result;
        if (result.data) {
            this.requests = result.data;
        }
    }

   approvedWireResult;

@wire(getApprovedCount)
wiredApproved(result) {
    this.approvedWireResult = result;

    if (result.data !== undefined) {
        this.approvedCount = result.data;
    }
}

   pendingWireResult;

@wire(getPendingCount)
wiredPending(result) {
    this.pendingWireResult = result;

    if (result.data !== undefined) {
        this.pendingCount = result.data;
    }
}

    @wire(getObjectInfo, { objectApiName: EQUIPMENT_REQUEST_OBJECT })
    objectInfo({ data }) {
    if (data) {
        this.recordTypeId = data.defaultRecordTypeId;
    }   
    }

        @wire(getPicklistValues, {
        recordTypeId: '$recordTypeId',
        fieldApiName: EQUIPMENT_TYPE_FIELD
})
    wiredPicklist({ data }) {
        if (data) {
            this.equipmentOptions = data.values;
        }
}
     

    handleType(event) {
    this.equipmentType = event.detail.value;
}
    handleCost(event) {
        this.estimatedCost = event.target.value;
    }

    handleJustification(event) {
        this.justification = event.target.value;
    }

openEditModal(recordId) {
    this.selectedRecordId = recordId;
    this.showModal = true;
}

closeModal() {
    this.showModal = false;
    this.selectedRecordId = null;
}

async handleModalSuccess() {

    this.showModal = false;

    // Wait a moment for Salesforce to finish committing the update
    await new Promise(resolve => setTimeout(resolve, 300));

    await Promise.all([
        refreshApex(this.wiredRequestsResult),
        refreshApex(this.approvedWireResult),
        refreshApex(this.pendingWireResult)
    ]);

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: 'Equipment Request Updated',
            variant: 'success'
        })
    );
}

async handleRowAction(event) {

    const action = event.detail.action.name;
    const row = event.detail.row;

    switch (action) {

        case 'view':

            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    objectApiName: 'Equipment_Request__c',
                    actionName: 'view'
                }
            });

            break;

        case 'edit':
            this.openEditModal(row.Id);
            break;    

        case 'delete':

    const confirmed = await LightningConfirm.open({
        message: `Are you sure you want to delete ${row.Name}?`,
        label: 'Confirm Delete',
        theme: 'warning'
    });

    if (!confirmed) {
        return;
    }

    try {

        await deleteRecord(row.Id);

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Equipment Request Deleted',
                variant: 'success'
            })
        );

        await refreshApex(this.wiredRequestsResult);
        await refreshApex(this.approvedWireResult);
        await refreshApex(this.pendingWireResult);

    } catch (error) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Delete Failed',
                message: error.body?.message || 'An unexpected error occurred.',
                variant: 'error'
            })
        );

    }
        break;
    }

}
    async handleSubmit() {

    // basic frontend validation
    if (!this.equipmentType || !this.estimatedCost || !this.justification) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Missing Fields',
                message: 'Please fill out all fields.',
                variant: 'error'
            })
        );
        return;
    }

    try {
        await createRequest({
            equipmentType: this.equipmentType,
            estimatedCost: this.estimatedCost,
            justification: this.justification
        });

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Equipment Request Created',
                variant: 'success'
            })
        );

        // refresh list
        await refreshApex(this.wiredRequestsResult);
        await refreshApex(this.approvedWireResult);
        await refreshApex(this.pendingWireResult);

    } catch (error) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: error.body.message,
                variant: 'error'
            })
        );
    }
}
}
