// Finance V2 — AP Mock Service (Phase 4)
// Self-contained — does NOT touch existing MockDataService

import { Injectable, signal, computed } from '@angular/core';
import {
  ApSupplier, ApInvoice, ApPayment, ApDashboardKpi,
  PaymentAllocation, InvoiceStatus, PaymentStatus
} from './ap.interfaces';

@Injectable({ providedIn: 'root' })
export class ApMockService {

  // ─── Suppliers (20) ────────────────────────────────────────────────────────
  readonly suppliers = signal<ApSupplier[]>([
    { id:'s1',  code:'SUP-001', nameEn:'Saudi Aramco Services Ltd',      nameAr:'أرامكو السعودية للخدمات',      taxNumber:'310000000001', vatNumber:'310000000001003', commercialReg:'1010001001', address:'Dhahran', city:'Dhahran',    country:'SA', contactPerson:'Ali Al-Ghamdi',     contactEmail:'ali@aramco.com',      contactPhone:'+966501000001', paymentTerms:'Net 30',  currency:'SAR', creditLimit:5_000_000, openBalance:920_000,   outstandingInvoices:2, lastPaymentDate:'2025-06-25', lastPaymentAmount:1_200_000, status:'Active',      rating:5, bankName:'Riyad Bank',          iban:'SA0000000000000000001', category:'Drilling Services', notes:'', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'s2',  code:'SUP-002', nameEn:'Gulf Equipment Co.',             nameAr:'شركة الخليج للمعدات',          taxNumber:'310000000002', vatNumber:'310000000002003', commercialReg:'1010001002', address:'Riyadh',   city:'Riyadh',    country:'SA', contactPerson:'Tariq Al-Zahrani',  contactEmail:'tariq@gec.sa',        contactPhone:'+966501000002', paymentTerms:'Net 45',  currency:'SAR', creditLimit:2_000_000, openBalance:244_000,   outstandingInvoices:3, lastPaymentDate:'2025-06-15', lastPaymentAmount:120_000,   status:'Active',      rating:4, bankName:'Al Rajhi Bank',       iban:'SA0000000000000000002', category:'Maintenance',       notes:'', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'s3',  code:'SUP-003', nameEn:'National Gas & Chemicals',       nameAr:'الوطنية للغاز والكيماويات',    taxNumber:'310000000003', vatNumber:'310000000003003', commercialReg:'1010001003', address:'Jubail',   city:'Jubail',    country:'SA', contactPerson:'Nasser Al-Dosari', contactEmail:'nasser@ngc.sa',       contactPhone:'+966501000003', paymentTerms:'Net 60',  currency:'SAR', creditLimit:3_000_000, openBalance:84_000,    outstandingInvoices:1, lastPaymentDate:'2025-06-28', lastPaymentAmount:84_000,    status:'Active',      rating:4, bankName:'SAB Bank',            iban:'SA0000000000000000003', category:'Chemicals',         notes:'', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'s4',  code:'SUP-004', nameEn:'Al-Rashid Steel Industries',     nameAr:'الراشد للصناعات الحديدية',     taxNumber:'310000000004', vatNumber:'310000000004003', commercialReg:'1010001004', address:'Jeddah',   city:'Jeddah',    country:'SA', contactPerson:'Fahad Al-Rashid',  contactEmail:'fahad@rashid.sa',     contactPhone:'+966501000004', paymentTerms:'Net 30',  currency:'SAR', creditLimit:1_500_000, openBalance:0,         outstandingInvoices:0, lastPaymentDate:'2025-06-29', lastPaymentAmount:284_000,   status:'Active',      rating:3, bankName:'SNB',                 iban:'SA0000000000000000004', category:'Tubulars',          notes:'', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'s5',  code:'SUP-005', nameEn:'Schlumberger Arabia Ltd',        nameAr:'شلمبرجير العربية',             taxNumber:'310000000005', vatNumber:'310000000005003', commercialReg:'1010001005', address:'Khobar',   city:'Khobar',    country:'SA', contactPerson:'Jean Dubois',      contactEmail:'jdubois@slb.com',     contactPhone:'+966501000005', paymentTerms:'Net 30',  currency:'USD', creditLimit:8_000_000, openBalance:1_750_000, outstandingInvoices:4, lastPaymentDate:'2025-06-01', lastPaymentAmount:890_000,   status:'Active',      rating:5, bankName:'HSBC Saudi Arabia',   iban:'SA0000000000000000005', category:'Drilling Services', notes:'', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'s21', code:'SUP-021', nameEn:'FZ Drilling Logistics',          nameAr:'المنطقة الحرة للخدمات اللوجستية', taxNumber:'310000000021', vatNumber:'310000000021003', commercialReg:'1010001021', address:'FZ Area',  city:'FZ City',   country:'AE', contactPerson:'Adel Al-Ali',       contactEmail:'adel@fzdl.ae',        contactPhone:'+971501000021', paymentTerms:'Net 30',  currency:'AED', creditLimit:3_000_000, openBalance:150_000,   outstandingInvoices:1, lastPaymentDate:'2025-06-20', lastPaymentAmount:100_000,   status:'Active',      rating:4, bankName:'ADIB',                iban:'AE0000000000000000021', category:'Logistics',         notes:'', branchId:'FreeZone', branchName:'Free Zone' }
  ]);

