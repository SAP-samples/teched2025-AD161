# Exercise 4 - Deploy to SAP HANA Cloud

In this exercise, we will deploy the database model of the xtravels app
to a HANA Cloud instance and connect the Data Product entity `Customer`
to a BDC tenant.
We will run the xtravels app in hybrid mode: the app still runs locally on your laptop,
but is connected to an HDI container in a HANA Cloud instance.


In this session, we focus on the CAP part of the integration with a BDC Data Product.
We have already
* prepared a BDC tenant with the "Customer" Data Product installed
* created a HANA remote source in the HANA instance, which points to the share
* created a schema `DP_VT_CUSTOMER` in the HANA instance with virtual tables pointing
  to the share tables in the BDC tenant.

We will connect the Data Product entities in the CAP app to these virtual tables via synonyms.

<br>![](/exercises/ex4/images/04_00_0010.png)



## Exercise 4.1 - Log on to Cloud Foundry

After completing these steps you will have logged on to Cloud Foundry via
the Cloud Foundry CLI. This is necessary to deploy the database part of xtravels
to HANA via the CDS CLI in subsequent steps.

We have prepared a subaccount in BTP that has access to a HANA instance.
In the subaccount, there already are users for this exercise.
Your username is `capworkshopuser+0XX@gmail.com`, where `XX` is the number
assigned to you in the beginning of the session.

1. Go to the xtravels terminal and execute
    ```sh
    cf l -a https://api.cf.eu10-005.hana.ondemand.com --origin aoykcp1ee-platform
    ```

2. At the prompt, enter user and password. Replace XX with your number and
use the password provided to you at the beginning of the session.
    ```
    User: capworkshopuser+0XX@gmail.com
    Password: ...
    ```



## Exercise 4.2 - Deploy to SAP HANA Cloud

After completing these steps you will have deployed the database model
of xtravels to HANA. The Data Product entities are still represented as plain tables.

1. Before we actually deploy, go to the xtravels terminal and run
    ```sh
    cds build --for hana
    ```

2. Look at the build output in _xtravels/gen/db/src/gen_.  
The Data Product entities are still mocked, so you will find corresponding _.hdbtable_ files,
like _sap.s4com.Customer.v1.Customer.hdbtable_.

3. Deploy the database schema of your xtravels app to SAP HANA Cloud: in the xtravels terminal, run
    ```sh
    cds deploy --to hana
    ```

    This will automatically create an HDI container in the HANA Cloud instance and 
    deploy the database model of your app to it.

    Note that a file `.cdsrc-private.json` has been created in the _xtravels_ folder.



## Exercise 4.3 - Run in hybrid mode

After completing these steps you will have your xtravels app running locally on your laptop,
connected to a SAP HANA Cloud instance. The Data Product entities are still mocked by database tables.

1. Start `cds watch` in hybrid mode: In the xtravels terminal, run
    ```sh
    cds watch --profile hybrid
    ```

2. Observe the console output. It shows that the app is started locally,
but this time it is connected to the HANA Cloud instance:

    <br>![](/exercises/ex4/images/04_03_0010.png)

    For the Data Product entity, still a regular table is created and filled with the test data.

<!--
    ```
    [cds] - connect to db > hana {
      database_id: '...',
      host: '...hanacloud.ondemand.com',
      port: '443',
      driver: 'com.sap.db.jdbc.Driver',
      url: '...',
      schema: '...',
      certificate: '...',
      hdi_user: '...',
      hdi_password: '...',
      user: '...',
      password: '...'
    }
    ```
-->

