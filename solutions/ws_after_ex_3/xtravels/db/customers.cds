using { sap.s4com.Customer.v1 as Cust } from 'sap-s4com-customer-v1';

namespace sap.capire.travels.masterdata;

entity Customers as projection on Cust.Customer {
  Customer as ID,
  CustomerName as FullName,
  StreetName as Street,
  PostalCode,
  CityName as City,
  TelephoneNumber1 as PhoneNumber
}
