import { LightningElement, api } from 'lwc';

export default class EquipmentRequestModal extends LightningElement {

    @api recordId;

    @api isOpen = false;

    close() {
        this.dispatchEvent(
            new CustomEvent('close')
        );
    }

    handleSuccess() {
        this.dispatchEvent(
            new CustomEvent('success')
        );
    }

}