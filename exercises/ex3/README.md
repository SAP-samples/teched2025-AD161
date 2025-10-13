# Exercise 3 - Consume S/4 Data Product Customer

From a modelling point of view, there is no difference between consuming
data from another CAP app (like we did in the previous exercise) or consuming
a Data Product:
* we import a package that describes the API
* we define consumption views on top of the imported entities 
* we use the consumption views in the model

In this exercise, we will import the metadata for S/4 Data Product "Customer" to the xtravels app.
We will then replace local entity `Passenger` with entity `Customer` from the Data Product.

<br>![](/exercises/ex3/images/03_00_0010.png)



## Exercise 3.1 - Discovery

After completing these steps you will have found Data Product "Customer" from S/4
in [SAP Business Accelerator Hub](https://api.sap.com/).

1. Go to [SAP Business Accelerator Hub](https://api.sap.com/).

    <br>![](/exercises/ex3/images/03_01_0010.png)

2. In the top row, go to tab [Data Products](https://api.sap.com/dataproducts).

    <br>![](/exercises/ex3/images/03_01_0020.png)

3. Here you can browse the available Data Products.
Enter "Customer"  in the search field and press "Return".

    <br>![](/exercises/ex3/images/03_01_0030.png)

4. Click on the tile for Data Product [Customer](https://api.sap.com/dataproduct/sap-s4com-Customer-v1/overview).

    <br>![](/exercises/ex3/images/03_01_0040.png)



## Exercise 3.2 - Download Data Product metadata

After completing these steps you will have downloaded a CSN file with the metadata of
Data Product "Customer" to _ws/xtravels_.

1. At the bottom of the screen, follow the link to the
[Delta Sharing API](https://api.sap.com/api/sap-s4com-Customer-v1/overview).

    <br>![](/exercises/ex3/images/03_02_0010.png)

    The ORD ID uniquely identifies this API.

2. Download the CSN Interop JSON. It will probably be stored
as file _sap-s4com-Customer-v1.json_ in directory _C:\Users\TE-XX\Downloads_.

3. Copy the file to folder _xtravels_ in your workspace.



## Exercise 3.3 - Import Data Product metadata

After completing these steps you will have imported the Data Product's
metadata as API package into your xtravels project.

1. Go to the terminal of the xtravels app.

2. Import the Data Product metadata to the CDS model of the xtravel app
with this command:
    ```sh
    cds import --data-product sap-s4com-Customer-v1.json
    ```

    The import creates a folder _xtravels\apis\imported\sap-s4com-customer-v1_
    that structurally is almost identical to the API package of the xflights app.

    <br>![](/exercises/ex3/images/03_03_0010.png)

3. Have a look at file _services.cds_ in the new folder.  
Here you find the Data Product `Customer` represented as a service,
and the data sets of the Data Product are represented as entities:
    ```cds
    @cds.external : true
    @data.product : true
    @protocol : 'none'
    service sap.s4com.Customer.v1 {
      entity Customer {
        key Customer : String(10);
        CustomerName : String(80);
        CustomerFullName : String(220);
        //...
      }
      entity CustomerCompanyCode {
        key Customer : String(10);
        key CompanyCode : String(4);
        AccountingClerk : String(2);
        ReconciliationAccount : String(10);
        //...
      }
      //...
    }
    ```

    The name of the service reflects the ORD ID of the Data product.

4. Have a look at file _annotations.cds_ in the new folder.  
The Data Product entities come with a lot of annotations, e.g. `@title` for labels.
The corresponding localized texts are also part of the Data Products's API package in folder _\_i18n_.

5. Have a look at file _xtravels/package.json_. A new dependency has been added:

    <br>![](/exercises/ex3/images/03_03_0020.png)


6. In the xtravels terminal, run
    ```sh
    npm install
    ```



## Exercise 3.4 - Add consumption view

After completing these steps you will have a CDS view that acts as
interface to entity `Customer` of the imported API.

1. In folder _xtravels/db_, add a new file _customer.cds_.

2. Fill the new file with this content:
    ```cds
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
    ```

This is a so called "consumption" view that acts as single point of
access to the Data Product entity. All references to the Data Product
in your app's model and custom code should address this entity.

In the consumption view, you select only those elements of the Data Product entity
that you actually want to use in your application.
Here we also rename the fields of the imported Data Product entity `Customer` so
that the names match those of entity `Passengers`, which we are going to replace.

We won't use the other entities of the Data Product in our xtravels app,
thus we don't add consumption views for them.



## Exercise 3.5 - Use the Data Product in the model

After completing these steps you will have replaced local entity `Passenger`
with entity `Customer` of the Data Product.

1. In file _xtravels/db/schema.cds_, below the `using` directives at the top of the file, add
    ```cds
    using {
      sap.capire.travels.masterdata.Customers // the consumption view
    } from './customer';
    ```

2. In the same file, adapt entity `Travels` so that it now uses the consumption view `Customer` instead
of entity `Passengers`.  
    Change the target of association `Customer` from
    ```cds
    Customer     : Association to Passengers;
    ```
    to
    ```cds
    Customer     : Association to Customers;
    ```

3. In file _xtravels/srv/travel-service.cds_, add a projections for
    `Customer` below the projection for `Passenger` inside service `TravelService`:
    ```cds
      entity Customers as projection on db.masterdata.Customers;
    ```

No further adaptations of the model are necessary. This of course is only possible
because the xtravels app was from the beginning designed in such a way that
entity `Passengers` can easily be replaced by the Data Product entity `Customers`.



## Exercise 3.6 - Mock

After completing these steps you will have run the xtravels app with
the Data Product entity `Customers` being mocked by a local table.

Following the CAP principle of "local development and testing", we first want
to test our xtravels app with the Data Product entities being mocked by local
tables in a SQLite in-memory database.

1. Add some test data: copy file
[assets/ex3/sap.s4com-Customer.v1.Customer.csv](../../assets/ex3/sap.s4com-Customer.v1.Customer.csv)
to folder _xtravels/db/data_. This provides some test data for mocking the
`Customer` entity.

    <br>![](/exercises/ex3/images/03_06_0010.png)


2. In the xtravels terminal, run
  ```sh
  cds watch
  ```

3. Observe the console output. It indicates that a local table is created for `Customer`
and is filled with the data from the csv file.

    <br>![](/exercises/ex3/images/03_06_0020.png)

<!--
    ```
    [cds] - connect to db > sqlite { url: ':memory:' }
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Supplements.csv 
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Flights.csv 
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Airports.csv 
      > init from ..\apis\flights-data\data\sap.capire.flights.data.Airlines.csv 
      > init from db\data\sap.s4com-Customer.v1.Customer.csv    // <---------------------
      > init from db\data\sap.capire.travels-TravelStatus.texts.csv 
      > init from db\data\sap.capire.travels-TravelStatus.csv 
      > init from db\data\sap.capire.travels-Travels.csv 
      > init from db\data\sap.capire.travels-TravelAgencies.csv 
      > init from db\data\sap.capire.travels-Passengers.csv 
      > init from db\data\sap.capire.travels-Bookings.Supplements.csv 
      > init from db\data\sap.capire.travels-Bookings.csv
    ```
-->

4. Open the automatically served index page in your browser at [localhost:4004](http://localhost:4004/).

5. Click the link [/travels/webapp](http://localhost:4004/travels/webapp/index.html) to start the Fiori UI.  

The app should look like the last time you have started it.
This time, however, we see different data for "Customer", namely the test data we have just added via the csv file.
Some labels have changed as well, as the imported Data Product has its own `@title` annotations and
its own _\_i18n_ texts.



## Exercise 3.7 - Cleanup

Stop `cds watch` by typing `Ctrl+C` into the xtravels terminal.



## Summary

You've now imported S/4 Data Product "Customer" and tested the app locally with
the Data Product entities being mocked.

Continue to - [Exercise 4 - Deploy to SAP HANA Cloud](../ex4/README.md)
