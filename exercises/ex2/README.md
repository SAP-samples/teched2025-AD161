# Exercise 2 - Build CAP app xtravels

In this exercise, we will create a second CAP app called xtravels.
This app will consume the flights masterdata provided by the xflights app.
This time, we don't build the application from scratch, but start with
an almost complete app.


All file or directory paths in this exercise are relative to the workspace folder _ws_
crated in the [Preparation](../ex0/README.md) section.


## Exercise 2.1 - Prepare

Your workspace already contains a folder _xtravels_ with an
almost finished xtravels app.
<br>![](/exercises/ex2/images/02_01_0010.png)

You may have noticed that there are some errors. This is ok - for now.

1. Have a look at file _xtravels/db/master-data.cds_. It is empty. If we had wanted to build a "monolithic"
app, the entities for flights, airlines, etc. would be located here. Instead, we will later place
some projections on the imported API in this file.

2. Have a look at the main entities of _xtravels_ in file _xtravels/db/schema.cds_:
    * Travels
      A list of travel bookings. Each booking assigned to a customer and consists
      of some flight bookings.
    * Bookings
      A list of flight bookings. This entity has an association `Flight`, which currently is broken, as
      
       Each booking refers to a flight from the Flights entity
      (which is currently missing, but will be added soon) and can aslo have some
      supplements (which refer to a Supplements entity that is also not yet there).
    * Passengers
      The list of customers which book the travels.

    <br>![](/exercises/ex2/images/02_01_0020.png)


3. In VS code, split the terminal:
<br>![](/exercises/ex2/images/02_01_0030.png)

4. In the new terminal window, change to the _xtravels_ folder:
    ```sh
    cd xtravels
    ```

    Your VS code window should now look like this:
    <br>![](/exercises/ex2/images/02_01_0040.png)



## Exercise 2.2 - Import API package for flights

Now we import the API package with the flight data that we have exported from the
xflights app in the previous exercise.

In the _xtravels_ terminal, execute
```sh
npm add xflights-flights-data
```

A new dependency has been added to _xtravels/package.json_:
```jsonc
{
  // ...
  "dependencies": {
    // ...
    "xflights-flights-data": "^1.0.0"
  }
}
```

As there is a _package.json_ with a workspace definition in the workspace folder _ws_, the exported package
is used to satisfy the new dependendcy. In the _node_modules_ folder you will find a symbolic link.



## Exercise 2.3 - Use the masterdata

There already is an empty file _xtravels/db/masterdata_. Add this content into this file:
```cds
using { sap.capire.flights.data as external } from 'xflights-flights-data';
namespace sap.capire.travels.masterdata;

@federated entity Flights as projection on external.Flights {
  *,
  airline.icon     as icon,
  airline.name     as airline,
  origin.name      as origin,
  destination.name as destination,
}

@federated entity Supplements as projection on external.Supplements {
  ID, type, descr, price, currency
}
```

The package name `xflights-flights-data` in the `from` clause of the `using`
directive is resolved via the dependency in the _package.json_ and
eventually points to the exported package in the _apis_ folder.

We put a projection on the external Flights entity, where we directly
add fields of the associated entities `Airlines` and `Airports`.
All accesses to flights from any part of the XTravels applications is
through this projection.

Have a look at file _db/schema.cds_. Notice association
`Flight` and composition `Supplements` in entity `Bookings`,
which point to the two projections created in _db/masterdata_.


## Exercise 2.4 - Inspect how the xflights data is used

The imported `Flights` entity is used in various places:
* In file _xtravels/db/schema.cds_, entity `Bookings` has an association to `Flights`.
* In addition, `Flights` is explicitly exposed in service `TravelService` (_xtravels/srv/travel-service.cds_).



## Exercise 2.5 - Run the XTravels app with flights being mocked

In the console for _xtravels_, start the xtravels app.
```sh
cds watch
```


If you see errors like
```
[persistent-queue] - DataFederationService: Emit failed: Error: Error during request to remote service: Error
```
then
* ensure to stop all instances of `cds watch`
* go to your home directory
* delete file `.cds-services.json`
* restart `cds watch` in the xtravels terminal


The output indicates that imported service `sap.capire.flights.data` is mocked:
```
[cds] - mocking sap.capire.flights.data {
  at: [ '/odata/v4/data', '/rest/data', '/hcql/data' ],
  decl: '..\\apis\\flights-data\\services.csn:3',
  impl: '..\\node_modules\\@sap\\cds\\srv\\app-service.js'
}
```


The entities in this service are for mocking represented as a tables on the
SQLite in-database and filled with data from the _csv_ files from the imported package:
```
[cds] - connect to db > sqlite { url: ':memory:' }
  > init from ..\apis\flights-data\data\sap.capire.flights.data.Supplements.csv 
  > init from ..\apis\flights-data\data\sap.capire.flights.data.Flights.csv 
  > init from ..\apis\flights-data\data\sap.capire.flights.data.Airports.csv 
  > init from ..\apis\flights-data\data\sap.capire.flights.data.Airlines.csv 
```

