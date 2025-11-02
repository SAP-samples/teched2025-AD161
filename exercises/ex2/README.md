# Exercise 2 - Build CAP app xtravels

In this exercise, you will create a second CAP app called xtravels.
It is a travel agency app, where you can book travels and flights.
xtravels will consume the flights master data provided by the xflights app.
This time, you don't build the application from scratch, but start with
an almost complete app. The only thing that is missing is the master data entities
`Flights` and `Supplements`, which you will get by importing the API package
provided in the previous exercise.


All file or directory paths in this exercise are relative to the workspace folder _ws_
created in the [Preparation](../ex0/README.md) section.


## Exercise 2.1 - Prepare

Your workspace already contains a folder _xtravels_ with an
almost complete xtravels app, including a Fiori UI in _xtravels/app/travels_.

<br>![](/exercises/ex2/images/02_01_0010.png)

As some parts of the app are missing, the editor may show some error indicators,
e.g. red underlines in file _xtravels/db/schema.cds_. Don't worry about them, they
will disappear when we add the missing parts.

1. Have a look at the main entities of xtravels in file _xtravels/db/schema.cds_:
    * Travels:  
      A list of travels. Each travel is assigned to a customer and has some flight bookings.
    * Passengers:  
      The list of customers.
    * Bookings:  
      A list of flight bookings. This entity has an association to a `Flights` entity,
      and there is also an association to a `Supplements`entity.
      Both association targets are currently missing. The using directive in the beginning of
      the file indicates that these entities are expected to be in file _xtravels/db/master-data.cds_,
      but this file currently is empty. The missing entities will later be provided by
      the API package exported from xflights.

    <br>![](/exercises/ex2/images/02_01_0020.png)

2. In VS Code, split the terminal:

    <br>![](/exercises/ex2/images/02_01_0030.png)

3. In the new terminal, change to the _xtravels_ folder (assuming the terminal has opened in your workspace root folder _ws_):
    ```sh
    cd xtravels
    ```

    Your VS Code window should now look like this:

    <br>![](/exercises/ex2/images/02_01_0040.png)



## Exercise 2.2 - Import API package for flights

After completing these steps, you will have imported the API package with the flight data
that you have exported from the xflights app in the previous exercise.

1. In the _xtravels_ terminal, execute
    ```sh
    npm add xflights-flights-data
    ```

2. Look into _xtravels/package.json_. A new dependency has been added:

    <br>![](/exercises/ex2/images/02_02_0010.png)
    
    Due to the workspace definition in _package.json_ (the one in the _ws_ folder),
    the exported API package in _apis_ is used to satisfy this new dependency.
    In _node\_modules_, you can find a symbolic link for _xflights-flight-data_ pointing
    to _apis/flights-data_.



## Exercise 2.3 - Use the master data

After completing this step, you will have a complete xtravels app.

Add the following content to the empty file _xtravels/db/master-data.cds_ to
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

A projection is defined on top of the external `Flights` entity.
Some elements of the associated entities `Airlines` and `Airports` are directly added
to the projection via associations `airline`, `origin`, and `destination`.
In addition, a simple projection is defined on top of the external entity `Supplements`.
Each access to flights and supplements from any part of the xtravels app is made
via these projections.



## Exercise 2.4 - Inspect how the xflights data is used

The imported entities `Flights` and `Supplements` are used in various places:
* In file _xtravels/db/schema.cds_, entity `Bookings` has an association to `Flights`
  and an association to `Supplements`.
* In file _xtravels/srv/travel-service.cds_, `Flights` is explicitly exposed in service `TravelService`.



## Exercise 2.5 - Run the xtravels app with flights being mocked

After completing these steps, you will have xtravels running with the entities
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
The entities in this service are represented as tables in the SQLite in-memory database
and are filled with _csv_ data from the imported package:

    <br>![](/exercises/ex2/images/02_05_0010.png)



4. Open the automatically served index page in your browser at [localhost:4004](http://localhost:4004/).

5. Click the link [/travels/webapp](http://localhost:4004/travels/webapp/index.html) to start the Fiori UI.
You should see a full fledged xtravels app:

    <br>![](/exercises/ex2/images/02_05_0020.png)



## Exercise 2.6 - Get flights data from xflights app

After completing these steps, you will have both apps xflights and xtravels running,
with xtravels being connected to the xflights app as data source for flight data.

As technique for the data transfer we here use "Data Federation via Initial Load replication".
On startup of xtravels, the CAP runtime recognizes that service `sap.capire.flights.data`
is served in another app (xflights), where entities `Flights` and `Supplements` are exposed.
xtravels then calls out to xflights, fetches all the data and caches it locally.

This automatic replication is not part of the released standard CAP functionality,
but a preview of what we are currently working on.
It is implemented as a plugin directly in the xtravels app. You can have a look at the
implementation at [xtravels/.plugins/fed-xrv](/ws/xtravels/.plugins/fed-xrv).
Besides the "Initial Load Replication", we are working on other ways of integration,
e.g. also directly in the database.


1. Stop `cds watch` in the xtravels terminal by typing `Ctrl+C`.

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

5. Observe the output of `cds watch` in the xflights terminal.  
Here you can see the incoming calls (from xtravels) to `GET` the
data from entities `Flights` and `Supplements`.

    <br>![](/exercises/ex2/images/02_06_0030.png)

6. Go to the index page [localhost:4004](http://localhost:4004/) of the xtravels app
and start the [xtravels web app](http://localhost:4004/travels/webapp/index.html).

    You see exactly the same UI with the same data as above when running xtravels im mock mode.
    In our simple example, the "test" data exported to the API package
    is the same as the data in the running xflights app. So by just looking at the UI
    you can't see any difference between the real data federation scenario and running
    xtravels with mocked flight data.



## Exercise 2.7 - Cleanup

In order to keep things simple, you will again use mocked master data entities
`Flights` and `Supplements` in the remaining exercises.

1. Stop `cds watch` in the xtravels terminal by typing `Ctrl+C`.

2. Stop `cds watch` in the xflights terminal by typing `Ctrl+C`.

3. Close the xflights terminal.
    <br>![](/exercises/ex2/images/02_07_0010.png)



## Summary

You've now created CAP app xtravels and consumed the master data served by the xflights app.
So far we have been only looking at CAP level Data Federation with service level replication.
In the next section we will apply the principles of CAP Data Federation to consume a BDC Data Product.

Continue to - [Exercise 3 - Consume S/4 Data Product Customer](../ex3/README.md)
