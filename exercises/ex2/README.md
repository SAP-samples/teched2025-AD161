# Exercise 2 - Build CAP app xtravels

In this exercise, we will create a second CAP app called xtravels.
It is kind of a travel agency app, where you can book travels and flights.
xtravels will consume the flights masterdata provided by the xflights app.
This time, we don't build the application from scratch, but start with
an almost complete app.


All file or directory paths in this exercise are relative to the workspace folder _ws_
crated in the [Preparation](../ex0/README.md) section.


## Exercise 2.1 - Prepare

Your workspace already contains a folder _xtravels_ with an
almost complete xtravels app, including a Fiori UI in _xtravels/app/travels_.

<br>![](/exercises/ex2/images/02_01_0010.png)

1. Have a look at the main entities of xtravels in file _xtravels/db/schema.cds_:
    * Travels  
      A list of travels. Each travel is assigned to a customer and has some flight bookings.
    * Passengers  
      The list of customers.
    * Bookings  
      A list of flight bookings. This entity has an association to a `Flights` entity,
      and there is also an association to a `Supplements`entity.
      Both association targets are currently missing. The using directives in the beginning of
      the file indicates that these entities are expected to be in file _xtravels/db/master-data.cds_,
      but this file currently is empty. The missing entities will later be provided by
      the API package exported from xflights.

    <br>![](/exercises/ex2/images/02_01_0020.png)

2. In VS code, split the terminal:

    <br>![](/exercises/ex2/images/02_01_0030.png)

3. In the new terminal window, change to the _xtravels_ folder:
    ```sh
    cd xtravels
    ```

    Your VS code window should now look like this:

    <br>![](/exercises/ex2/images/02_01_0040.png)



## Exercise 2.2 - Import API package for flights

After completing these steps you will have imported the API package with the flight data
that we have exported from the xflights app in the previous exercise.

1. In the _xtravels_ terminal, execute
    ```sh
    npm add xflights-flights-data
    ```

2. Look into _xtravels/package.json_. A new dependency has been added:

    <br>![](/exercises/ex2/images/02_02_0010.png)
    
    Due to the workspace definition in _package.json_ (the one in the _ws_ folder),
    the exported API package in _apis_ is used to satisfy this new dependendcy.
    In _node\_modules_, you will find a symbolic link for _xflights-flight-data_ pointing
    to _apis/flights-data_.



## Exercise 2.3 - Use the masterdata

After completing this step you will have a complete xtravels app.

Add the following content to the empty file _xtravels/db/masterdata_ to
provide the missing entities `Flights` and `Supplements`:

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
directive is resolved via the dependency in _xtravels/package.json_ and
eventually points to the API package in the _apis_ folder.

We put a projection on the external `Flights` entity, where we directly
add fields of the associated entities `Airlines` (via association `airline`)
and `Airports` (via associations `origin` and `departure`). In addition,
we put a simple projection on the external entity `Supplements`.
All accesses to flights and supplements from any part of the xtravels app is
through these projections.



## Exercise 2.4 - Inspect how the xflights data is used

The imported entities `Flights` and `Supplements` are used in various places:
* In file _xtravels/db/schema.cds_, entity `Bookings` has an association to `Flights`
  and an association to `Supplements`.
* In file _xtravels/srv/travel-service.cds_, `Flights` is explicitly exposed in service `TravelService`.



## Exercise 2.5 - Run the XTravels app with flights being mocked

After completing these steps you will have xtravels running with the entities
from the API package being mocked by local entities.

1. In the terminal for _xtravels_, start the xtravels app.
    ```sh
    cds watch
    ```

2. If `cds watch` works without errors, ignore this step.  
    If you see errors like
    ```
    [persistent-queue] - DataFederationService: Emit failed: Error: Error during request to remote service: Error
    ```
    then
    * ensure to stop all instances of `cds watch`
    * go to your home directory
    * delete file `.cds-services.json`
    * restart `cds watch` in the xtravels terminal


