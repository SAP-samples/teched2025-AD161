# Exercise 4 - Deploy to SAP HANA Cloud

In this exercise, you will deploy the database model of the xtravels app
to a HANA Cloud instance and connect the Data Product entity `Customer`
to a BDC tenant.
You will run the xtravels app in [hybrid mode](https://cap.cloud.sap/docs/advanced/hybrid-testing#hybrid-testing):
the app still runs locally on your laptop, but is connected to an HDI container in a HANA Cloud instance.


This session focuses on the CAP part of the integration with a BDC Data Product.
Prior to the session, we have already
* prepared a BDC tenant with the "Customer" Data Product installed
* created a HANA remote source in the HANA instance, which points to the share (see also [assets/ex4/HANA-setup](../../assets/ex4/HANA-setup.md))
* created a schema `DP_VT_CUSTOMER` in the HANA instance with virtual tables pointing
  to the share tables in the BDC tenant.
* prepared a user-provided service `grantor-dp-admin` in Cloud Foundry that holds credentials for accessing this schema.

You will connect the Data Product entities in the CAP app to these virtual tables via synonyms.

<br>![](/exercises/ex4/images/04_00_0010.png)



## Exercise 4.1 - Log on to Cloud Foundry

After completing these steps, you will have logged on to Cloud Foundry via
the Cloud Foundry CLI. This is necessary to deploy the database part of xtravels
to HANA via the CDS CLI in subsequent steps.

We have prepared a subaccount in BTP that has access to a HANA instance.
In the subaccount, there already are users for this exercise.
Your username is `capworkshopuser+0XX@gmail.com`, where `XX` is the number
assigned to you in the beginning of the session.

1. Go to the xtravels terminal and execute
    ```sh
    cf login -a https://api.cf.eu10-005.hana.ondemand.com --origin aoykcp1ee-platform
    ```

2. At the prompt, enter user and password. Replace XX with your number and
use the password provided to you at the beginning of the session.
    ```
    Email: capworkshopuser+0XX@gmail.com
    Password: ...
    ```



## Exercise 4.2 - Deploy to SAP HANA Cloud

After completing these steps, you will have deployed the database model
of xtravels to HANA. The Data Product entities are still mocked as plain tables.

1. Before you actually deploy, go to the xtravels terminal and run
    ```sh
    cds build --for hana
    ```

2. Look at the build output in _xtravels/gen/db/src/gen_.  
The Data Product entities are still mocked, so you will find corresponding _.hdbtable_ files,
like _sap.s4com.Customer.v1.Customer.hdbtable_.

    <br>![](/exercises/ex4/images/04_02_0010.png)

3. Deploy the database schema of your xtravels app to SAP HANA Cloud: in the xtravels terminal, run
    ```sh
    cds deploy --to hana
    ```

    This will automatically create an HDI container in the HANA Cloud instance and 
    deploy the database model of your app to it.

    Note that a file `.cdsrc-private.json` has been created in the _xtravels_ folder.
    When running the app in hybrid mode in the next step, this file helps to bind
    the `db` service of the app to a managed Cloud Foundry service of kind `hana`
    with plan `hdi-shared` that represents your HDI container.



## Exercise 4.3 - Run in hybrid mode

After completing these steps, you will have your xtravels app running locally on your laptop,
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
You still see the same test data as before, only now the data isn't coming from an
SQLite in-memory database, but from a table in the HANA instance filled with the same
test data.

4. Stop `cds watch` by typing `Ctrl+C` into the xtravels terminal.



## Exercise 4.4 - Bind grantor service

After completing this step, you will have bound the grantor service
that has been provided as a Cloud Foundry User Provided Service.

In the next step you will define synonyms to connect the Data Product entities
with virtual tables on schema `DP_VT_CUSTOMERS`.
For deploying these synonyms, the HDI user needs access to this schema.
In the Cloud Foundry environment there already is a user-provided service `grantor-dp-admin`
that holds the credentials needed to grant access for schema `DP_VT_CUSTOMERS` to the HDI user.

Bind the grantor service by running
```sh
cds bind grantor-dp-admin --to grantor-dp-admin
```

This adds an entry for the grantor service to _xtravels/.cdsrc-private.json_.



## Exercise 4.5 - (optional) Manually connect to BDC share

If you have enough time, you can now manually create all the necessary artefacts to
connect the `Customer` entity in the imported API package via a synonym to the
virtual table in schema `DP_VT_CUSTOMER`. Alternatively, you can directly
jump to [Exercise 4.6 - Connect to BDC share](./README.md#exercise-46---connect-to-bdc-share)
and let CAP do the necessary steps.

1. Open file _xtravels/db/customer.cds_ and add the following line at the end of the file:
    ```cds
    annotate Cust.Customer with @cds.persistence.exists;
    ```

    With this annotation, no table will be created for the entity.

2. In folder _xtravels/db/data_, rename the file _sap.s4com-Customer.v1.Customer.csv_ to _sap.s4com-Customer.v1.Customer.txt_.

    This is simply to avoid that the _.csv_ file with test data for `Customer` is deployed.
    Otherwise the deployment would fail, because there is no `Customer` table anymore.

3. Create a folder _xtravels/db/src_.

4. In the new folder, create a file _.hdbgrants_ with the following content:
    ```json
    {
      "grantor-dp-admin": {
        "object_owner": { 
          "schema_privileges" : [
            {
              "schema" : "DP_VT_CUSTOMER",
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

5. In folder _xtravels/db/src_, create a file _sap.s4com.Customer.v1.Customer_syn.hdbsynonym_ with the following content:
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

6. In the same folder, create a file _sap.s4com.Customer.v1.Customer.hdbview_ with the following content:
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

7. In the same folder, create a file _.hdiconfig_ with the following content:
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

    Your folder structure should now look like this:

    <br>![](/exercises/ex4/images/04_05_0030.png)


8. Deploy to HANA: in the xtravels terminal, run
    ```sh
    cds bind --exec -- cds deploy --to hana
    ```

    Note that the deploy command is slightly different from the one used above.

    After successful deployment, entity `Customer` is now connected via a synonym
    to a virtual table in schema `DP_VT_CUSTOMER`.

9. Start the app in hybrid mode: in the xtravels terminal, run
    ```sh
    cds watch --profile hybrid
    ```

10. Start the [xtravels web app](http://localhost:4004/travels/webapp/index.html).

    Look at the data. You will notice that the customer data (names, address, ...)
    has changed, because you no longer see the local mock data, but the data from the
    Data Product in the BDC tenant.

11. In the next exercise, the files that you have here created manually will be automatically produced
by the `cds build`. In order for this to work, you have to clean up a bit:
    * Stop `cds watch` by typing `Ctrl+C` in the xtravels terminal.
    * Delete folder _xtravels/db/src_.
    * In folder _xtravels/db/data_, rename the file _sap.s4com-Customer.v1.Customer.txt_ back to _sap.s4com-Customer.v1.Customer.csv_.
    * In file _xtravels/db/customer.cds_, remove the line with the `annotate` statement.

    Your folder structure should now look like this:

    <br>![](/exercises/ex4/images/04_05_0041.png)


## Exercise 4.6 - Connect to BDC share

After completing these steps, you will have connected the `Customer` entity
in the imported API package via a synonym to the virtual table in schema `DP_VT_CUSTOMER`.

The xtravels app already contains a build plugin (_xtravels/.plugins/dp-syn_), which modifies
the output of `cds build` accordingly. Like the plugin that was used in
[Exercise 2.6 - Get flights data from xflights app](../ex2/README.md#exercise-26---get-flights-data-from-xflights-app),
this plugin is not released standard CAP functionality, but a preview of what we are currently working on.

The plugin is activated via configuration. Here you have to provide the schema in which the virtual tables
for the Data Product entities in the imported API package can be found.

1. Open file _xtravels/package.json_ and add a `cds` section:
    ```json
    {
      ... existing content ...
      "cds": {
        "requires": {
          "sap.s4com.Customer.v1": {
            "schema": "DP_VT_CUSTOMER",
            "grantor": "grantor-dp-admin"
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
case sensitive names in BDC with "unquoted" database names in CAP CDS.

4. Deploy to HANA: in the xtravels terminal, run
    ```sh
    cds bind --exec -- cds deploy --to hana
    ```

    After successful deployment, entity `Customer` is now connected via a synonym
    to a virtual table in schema `DP_VT_CUSTOMER`, which via a HANA Remote Source
    points to a delta share table in a BDC tenant filled with sample data of an S/4
    test system.

5. Start the app in hybrid mode:
    ```sh
    cds watch --profile hybrid
    ```

6. Go to the [xtravels web app](http://localhost:4004/travels/webapp/index.html).  

    Look at the data. You will notice that the customer data (names, address, ...)
    has changed, because you no longer see the local mock data, but the data from the
    Data Product in the BDC tenant.

    <br>![](/exercises/ex4/images/04_06_0010.png)



## Summary

You've now deployed the database part of the xtravels app to HANA Cloud
and consumed data from a Data Product in BDC.