  // ─── Invoices (30) ─────────────────────────────────────────────────────────
  readonly invoices = signal<ApInvoice[]>([
    this.mkInv('inv1','INV-AP-2025-0047','SINV-SLB-9920','s5','Schlumberger Arabia Ltd','شلمبرجير العربية','PR-2025-0012','RFQ-2025-0018','QTN-2025-0018-02','PO-2025-0031','GRN-2025-0028','CC-110','Rig Drilling Project','WH-01','Rig Store', 'USD','2025-06-20','2025-07-20','Net 30', 440000,0,0,15,66000,0,0,506000,0,506000,'Current','Approved',  'PO','',false,true, [],true,false,false,false,false,false,'Reem','2025-06-20','Finance Dept','Sara Al-Rasheed','2025-06-22',[]),
    this.mkInv('inv2','INV-AP-2025-0046','SINV-HAL-0881','s6','Halliburton Saudi Arabia','هاليبرتون السعودية','PR-2025-0011','RFQ-2025-0017','QTN-2025-0017-01','PO-2025-0030','GRN-2025-0027','CC-110','Rig Drilling Project','WH-01','Rig Store', 'USD','2025-06-18','2025-08-02','Net 45', 320000,0,0,15,48000,0,0,368000,0,368000,'Current','Approved',  'PO','',false,true, [],true,false,false,false,false,false,'Reem','2025-06-18','Finance Dept','Sara Al-Rasheed','2025-06-20',[]),
    this.mkInv('inv3','INV-AP-2025-0045','SINV-GEC-3310','s2','Gulf Equipment Co.','شركة الخليج للمعدات','PR-2025-0009','RFQ-2025-0014','QTN-2025-0014-01','PO-2025-0027','GRN-2025-0024','CC-121','Rig Maintenance','WH-02','Maintenance Store','SAR','2025-06-15','2025-07-30','Net 45', 120000,0,0,15,18000,0,0,138000,138000,0,'Current','Paid',       'GRN', '',true, true, ['Payment_PV2025-009.pdf'],true,false,false,false,false,false,'Ibrahim','2025-06-15','Finance Dept','Sara Al-Rasheed','2025-06-17',[]),
    this.mkInv('inv4','INV-AP-2025-0044','SINV-NGC-0882','s3','National Gas & Chemicals','الوطنية للغاز والكيماويات','PR-2025-0010','RFQ-2025-0015','QTN-2025-0015-01','PO-2025-0028','GRN-2025-0025','CC-111','Gas Production Field','WH-03','Field Warehouse','SAR','2025-06-28','2025-08-27','Net 60', 84000, 0,0,15,12600,0,0,96600, 0,96600,'Current','Ready For Payment','PO','',true,true, [],true,false,false,false,false,false,'Reem','2025-06-28','Finance Dept','Sara Al-Rasheed','2025-06-29',[]),
    this.mkInv('inv5','INV-AP-2025-0043','SINV-ABU-0221','s12','Abunayyan Trading Corp.','شركة أبونيان التجارية','PR-2025-0008','RFQ-2025-0013','QTN-2025-0013-01','PO-2025-0026','GRN-2025-0023','CC-220','Admin & HSE','WH-04','HSE Store','SAR','2025-06-14','2025-07-14','Net 30', 75000, 2,1500,15,10950,0,0,84450,0,84450,'Current','Under Review','PO','',true,false,[],true,false,false,false,false,false,'Reem','2025-06-14','Finance Dept','','',       []),
    this.mkInv('inv_fz1','INV-FZ-AP-01','SINV-FZDL-01','s21','FZ Drilling Logistics','المنطقة الحرة للخدمات اللوجستية','PR-2025-0020','RFQ-2025-0022','QTN-2025-0022-01','PO-2025-0040','GRN-2025-0035','CC-110','FZ Log Operations','WH-05','FZ Yard','AED','2025-06-18','2025-07-18','Net 30', 150000,0,0,15,22500,0,0,172500,0,172500,'Current','Approved','PO','',true,true,[],true,false,false,false,false,false,'Reem','2025-06-18','Finance Dept','Sara Al-Rasheed','2025-06-20',[], 'FreeZone', 'Free Zone')
  ]);

