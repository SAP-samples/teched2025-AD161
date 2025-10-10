# Exercise 1 - Build CAP app xflights

In this exercise, we will create the xflights app from scratch. We will run the app locally
and query its data via OData requests.

All file or directory paths in this exercise are relative to the workspace folder _ws_
crated in the [Preparation](../ex0/README.md) section.


## Exercise 1.1 - Create xflights project

After completing these steps you will have the basic project strucure of the xflights app.

1. In VS Code, open a terminal and create the xflights project with
    ```sh
    cds init xflights
    ```
    This creates a directory _xflights_ with the basic structure for a CAP app.

2. In folder _xflights_, add a file _.env_ with this content:
    ```
    # Start on port 4005 by default, leaving 4004 for the xtravels app
    cds.server.port = 4005
    ```

3. Even though the app is still empty, we already now start it.
    In the terminal, change to directory _xflights_ and run `cds watch`:
    ```sh
    cd xflights
    cds watch
    ```
    When we add stuff to the app, `cds watch` will automatically pick it up.

4. See the output in the terminal:
    ```
    cds serve all --with-mocks --in-memory? 
    ( live reload enabled for browsers ) 

            ___________________________

    [cds] - loaded model from 1 file(s):

      ..\<path>\node_modules\@sap\cds\srv\outbox.cds

    [cds] - connect using bindings from: { registry: '~/.cds-services.json' }
    [cds] - connect to db > sqlite { url: ':memory:' }
    /> successfully deployed to in-memory database. 

    [cds] - server listening on { url: 'http://localhost:4005' }
    [cds] - server v9.3.1 launched in 782 ms
    [cds] - [ terminate with ^C ]


        No service definitions found in loaded models.
        Waiting for some to arrive...
    ```

    Note that due to the _.env_ file, xflights is started on port 4005.
    This becomes important later, when we start the xtravels app in parallel.


## Exercise 1.2 - Add the domain model

After completing these steps you will have defined the essential entities of the xflights app.

1. The first part of the new app is the domain model.
In folder _xflights/db_, create a file named _schema.cds_.
Copy the content of [assets/ex1/schema.cds](../../assets/ex1/schema.cds)
into the new file. The file defines the following entities:

    * Airlines  
      A list of airlines that operate flights
    * Airports  
      Airports where flights depart and arrive  
    * Connections  
      Defines flight connections. Each connection is operated by an airline
      and has a departure and an arrival airport.
    * Flights  
      Lists the concrete flights, i.e. a connection operated at a given date.
    * Supplements  
      Things you can add to a flight, like additional luggage, food, drinks.

    <br>![](/exercises/ex1/images/01_02_0010.png)


2. Observe the console output for `cds watch`. As soon as you save the file _schema.cds_,
the still running cds watch reacts immediately with new output like this:
    ```
    [cds] - loaded model from 3 file(s):

      ..\<path>\node_modules\@sap\cds\srv\outbox.cds
      db\schema.cds
      ..\<path>\node_modules\@sap\cds\common.cds

    [cds] - connect using bindings from: { registry: '~/.cds-services.json' }
    [cds] - connect to db > sqlite { url: ':memory:' }
    /> successfully deployed to in-memory database. 

    [cds] - server listening on { url: 'http://localhost:4005' }
    [cds] - server v9.3.1 launched in 784 ms
    [cds] - [ terminate with ^C ]

        No service definitions found in loaded models.
        Waiting for some to arrive...
    ```

    cds watch detected the changes in _db/schema.cds_ and automatically
    bootstrapped an in-memory SQLite database when restarting the server process.




### __TODO__
Error: The module '\\?\C:\SAPDevelop\node\cap\DEV\cds-dk\node_modules\better-sqlite3\build\Release\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 108. This version of Node.js requires
NODE_MODULE_VERSION 127. Please try re-compiling or re-installing

do we have to run _npm install_?




## Exercise 1.3 - Add OData service

After completing these steps you will have an OData service for the _xflights_ app.

Now we add an OData service that allows to see the data. This could be extended to a full fledged
maintenance UI for the xflights app, but this is not part of this lecture.

1. In folder _xflights/srv_, create a file _fiori-service.cds_ and fill it with this content:
    ```cds
    using { sap.capire.flights as my } from '../db/schema';

    @fiori service FlightsService {
      entity Connections as projection on my.Connections;
      entity Flights as projection on my.Flights;
      entity Airlines as projection on my.Airlines;
      entity Airports as projection on my.Airports;
      entity Supplements as projection on my.Supplements;
    }
    ```
    This service simply exposes all the metadata entities as one-to-one projections.

