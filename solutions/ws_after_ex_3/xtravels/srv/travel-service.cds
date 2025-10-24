using { sap, sap.capire.travels as db } from '../db/schema';

service TravelService {

  entity Travels as projection on db.Travels actions {
    action createTravelByTemplate() returns Travels;
    action rejectTravel();
    action acceptTravel();
    action deductDiscount( percent: Percentage not null ) returns Travels;
  }

  // Also expose Flights and Currencies for travel booking UIs and Value Helps
  @readonly entity Flights as projection on db.masterdata.Flights;
  @readonly entity Currencies as projection on sap.common.Currencies;

  entity Passengers as projection on db.Passengers;
  entity Customers as projection on db.masterdata.Customers;

}


type Percentage : Integer @assert.range: [1,100];