3. Open the [xtravels web app](http://localhost:4004/travels/webapp/index.html).
You can still see the same test data as before, but now the data isn't coming from an
SQLite in-memory database, but from a (mock table in the) HANA instance.

4. Stop `cds watch` by typing `Ctrl+C` into the xtravels terminal.



## Exercise 4.4 - Create grantor service

After completing these steps you will have created a Cloud Foundry user provided
service. This service is needed to grant access for schema `DP_VT_CUSTOMERS`
to the HDI user.

1. In file _xtravels/grantor-dp-admin.json_, replace the three dots by the same password
you have used above to log on to CF.

2. Go to the xtravels terminal and create the service by running
    ```sh
    cf cups grantor-dp-admin -p grantor-dp-admin.json
    ```

3. Bind the new service by running
    ```sh
    cds bind grantor-dp-admin --to grantor-dp-admin
    ```

    This adds a corresponding entry to _xtravels/.cdsrc-private.json_.

4. Create a folder _xtravels/db/src_.

5. In the new folder, create a file _.hdbgrants_ with the following content:
    ```json
    {
      "grantor-dp-admin": {
        "object_owner": { 
          "schema_privileges" : [
            {
              "schema" : "DP_VT_CUSTOMER",
              "privileges" : [ "SELECT" ],
              "privileges_with_grant_option" : [ "SELECT" ]
            }
          ]
        }
      }
    }
    ```

    This file tells the HDI deployer to use the credentials stored in service
    `grantor-dp-admin` to grant `SELECT WITH GRANT OPTION` for schema `DP_VT_CUSTOMER`
    to the HDI user. Without this, the HDI user wouldn't have access to the schema.



## Exercise 4.5 - (optional) Manually connect to BDC share

If you have enough time, you can now manually create all the necessary artefacts to
connect the `Customer` entity in the imported API package via a synonym to the
virtual table in schema `DP_VT_CUSTOMER`. Alternatively, you can directly
jump to [Exercise 4.4 - Connect to BDC share](exercises/ex4/README.md#exercise-44---connect-to-bdc-share)
and let CAP do the necessary steps.

1. Open file _xtravels/db/customer.cds_ and add the following line at the end of the file:
    ```cds
    annotate Cust.Customer with @cds.persistence.exists;
    ```

    With this annotation, no table will be created for the entity.

2. Move the file _sap.s4com-Customer.v1.Customer.csv_ from folder _xtravels/db/data_ to folder _xtravels_.

3. In folder _xtravels/db/src_, create a file _sap.s4com.Customer.v1.Customer_syn.hdbsynonym_ with the following content:
    ```json
    {
      "SAP_S4COM_CUSTOMER_V1_CUSTOMER_SYN": {
        "target": {
          "object": "CUSTOMER",
          "schema": "DP_VT_CUSTOMER"
        }
      }
    }
    ```

    This defines a synonym pointing to the virtual table `CUSTOMER` in the schema `DP_VT_CUSTOMER`.

4. In the same folder, create a file _sap.s4com.Customer.v1.Customer.hdbview_ with the following content:
    ```sql
    VIEW SAP_S4COM_CUSTOMER_V1_CUSTOMER AS SELECT
      "Customer"         AS "CUSTOMER",
      "CustomerName"     AS "CUSTOMERNAME",
      "CityName"         AS "CITYNAME",
      "PostalCode"       AS "POSTALCODE",
      "StreetName"       AS "STREETNAME",
      "TelephoneNumber1" AS "TELEPHONENUMBER1"
    FROM SAP_S4COM_CUSTOMER_V1_CUSTOMER_SYN
    ```

    This mapping view is necessary to align the naming convention of CAP for database names
    with the case sensitive names in the BDC share.

5. In the same folder, creat a file _.hdbconfig_ with the following content:
    ```json
    {
      "file_suffixes": {
        "hdbsynonym": {
          "plugin_name": "com.sap.hana.di.synonym"
        },
        "hdbview": {
          "plugin_name": "com.sap.hana.di.view"
        }
      }
    }
    ```

6. Deploy to HANA: in the xtravels terminal, run
    ```sh
    cds bind --exec -- cds deploy --to hana
    ```

    Note that the deploy command is slightly different from the one used above.

    After successful deployment, entity `Customer` is now connected via a synonym
    to a virtual table in schema `DP_VT_CUSTOMER`.

7. Start the app in hybrid mode: in the xtravels terminal, run
    ```sh
    cds watch --profile hybrid
    ```

8. Start the [xtravels web app](http://localhost:4004/travels/webapp/index.html).  
Look at the data. You will notice that the customer data (names, address, ...)
has changed, because you no longer see the local mock data, but the data from the BDC tenant.

9. In the next exercise, the files we here created manually will be automatically produced
by the `cds build`. In order for this to work, we have to clean up a bit:
    * Stop `cds watch` by typing `Ctrl+C` in the xtravels terminal.
    * In folder _xtravels/db/src_, delete file _.hdiconfig_.
    * In folder _xtravels/db/src_, delete file _sap.s4com.Customer.v1.Customer_syn.hdbsynonym_.
    * In folder _xtravels/db/src_, delete file _sap.s4com.Customer.v1.Customer.hdbview_.
    * Move the file _sap.s4com-Customer.v1.Customer.csv_ from folder _xtravels_ back to folder _xtravels/db/data_.
    * In file _xtravels/db/customer.cds_, remove the line with the `annotate` statement.



## Exercise 4.6 - Connect to BDC share

After completing these steps you will have connected the `Customer` entity
in the imported API package via a synonym to the virtual table in schema `DP_VT_CUSTOMER`.

The xtravels app already contains a build plugin (_xtravels/.plugins/dp-syn_), which modifies
the output of `cds build` accordingly.

The plugin is activated via a configuration. Here we provide the schema in which the virtual tables
for the Data Product entities in the imported API package can be found, and the name of
the grantor service that provides access to the schema.

1. Open file _xtravels/package.json_ and add a `cds` section:
    ```jsonc
    {
      // ...
      "cds": {
        "requires": {
          "sap.s4com.Customer.v1": {
            "schema": "DP_VT_CUSTOMER",
            "credentials": "grantor-dp-admin"
          }
        }
      }
    }
    ```

2. In the xtravels terminal, run
    ```sh
    cds build --for hana
    ```

3. Check the effect of the plugin: look at the build output in _xtravels/gen/db/src/gen_.  
For all entities in the Data Product service `sap.s4com.Customer.v1`, no _.hdbtable_ files
are generated any more. Instead, there are corresponding _.hdbsynonym_ files to connect to
the virtual tables in schema `DP_VT_CUSTOMER`, and _.hdbview_ files that align the
case sensitive names in BDC with "unquoted" names database names in CAP CDS.

4. Deploy to HANA: in the xtravels terminal, run
    ```sh
    cds bind --exec -- cds deploy --to hana
    ```

    After successful deployment, entity `Customer` is now connected via a synonym
    to a virtual table in schema `DP_VT_CUSTOMER`, which via a HANA Remote Source
    points to a delta share table in a BDC tenant filled with sample data of an S/4
    test system.

5. Again start the app in hybrid mode:
    ```sh
    cds watch --profile hybrid
    ```

6. Go to the [xtravels web app](http://localhost:4004/travels/webapp/index.html)
and look at the data. You will notice that the customer data (names, address, ...)
has changed, because you no longer see the local mock data, but the data from the BDC tenant.



## Summary

You've now deployed the database part of the xtravels app to HANA Cloud
and consumed data from a Data Product in BDC.
