using { sap, sap.capire.flights as my } from '../db/schema';

// Service for data integration

@hcql @rest @odata 
service sap.capire.flights.data {

  // Serve Flights data with inlined connection details
  @readonly entity Flights as projection on my.Flights {
    key flight.ID, flight.{*} excluding { ID },
    key date, // preserve the flight date as a key
    *, // include all other fields from my.Flights
    maximum_seats - occupied_seats as free_seats : Integer,
  } excluding { flight };

  // Serve Airlines, Airports, and Supplements data as is
  @readonly entity Airlines as projection on my.Airlines;
  @readonly entity Airports as projection on my.Airports;
  @readonly entity Supplements as projection on my.Supplements;
}

// temporary workaround for taming @cds.autoexpose
annotate sap.common.Currencies with @cds.autoexpose:false;
annotate sap.common.Countries with @cds.autoexpose:false;
annotate sap.common.Languages with @cds.autoexpose:false;