2. See output of `cds watch`:
    ```
    [cds] - loaded model from 4 file(s):

      ..\<path>\node_modules\@sap\cds\srv\outbox.cds
      srv\fiori-service.cds
      db\schema.cds
      ..\<path>\node_modules\@sap\cds\common.cds

    [cds] - connect using bindings from: { registry: '~/.cds-services.json' }
    [cds] - connect to db > sqlite { url: ':memory:' }
    /> successfully deployed to in-memory database.

    [cds] - using auth strategy {
      kind: 'mocked',
      impl: '..\\<path>\\node_modules\\@sap\\cds\\lib\\srv\\middlewares\\auth\\basic-auth.js'
    }
    [cds] - serving FlightsService {
      at: [ '/odata/v4/flights' ],
      decl: 'srv\\fiori-service.cds:3',
      impl: '..\\<path>\\node_modules\\@sap\\cds\\srv\\app-service.js'
    }
    [cds] - server listening on { url: 'http://localhost:4005' }
    [cds] - server v9.3.1 launched in 6595 ms
    [cds] - [ terminate with ^C ]
    ```

    Open the automatically served index page in your browser: [localhost:4005](http://localhost:4005/).
    The entities are exposed via OData, but are still empty.



## Exercise 1.4 - Add test data

After completing these steps you will have test data in the _xflights_ app.

Now we have a service that allows to see the content of the metadata entities,
but this is still a bit boring, as we don't have any data in the tables.
We will now add some CSV files with data to the xflights app.

1. Copy the folder [assets/ex1/data](../../assets/ex1/data) into folder _xflights/db_.
The result should look like this:
<br>![](/exercises/ex1/images/01_04_0010.png)


2. Observe the console output: cds watch automatically restarts and detects the data files:
    ```
    [cds] - connect using bindings from: { registry: '~/.cds-services.json' }
    [cds] - connect to db > sqlite { url: ':memory:' }
      > init from db\data\sap.capire.flights-SupplementTypes.csv 
      > init from db\data\sap.capire.flights-Supplements.texts.csv 
      > init from db\data\sap.capire.flights-Supplements.csv 
      > init from db\data\sap.capire.flights-Flights.csv 
      > init from db\data\sap.capire.flights-Connections.csv 
      > init from db\data\sap.capire.flights-Airports.csv 
      > init from db\data\sap.capire.flights-Airlines.csv 
    /> successfully deployed to in-memory database.
    ```

3. Go back to the index page [localhost:4005](http://localhost:4005/) and click on any of the files to see the new content.


## Exercise 1.5 - Fiori preview

After completing these steps you will have preconfigured columns in the Fiori preview.

If you use the Fiori preview functionality of the index page, you have to
manually configure the columns to be displayed. This can be avoided
by adding a few Fiori `@UI.LineItems` annotations that define a default layout
for entites `Flights` and `Connections`.

1. In folder _xflights/app_, create a new file _layout.cds_ and copy the contents
of [assets/ex1/layout.cds](../../assets/ex1/layout.cds) into the new file.

2. Wait until `cds watch` has picked up the changes, then go back to the
index page on [localhost:4005](http://localhost:4005/) and click the
"Fiori proview" link for entitiy `Flight` or `Connections`.


## Exercise 1.6 - Localized metadata

After completing these steps you will have localized labels in the Fiori preview.

In the Fiori preview, you see that the columns labels are just the element names.
We want to display appropriate labels in the correct language.

1. In folder _xflights/db_, add a file _labels.cds_ and copy the content of
[assets/ex1/labels.cds](../../assets/ex1/labels.cds) into the new file. This adds
the `@title` annotation to some of the elements of the domain model entities.

2. The values of the annotations are `i18n` keys. We need to also get the respective texts into our app.
Copy the folder [assets/ex1/_i18n](../../assets/ex1/_i18n) into folder _xflights_.

    The result should look like this:
    <br>![](/exercises/ex1/images/01_06_0010.png)

3. Go back to the browser window with the Fiori preview and refresh.
Notice the change in the column labels.


## Exercise 1.7 - Add API service

After completing these steps you will have an additional service
that acts as an API to retrieve some data from the _xflights_ app.

1. In folder _xflights/srv_, add a file _data-service.cds_ with this content:
    ```cds
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
    ```

    In this service, entity `Flights` is not a simple one-to-one projection of the
    respective entity in the domain model. Instead of having two separate entities
    for connections and flights, we pull in the connection data directly
    into the `Flights` entity ("denormalization").

    We have added some annotations to the service that control how the data of the entities
    is made available: via OData, via plain rest, and via the CAP specific `hcql` protocol
    (which basically is an extension of SQL that adds support for path expressions).

2. Assuming that `cds watch` is still running, you can go to the index page in the browser
and see the new service being presented via these protocols.

3. Click for example the [Flights](http://localhost:4005/odata/v4/data/Flights) link in
the section for the rest service to see the data.
Notice how the connection data has become part of the Flight data.


## Exercise 1.8 - Export API service

After completing these steps you will have an API package for
the new service `sap.capire.flights.data`.

In [Exercise 2](../ex2/README.md) we will create the _xtravels_ app,
which calls the API service `sap.capire.flights.data` of _xflights_
to get flights data. In order to do that, _xtravels_ needs a definition
of the API.

We now export the new service as an "API package" that can be seemlessly integrated
in other apps.
This package contains everything that is needed in a consuming app, and it also
contains some test data.

1. In the terminal, stop `cds watch` via `Ctrl+C`.

2. Run the command
    ```sh
    cds export -s sap.capire.flights.data --to ../apis/flights-data
    ```
    This creates the API package directly inside our workspace.

3. Have a look at the new folder _apis/flights-data_.
<br>![](/exercises/ex1/images/01_08_0010.png)

    The most important part is the service definition in _apis/flights-data/services.csn_.
    Note that here the `query` part has been stripped off from the entities, as they are
    not relevant for defining the API. Besides that, the localized metadata that is used
    in the service is part of the package as well as some test data.

4. As the auto-exposure mechanism of the compiler doesn't yet seemlessly work
together with exporting and importing APIs, we need to apply a workaround.
Add these lines to the file _apis/flights-data/index.cds_:
    ```cds
    // Workaround for @cds.autoexpose kicking in too eagerly ...
    annotate sap.common.Currencies with @cds.autoexpose:false;
    annotate sap.common.Countries with @cds.autoexpose:false;
    annotate sap.common.Languages with @cds.autoexpose:false;
    ```


## Exercise 1.9 - Cleanup

If you haven't done yet, stop `cds watch` by typing `Ctrl+C` into the terminal.




## Summary

You've now created CAP app xflights that serves as source for flight masterdata.

Continue to - [Exercise 2 - Build CAP app xtravels](../ex2/README.md)