  // ─── Payments (15) ─────────────────────────────────────────────────────────
  readonly payments = signal<ApPayment[]>([
    { id:'pv1',  voucherNumber:'PV-2025-009', paymentDate:'2025-06-30', paymentMethod:'Bank Transfer', bankName:'SAB Bank — Main (1121)',    chequeNumber:'', referenceNumber:'TRF-JUNE-001', currency:'SAR', totalAmount:138000,  status:'Posted',    remarks:'Gulf Equipment payment — June maint.', createdBy:'Reem Al-Muaiqel', createdDate:'2025-06-29', approvedBy:'Sara Al-Rasheed', approvalDate:'2025-06-30', attachments:['PV-2025-009.pdf'], allocations:[ { invoiceId:'inv3',  invoiceNumber:'INV-AP-2025-0045', supplierId:'s2',  supplierName:'Gulf Equipment Co.',         dueAmount:138000,  allocatedAmount:138000,  discount:0 } ], branchId:'HeadOffice', branchName:'Head Office', branchCode:'HeadOffice' },
    { id:'pv2',  voucherNumber:'PV-2025-008', paymentDate:'2025-06-29', paymentMethod:'Bank Transfer', bankName:'SAB Bank — Main (1121)',    chequeNumber:'', referenceNumber:'TRF-ARS-001',  currency:'SAR', totalAmount:326600,  status:'Posted',    remarks:'Al-Rashid Steel final payment.',       createdBy:'Reem Al-Muaiqel', createdDate:'2025-06-28', approvedBy:'Sara Al-Rasheed', approvalDate:'2025-06-29', attachments:[],                  allocations:[ { invoiceId:'inv8',  invoiceNumber:'INV-AP-2025-0040', supplierId:'s4',  supplierName:'Al-Rashid Steel Industries', dueAmount:326600,  allocatedAmount:326600,  discount:0 } ], branchId:'HeadOffice', branchName:'Head Office', branchCode:'HeadOffice' },
    { id:'pv_fz1', voucherNumber:'PV-FZ-2025-01', paymentDate:'2025-06-20', paymentMethod:'Bank Transfer', bankName:'ADIB Bank (1121)',      chequeNumber:'', referenceNumber:'TRF-FZ-001',    currency:'AED', totalAmount:100000,  status:'Posted',    remarks:'FZ Logistics initial payment.',        createdBy:'Reem Al-Muaiqel', createdDate:'2025-06-19', approvedBy:'Sara Al-Rasheed', approvalDate:'2025-06-20', attachments:[],                  allocations:[ { invoiceId:'inv_fz1', invoiceNumber:'INV-FZ-AP-01',    supplierId:'s21', supplierName:'FZ Drilling Logistics',        dueAmount:172500,  allocatedAmount:100000,  discount:0 } ], branchId:'FreeZone', branchName:'Free Zone', branchCode:'FreeZone' }
  ]);

