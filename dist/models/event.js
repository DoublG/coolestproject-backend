var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Table, Column, Model, DataType } from 'sequelize-typescript';
let Event = class Event extends Model {
};
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Event.prototype, "azure_storage_container", void 0);
__decorate([
    Column(DataType.NUMBER),
    __metadata("design:type", Number)
], Event.prototype, "minAge", void 0);
__decorate([
    Column(DataType.NUMBER),
    __metadata("design:type", Number)
], Event.prototype, "maxAge", void 0);
__decorate([
    Column(DataType.NUMBER),
    __metadata("design:type", Number)
], Event.prototype, "minGuardianAge", void 0);
__decorate([
    Column(DataType.NUMBER),
    __metadata("design:type", Number)
], Event.prototype, "maxRegistration", void 0);
__decorate([
    Column(DataType.NUMBER),
    __metadata("design:type", Number)
], Event.prototype, "maxVoucher", void 0);
__decorate([
    Column(DataType.DATE),
    __metadata("design:type", Date)
], Event.prototype, "eventBeginDate", void 0);
__decorate([
    Column(DataType.DATE),
    __metadata("design:type", Date)
], Event.prototype, "registrationOpenDate", void 0);
__decorate([
    Column(DataType.DATE),
    __metadata("design:type", Date)
], Event.prototype, "registrationClosedDate", void 0);
__decorate([
    Column(DataType.DATE),
    __metadata("design:type", Date)
], Event.prototype, "projectClosedDate", void 0);
__decorate([
    Column(DataType.DATE),
    __metadata("design:type", Date)
], Event.prototype, "officialStartDate", void 0);
__decorate([
    Column(DataType.DATE),
    __metadata("design:type", Date)
], Event.prototype, "eventEndDate", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Event.prototype, "event_title", void 0);
__decorate([
    Column(DataType.NUMBER),
    __metadata("design:type", Number)
], Event.prototype, "maxFileSize", void 0);
Event = __decorate([
    Table
], Event);
export { Event };