3. Observe the output of `cds watch`.  
The output indicates that imported service `sap.capire.flights.data` is mocked.
The entities in this service are represented as tables in the SQLite in-memory database
and are filled with _csv_ data from the imported package:

    <br>![](/exercises/ex2/images/02_05_0010.png)

<!--
    ```
    [cds] - connect to db > sqlite { url: ':memory:' }
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Supplements.csv 
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Flights.csv 
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Airports.csv 
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Airlines.csv 

    ....

    [cds] - mocking sap.capire.flights.data {
      at: [ '/odata/v4/data', '/rest/data', '/hcql/data' ],
      decl: '..\\apis\\flights-data\\services.csn:3',
      impl: '..\\node_modules\\@sap\\cds\\srv\\app-service.js'
    }
    ```
-->

4. Open the automatically served index page in your browser at [localhost:4004](http://localhost:4004/).

5. Click the link [/travels/webapp](http://localhost:4004/travels/webapp/index.html) to start the Fiori UI.
You should see a full fledged xtravels app, looking similar to this:

    <br>![](/exercises/ex2/images/02_05_0020.png)



## Exercise 2.6 - Get flights data from xflights app

After completing these steps you will have both apps xflights and xtravels running,
with xtravels being connected to the xflights as data source for flight data.

As technique for the data transfer we use "Data Federation via Initial Load replication".
On startup of xtravels, the CAP framework recognizes that service `sap.capire.flights.data`
is served in another app (xflights), where entities `Flights` and `Supplements` are exposed.
xtravels then calls out to xflights, fetches all the data and caches it locally.

Besides the "Initial Load Replication", we are working on other ways of integration,
e.g. also directly in the database.
For more information, visit session ... __TODO__ link to Daniel's deep dive.


1. Stop `cds watch` in the xtravels terminal by typing `Ctrl-C`.

2. Start `cds watch` in the xflights terminal:
    ```sh
    cds watch
    ```

3. Restart `cds watch` in the xtravels terminal:
    ```sh
    cds watch
    ```

4. Observe the output of `cds watch` in the xtravels terminal.
This time the xtravels app recognizes that there is another app (xflights) that
exposes service `sap.capire.flights.data` and connects to that service
rather than mocking it (note that no csv data is loaded for the entites
of this service).

    <br>![](/exercises/ex2/images/02_06_0010.png)

    The data for `Flights` and `Supplements` is immediately loaded:

    <br>![](/exercises/ex2/images/02_06_0020.png)


<!--
    ```
    [cds] - connect to sap.capire.flights.data > hcql { url: 'http://localhost:4005/hcql/data' }
    ```
-->

<!--
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
-->

5. Observe the output of `cds watch` in the xflights terminal.
Here you can see the incoming calls (from xtravels) to `GET` the
data from entities `Flights` and `Supplements`.

    <br>![](/exercises/ex2/images/02_06_0030.png)

<!--
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
-->

6. Go to the index page [localhost:4004](http://localhost:4004/) of the xtravels app
and start the [xtravels web app](http://localhost:4004/travels/webapp/index.html).

    You see exactly the same UI with the same data as above when running xtravels im mock mode.
    In our simple example, the "test" data exported to the API package
    is the same as the data in the running xflights app. So by just looking at the UI
    you can't see any difference between the real data federation scenario and running
    xtravels with mocked flight data.



## Exercise 2.7 - Cleanup

In order to keep things simple, we will again use mocked master-data entities
`Flights` and `Supplements` in the remaining exercises.

1. Stop `cds watch` in the xtravels terminal by typing `Ctrl-C`.

2. Stop `cds watch` in the xflights terminal by typing `Ctrl-C`.

3. Close the xflights terminal.



## Summary

You've now created CAP app xtravels and consumed the masterdata served by the xflights app.

Continue to - [Exercise 3 - Consume S/4 Data Product Customer](../ex3/README.md)