  // ─── AP Dashboard KPIs (computed) ─────────────────────────────────────────
  readonly kpi = computed<ApDashboardKpi>(() => {
    const invs   = this.invoices();
    const pmts   = this.payments();
    const today  = '2025-07-01';
    const month  = '2025-07';
    return {
      totalOutstanding:  invs.filter(i => i.balanceDue > 0).reduce((s,i) => s + i.balanceDue, 0),
      waitingApproval:   invs.filter(i => i.status === 'Under Review').length,
      readyForPayment:   invs.filter(i => i.status === 'Ready For Payment').length,
      paidThisMonth:     pmts.filter(p => p.paymentDate.startsWith(month) && p.status === 'Posted').reduce((s,p) => s + p.totalAmount, 0),
      overdueInvoices:   invs.filter(i => i.aging !== 'Current' && i.status !== 'Paid' && i.status !== 'Closed').length,
      avgPaymentDays:    32
    };
  });

  // ─── Helper builder ────────────────────────────────────────────────────────
  private mkInv(
    id: string, invNum: string, suppInvNum: string,
    suppId: string, suppName: string, suppNameAr: string,
    pr: string, rfq: string, qtn: string, po: string, grn: string,
    cc: string, project: string, wh: string, whName: string,
    currency: string, invDate: string, dueDate: string, terms: any,
    subtotal: number, discPct: number, discAmt: number,
    vatPct: number, vatAmt: number, whTaxPct: number, whTaxAmt: number,
    grand: number, paid: number, balance: number,
    aging: any, status: InvoiceStatus, source: any,
    rejReason: string, pdfAtt: boolean, dnAtt: boolean, attachments: string[],
    missingPO: boolean = false, missingGRN: boolean = false, amtExceedsPO: boolean = false,
    qtyExceeds: boolean = false, dupNum: boolean = false, vatMismatch: boolean = false,
    createdBy: string = 'Reem Al-Muaiqel', createdDate: string = invDate,
    reviewedBy: string = '', approvedBy: string = '', approvalDate: string = '',
    lines: any[] = [],
    branchId: string = 'HeadOffice',
    branchName: string = 'Head Office'
  ): ApInvoice {
    return {
      id, invoiceNumber: invNum, supplierInvoiceNumber: suppInvNum,
      supplierId: suppId, supplierName: suppName, supplierNameAr: suppNameAr,
      prNumber: pr, rfqNumber: rfq, quotationNumber: qtn, poNumber: po, grnNumber: grn,
      projectCode: cc, projectName: project, warehouseCode: wh, warehouseName: whName, costCenterCode: cc,
      currency, invoiceDate: invDate, dueDate, paymentTerms: terms,
      subtotal, discountPct: discPct, discountAmount: discAmt,
      vatPct, vatAmount: vatAmt, withholdingTaxPct: whTaxPct, withholdingTaxAmount: whTaxAmt,
      grandTotal: grand, paidAmount: paid, balanceDue: balance, aging,
      status, source, remarks: '', financeRemarks: '', rejectionReason: rejReason,
      invoicePdfAttached: pdfAtt, deliveryNoteAttached: dnAtt, attachments,
      createdBy, createdDate, reviewedBy, approvedBy, approvalDate, lines,
      validation: { missingPO, missingGRN, amountExceedsPO: amtExceedsPO, qtyExceedsReceived: qtyExceeds, duplicateNumber: dupNum, vatMismatch },
      branchId, branchName, branchCode: branchId
    };
  }
}