Go to the [index page](http://localhost:4004/) of the xtravels app and start the 
[xtravels web app](http://localhost:4004/travels/webapp/index.html).

You should see a full fledged xtravels app, looking similar to this:
<br>![](/exercises/ex2/images/02_05_0010.png)

<!-- If you go back to the app, you will see that the Flights data has changed and now reflects the
data from the XFlights app. -->


## Exercise 2.6 - Get flights data from xflights app

But now we want to really use the XFlights app as data source for the master data of XTravels.


First, stop `cds watch` in XTravels by typing `Ctrl + C` in the xtravels terminal.

Then, start `cds watch` in the xflights terminal:
```sh
cds watch
```

Then, restart `cds watch` in the xtravels terminal:
```sh
cds watch
```
Observe the output.
This time the xtravels app recognizes that there is another app (xflights) that
exposes service `sap.capire.flights.data` and connects to that service
rather than mocking it:
```
[cds] - connect to sap.capire.flights.data > hcql { url: 'http://localhost:4005/hcql/data' }
[cds] - using auth strategy {
  kind: 'mocked',
  impl: '..\\node_modules\\@sap\\cds\\lib\\srv\\middlewares\\auth\\basic-auth.js'
}
```


, you will recognize ... 
it finds the data service served by the other app.

What has happened here is "Data Federation via Initial Load replication".
The CAP framework recognizes that data for Flights and Supplements
is served in another app (-> XFlights) via the `hcql` protocol. So on startup of XTravels,
it makes calls to XFlights and fetches the required data from there.

```
[cds.data] - initially loaded: {
  entity: 'sap.capire.travels.masterdata.Supplements',
  from: 'sap.capire.flights.data',
  via: 'hcql'
}
[cds.data] - initially loaded: {
  entity: 'sap.capire.travels.masterdata.Flights',
  from: 'sap.capire.flights.data',
  via: 'hcql'
}
```


<br>![](/exercises/ex2/images/02_06_0010.png)


The call goes to the xflights app, where you can see how it is served in
the output of the xflights terminal:
```
[hcql] - GET /hcql/data/ {
  SELECT: {
    from: { ref: [ 'sap.capire.flights.data.Supplements' ] },
    columns: [
      { ref: [ 'ID' ], as: 'ID' },
      { ref: [ 'type_code' ], as: 'type_code' },
      { ref: [ 'descr' ], as: 'descr' },
      { ref: [ 'price' ], as: 'price' },
      { ref: [ 'currency_code' ], as: 'currency_code' }
    ]
  }
}
[hcql] - GET /hcql/data/ {
  SELECT: {
    from: { ref: [ 'sap.capire.flights.data.Flights' ] },
    columns: [
      { ref: [ 'ID' ], as: 'ID' },
      { ref: [ 'airline', 'name' ], as: 'airline' },
      { ref: [ 'origin', 'name' ], as: 'origin' },
      { ref: [ 'destination', 'name' ], as: 'destination' },
      { ref: [ 'departure' ], as: 'departure' },
      { ref: [ 'arrival' ], as: 'arrival' },
      { ref: [ 'distance' ], as: 'distance' },
      { ref: [ 'date' ], as: 'date' },
      { ref: [ 'aircraft' ], as: 'aircraft' },
      { ref: [ 'price' ], as: 'price' },
      { ref: [ 'currency_code' ], as: 'currency_code' },
      { ref: [ 'maximum_seats' ], as: 'maximum_seats' },
      { ref: [ 'occupied_seats' ], as: 'occupied_seats' },
      { ref: [ 'free_seats' ], as: 'free_seats' },
      { ref: [ 'airline', 'icon' ], as: 'icon' }
    ]
  }
}
```



Note: in our simple example here the "test" data exported to the API package
is the same as the data in the running XFlights app. So by just looking at the UI
you can't see any difference between the real data federation scenario and running
XTravels with mocked master-date. In real applications, this is different, of course.

Besides the "initial load replication", we are working on other ways of integration,
e.g. also directly in the database. For more information, visit session ... link to Daniel's deep dive.


Go to the [index page](http://localhost:4004/) of the xtravels app and start the 
[xtravels web app](http://localhost:4004/travels/webapp/index.html).

## Exercise 2.7 - Cleanup

As clean-up for the next exercise, stop `cds watch` both
in the xtravels and in the xflights terminal.

Close the xflights terminal.


## Summary

You've now created CAP app xtravels and consumed the masterdata served by the xflights app.

Continue to - [Exercise 3 - Consume S/4 Data Product Customer](../ex3/README.md)
